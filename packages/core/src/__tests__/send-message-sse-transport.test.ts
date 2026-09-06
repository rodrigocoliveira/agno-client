import { afterEach, describe, expect, test } from 'bun:test';
import { AgnoClient } from '../client';

/**
 * Regression test for the Agno v3 migration: `POST /agents|teams/{id}/runs`
 * always streams SSE (`text/event-stream`), for both foreground and
 * background(+job-queue) execution — verified against `agno==3.0.6` source
 * (`StreamingResponse(..., media_type="text/event-stream")` at every run
 * call site) and a live capture. `sendMessage` must use the SSE parser
 * regardless of the `background` flag; there is no NDJSON fallback anymore.
 */

function makeClient() {
  return new AgnoClient({
    endpoint: 'http://127.0.0.1:0',
    mode: 'agent',
    agentId: 'test-agent',
  });
}

function sseResponse(frames: string): Response {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(frames));
      controller.close();
    },
  });
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
  });
}

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

/**
 * `sendMessage`'s onComplete always refetches session history as the source
 * of truth once a run finishes — respond to that follow-up GET with a
 * matching `RunSchema[]` so `getMessages()` reflects the completed run.
 */
function sessionRunsResponse(runId: string, content: string): Response {
  return new Response(
    JSON.stringify([
      {
        run_id: runId,
        run_input: 'hi',
        content,
        status: 'COMPLETED',
        created_at: new Date().toISOString(),
        tools: [],
        // Non-empty on purpose: convertSessionToMessages treats a run with no
        // events AND non-empty content as a suspected pre-hook exception and
        // skips the agent message entirely.
        events: [{ event: 'RunCompleted' }],
      },
    ]),
    { status: 200 }
  );
}

describe('sendMessage transport (Agno v3)', () => {
  test('parses SSE frames even when background is explicitly false', async () => {
    // sendMessage's onComplete may trigger a follow-up plain `fetch` (session
    // refresh) after the streaming call — capture every call and assert on
    // the streaming one (identified by its FormData body) specifically.
    const capturedInits: RequestInit[] = [];
    global.fetch = (async (_url: string, init?: RequestInit) => {
      capturedInits.push(init ?? {});
      if (init?.body instanceof FormData) {
        const frames =
          'event: RunStarted\ndata: {"event":"RunStarted","run_id":"r1","session_id":"s1","created_at":1}\n\n' +
          'event: RunCompleted\ndata: {"event":"RunCompleted","content":"hello back","created_at":2}\n\n';
        return sseResponse(frames);
      }
      return sessionRunsResponse('r1', 'hello back');
    }) as typeof fetch;

    const client = makeClient();
    await client.sendMessage('hi', { background: false });

    const streamingCallInit = capturedInits.find((init) => init.body instanceof FormData);
    // Accept: text/event-stream is only set by the SSE parser — proves the
    // SSE code path ran rather than a (now-removed) NDJSON path.
    expect((streamingCallInit?.headers as Record<string, string>)?.Accept).toBe(
      'text/event-stream'
    );

    const messages = client.getMessages();
    const agentMessage = messages[messages.length - 1];
    expect(agentMessage.role).toBe('agent');
    expect(agentMessage.content).toBe('hello back');
  });

  test('parses SSE frames when background is true (job-queue execution)', async () => {
    global.fetch = (async (_url: string, init?: RequestInit) => {
      if (init?.body instanceof FormData) {
        const frames =
          'event: RunStarted\ndata: {"event":"RunStarted","run_id":"r2","session_id":"s2","created_at":1}\n\n' +
          'event: RunCompleted\ndata: {"event":"RunCompleted","content":"done in background","created_at":2}\n\n';
        return sseResponse(frames);
      }
      return sessionRunsResponse('r2', 'done in background');
    }) as typeof fetch;

    const client = makeClient();
    await client.sendMessage('hi', { background: true });

    const messages = client.getMessages();
    const agentMessage = messages[messages.length - 1];
    expect(agentMessage.content).toBe('done in background');
  });
});
