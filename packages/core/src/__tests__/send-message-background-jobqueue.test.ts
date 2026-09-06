import { afterEach, describe, expect, test } from 'bun:test';
import { AgnoClient } from '../client';

/**
 * Regression tests for Agno v3's background job queue: `Idempotency-Key`
 * header on background sendMessage, and typed `run:background:error` events
 * for 429 (queue full) / 409 (idempotency conflict) — verified against
 * `agno==3.0.6` source (`job_queue.py`, `agents/router.py`).
 */

function makeClient() {
  return new AgnoClient({ endpoint: 'http://127.0.0.1:0', mode: 'agent', agentId: 'test-agent' });
}

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

describe('sendMessage background job-queue behavior', () => {
  test('sends Idempotency-Key header only for background runs with a key provided', async () => {
    const capturedInits: RequestInit[] = [];
    global.fetch = (async (_url: string, init?: RequestInit) => {
      capturedInits.push(init ?? {});
      return new Response('event: RunCompleted\ndata: {"event":"RunCompleted","content":"ok"}\n\n', {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      });
    }) as typeof fetch;

    const client = makeClient();
    await client.sendMessage('hi', { background: true, idempotencyKey: 'my-key-123' });

    const streamingCall = capturedInits.find((i) => i.body instanceof FormData);
    expect((streamingCall?.headers as Record<string, string>)?.['Idempotency-Key']).toBe('my-key-123');
  });

  test('does not send Idempotency-Key when background is false, even if a key is provided', async () => {
    const capturedInits: RequestInit[] = [];
    global.fetch = (async (_url: string, init?: RequestInit) => {
      capturedInits.push(init ?? {});
      return new Response('event: RunCompleted\ndata: {"event":"RunCompleted","content":"ok"}\n\n', {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      });
    }) as typeof fetch;

    const client = makeClient();
    await client.sendMessage('hi', { background: false, idempotencyKey: 'my-key-123' });

    const streamingCall = capturedInits.find((i) => i.body instanceof FormData);
    expect((streamingCall?.headers as Record<string, string>)?.['Idempotency-Key']).toBeUndefined();
  });

  test('emits run:background:error with status 429 when the job queue is full', async () => {
    global.fetch = (async () => {
      return new Response(JSON.stringify({ detail: 'Job queue is full' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch;

    const client = makeClient();
    const events: any[] = [];
    client.on('run:background:error', (e) => events.push(e));

    await client.sendMessage('hi', { background: true });

    expect(events).toHaveLength(1);
    expect(events[0].status).toBe(429);
    expect(events[0].message).toBe('Job queue is full');
  });

  test('emits run:background:error with status 409 on an Idempotency-Key conflict', async () => {
    global.fetch = (async () => {
      return new Response(
        JSON.stringify({ detail: 'Idempotency-Key was already used by a different component' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }) as typeof fetch;

    const client = makeClient();
    const events: any[] = [];
    client.on('run:background:error', (e) => events.push(e));

    await client.sendMessage('hi', { background: true, idempotencyKey: 'reused-key' });

    expect(events).toHaveLength(1);
    expect(events[0].status).toBe(409);
  });

  test('does not emit run:background:error for a foreground (non-background) run', async () => {
    global.fetch = (async () => {
      return new Response(JSON.stringify({ detail: 'nope' }), { status: 429 });
    }) as typeof fetch;

    const client = makeClient();
    const events: any[] = [];
    client.on('run:background:error', (e) => events.push(e));

    await client.sendMessage('hi', { background: false });

    expect(events).toHaveLength(0);
  });
});
