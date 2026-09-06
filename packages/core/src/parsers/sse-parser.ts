import type { RunResponseContent } from '@rodrigocoliveira/agno-types';

/**
 * Parses SSE frames from a buffered string. Returns the remainder (any partial
 * frame still being accumulated). Each complete frame is parsed as JSON and
 * passed to onChunk.
 *
 * SSE frame format (W3C):
 *   data: <text>
 *   data: <more text>
 *   event: <name>      # optional; ignored — payload's `event` field is canonical
 *   id: <id>           # ignored
 *   retry: <ms>        # ignored
 *   : comment          # ignored
 *   <empty line>       # delimits frames
 *
 * The agno backend ships the meta events (`catch_up`, `replay`, `subscribed`,
 * `error`) and the real run events as JSON payloads whose `event` field
 * disambiguates them, so we don't need to surface the SSE-level `event:` line.
 */
export function parseSSEBuffer(
  buffer: string,
  onChunk: (chunk: RunResponseContent) => void
): string {
  // Normalise CRLF and bare CR to LF so the rest of the function only deals with \n.
  // Covers all three W3C-spec frame delimiters: \n\n, \r\n\r\n, and \r\r.
  let remainder = buffer.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  while (true) {
    const frameEnd = remainder.indexOf('\n\n');
    if (frameEnd === -1) {
      // No complete frame yet; keep accumulating.
      return remainder;
    }

    const frame = remainder.slice(0, frameEnd);
    remainder = remainder.slice(frameEnd + 2);

    const dataLines: string[] = [];
    for (const rawLine of frame.split('\n')) {
      // Trim trailing CR for CRLF-terminated streams.
      const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;
      if (line.length === 0 || line.startsWith(':')) continue;
      if (line.startsWith('data:')) {
        // SSE allows "data:" with optional single space after.
        const value = line.slice(5).replace(/^ /, '');
        dataLines.push(value);
      }
      // event:, id:, retry: — ignored. Payload's `event` field is canonical.
    }

    if (dataLines.length === 0) continue;

    const payload = dataLines.join('\n');
    try {
      const parsed = JSON.parse(payload) as RunResponseContent;
      onChunk(parsed);
    } catch (error) {
      if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
        console.error('Failed to parse SSE frame:', {
          error,
          payload: payload.substring(0, 200) + (payload.length > 200 ? '...' : ''),
        });
      }
      // Skip malformed frame; continue with next.
    }
  }
}

/**
 * Streams an SSE response from the API and processes each frame.
 * Signature mirrors `streamResponse` (NDJSON) so callers can swap parsers via
 * AgnoClient's `executeStream({ streamingFn })`.
 */
export async function streamResponseSSE(options: {
  apiUrl: string;
  headers?: Record<string, string>;
  params?: URLSearchParams;
  requestBody: FormData | Record<string, unknown>;
  onChunk: (chunk: RunResponseContent) => void;
  onError: (error: Error) => void;
  onComplete: () => void;
  signal: AbortSignal;
}): Promise<void> {
  const {
    apiUrl,
    headers = {},
    params,
    requestBody,
    onChunk,
    onError,
    onComplete,
    signal,
  } = options;

  let buffer = '';

  const finalUrl = params && params.toString()
    ? `${apiUrl}?${params.toString()}`
    : apiUrl;

  try {
    const response = await fetch(finalUrl, {
      method: 'POST',
      headers: {
        ...(!(requestBody instanceof FormData) && {
          'Content-Type': 'application/json',
        }),
        Accept: 'text/event-stream',
        ...headers,
      },
      body:
        requestBody instanceof FormData
          ? requestBody
          : JSON.stringify(requestBody),
      signal,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
          // Fallback to status text if JSON parsing fails.
        }
      }

      const error = new Error(errorMessage);
      // Attach status code for 401 / token-refresh detection (same as NDJSON parser).
      (error as Error & { status?: number }).status = response.status;
      throw error;
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        // Flush any pending frame if it has a final delimiter; otherwise discard.
        buffer = parseSSEBuffer(buffer, onChunk);
        onComplete();
        return;
      }

      buffer += decoder.decode(value, { stream: true });
      buffer = parseSSEBuffer(buffer, onChunk);
    }
  } catch (error) {
    // Honor AbortSignal without surfacing as an error (matches NDJSON parser).
    if (error instanceof Error && error.name === 'AbortError') {
      return;
    }

    // Pass real Error instances through unchanged — re-wrapping via
    // `new Error(String(error))` was discarding the `.status` property
    // attached above (needed for 401 token-refresh and 429/409 job-queue
    // detection) and mangling the message with an "Error: " prefix.
    if (error instanceof Error) {
      onError(error);
      return;
    }

    if (typeof error === 'object' && error !== null && 'detail' in error) {
      onError(new Error(String((error as { detail: unknown }).detail)));
    } else {
      onError(new Error(String(error)));
    }
  }
}
