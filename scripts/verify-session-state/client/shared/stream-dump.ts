/**
 * Helpers for the Phase 0 verification scripts.
 *
 * - dumpStream(): reads an SSE-ish JSON stream from a fetch Response,
 *   returns the parsed chunks. Mirrors the behavior of the lib's StreamParser
 *   (brace-counting + dual-format support) without depending on the lib so the
 *   verification stays decoupled.
 * - sendAgentRun() / sendTeamRun(): minimal multipart POST to the run endpoints.
 * - getSessionDetail(): GET /sessions/{id}.
 * - assert(), pass(), fail(): tiny test helpers; fail() exits non-zero.
 */

const ENDPOINT = process.env.AGNO_ENDPOINT ?? 'http://localhost:7777';

export interface StreamChunk {
  event?: string;
  content?: unknown;
  session_id?: string;
  run_id?: string;
  session_state?: Record<string, unknown> | null;
  [key: string]: unknown;
}

export async function dumpStream(response: Response): Promise<StreamChunk[]> {
  if (!response.body) throw new Error('Response has no body');
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const chunks: StreamChunk[] = [];
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let depth = 0;
    let start = -1;
    let inString = false;
    let escape = false;

    for (let i = 0; i < buffer.length; i++) {
      const ch = buffer[i];
      if (inString) {
        if (escape) escape = false;
        else if (ch === '\\') escape = true;
        else if (ch === '"') inString = false;
        continue;
      }
      if (ch === '"') inString = true;
      else if (ch === '{') {
        if (depth === 0) start = i;
        depth++;
      } else if (ch === '}') {
        depth--;
        if (depth === 0 && start >= 0) {
          const raw = buffer.slice(start, i + 1);
          try {
            const parsed = JSON.parse(raw);
            // Lib's StreamParser unwraps `{ event, data }` to `{ ...data, event }` for the new SSE format.
            const normalized: StreamChunk =
              parsed && typeof parsed === 'object' && 'data' in parsed && 'event' in parsed
                ? { ...(parsed.data as Record<string, unknown>), event: (parsed as { event: string }).event }
                : parsed;
            chunks.push(normalized);
          } catch {
            // partial — wait for more data
          }
          start = -1;
        }
      }
    }

    // Trim consumed bytes from the buffer
    if (depth === 0) {
      const lastClose = buffer.lastIndexOf('}');
      if (lastClose >= 0) buffer = buffer.slice(lastClose + 1);
    }
  }

  return chunks;
}

export async function sendAgentRun(agentId: string, message: string, sessionId?: string): Promise<Response> {
  const form = new FormData();
  form.append('message', message);
  form.append('stream', 'true');
  if (sessionId) form.append('session_id', sessionId);
  return fetch(`${ENDPOINT}/agents/${agentId}/runs`, {
    method: 'POST',
    body: form,
  });
}

export async function sendTeamRun(teamId: string, message: string, sessionId?: string): Promise<Response> {
  const form = new FormData();
  form.append('message', message);
  form.append('stream', 'true');
  if (sessionId) form.append('session_id', sessionId);
  return fetch(`${ENDPOINT}/teams/${teamId}/runs`, {
    method: 'POST',
    body: form,
  });
}

export async function getSessionDetail(sessionId: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${ENDPOINT}/sessions/${sessionId}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} on GET /sessions/${sessionId}: ${text}`);
  }
  return (await res.json()) as Record<string, unknown>;
}

let exitCode = 0;

export function pass(message: string): void {
  console.log(`PASS  ${message}`);
}

export function fail(message: string, context?: unknown): void {
  exitCode = 1;
  console.log(`FAIL  ${message}`);
  if (context !== undefined) {
    console.log('       context:', JSON.stringify(context, null, 2));
  }
}

export function assert(cond: unknown, message: string, context?: unknown): asserts cond {
  if (cond) pass(message);
  else fail(message, context);
}

export function done(): void {
  process.exit(exitCode);
}

export function summary(scriptName: string, chunks: StreamChunk[]): void {
  const events = chunks.map((c) => c.event).filter(Boolean);
  console.log(`\n[${scriptName}] received ${chunks.length} chunks; events seen:`);
  const counts = new Map<string, number>();
  for (const e of events) counts.set(e as string, (counts.get(e as string) ?? 0) + 1);
  for (const [name, n] of counts) console.log(`   ${name.padEnd(28)} ${n}`);
  console.log();
}
