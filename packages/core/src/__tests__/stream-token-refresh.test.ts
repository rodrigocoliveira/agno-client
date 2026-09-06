import { afterEach, describe, expect, test } from 'bun:test';
import { AgnoClient } from '../client';

/**
 * A 401 "token has expired" on a streaming call must reach executeStream's
 * token-refresh retry. That requires streamResponseSSE to THROW pre-stream HTTP
 * failures instead of routing them through onError (which made the retry
 * branch unreachable for every streaming call).
 */

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

function sse(frames: string): Response {
  return new Response(frames, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
}

describe('streaming 401 token refresh', () => {
  test('refreshes the token and retries the stream once', async () => {
    const authHeaders: string[] = [];
    let calls = 0;
    global.fetch = (async (_url: string, init?: RequestInit) => {
      if (!(init?.body instanceof FormData)) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      calls++;
      authHeaders.push((init.headers as Record<string, string>).Authorization);
      if (calls === 1) {
        return new Response(JSON.stringify({ detail: 'Token has expired' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return sse('event: RunCompleted\ndata: {"event":"RunCompleted","content":"ok"}\n\n');
    }) as typeof fetch;

    const client = new AgnoClient({
      endpoint: 'http://127.0.0.1:0',
      mode: 'agent',
      agentId: 'a',
      authToken: 'old',
      onTokenExpired: async () => 'new',
    });
    const errors: string[] = [];
    client.on('message:error', (m: string) => errors.push(m));

    await client.sendMessage('hi');

    expect(calls).toBe(2);
    expect(authHeaders).toEqual(['Bearer old', 'Bearer new']);
    expect(errors).toEqual([]);
  });

  test('a non-401 HTTP failure still surfaces through message:error', async () => {
    global.fetch = (async () =>
      new Response(JSON.stringify({ detail: 'boom' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })) as typeof fetch;

    const client = new AgnoClient({ endpoint: 'http://127.0.0.1:0', mode: 'agent', agentId: 'a' });
    const errors: string[] = [];
    client.on('message:error', (m: string) => errors.push(m));

    await client.sendMessage('hi');

    expect(errors).toEqual(['boom']);
  });
});
