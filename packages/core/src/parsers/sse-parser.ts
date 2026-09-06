import type { RunResponseContent } from '@rodrigocoliveira/agno-types';
import { httpError } from '../utils/http-error';

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

  const isAbort = (error: unknown) => error instanceof Error && error.name === 'AbortError';

  // Failures before the first byte of the stream (network, non-2xx) are THROWN rather
  // than routed through onError: nothing has been delivered yet, so the caller can act
  // on `.status` and safely retry the whole request (e.g. refresh an expired token).
  let response: Response;
  try {
    response = await fetch(finalUrl, {
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
  } catch (error) {
    if (isAbort(error)) return;
    throw error instanceof Error ? error : new Error(String(error));
  }

  if (!response.ok) {
    throw await httpError(response, `HTTP ${response.status}: ${response.statusText}`);
  }
  if (!response.body) {
    throw new Error('No response body');
  }

  // Mid-stream failures go to onError: content has already been delivered, so a
  // blind retry would replay it.
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  try {
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
    if (isAbort(error)) return;
    onError(error instanceof Error ? error : new Error(String(error)));
  }
}
