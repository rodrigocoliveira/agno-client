import { describe, expect, test } from 'bun:test';
import { AgnoClient } from '../client';

/**
 * Client-level tests for session_state behavior. These exercise the internal
 * wire-up between the EventProcessor's stream handling and the
 * SessionStateManager. They do not touch the network.
 */

function makeClient(overrides = {}) {
  return new AgnoClient({
    endpoint: 'http://127.0.0.1:0',
    mode: 'agent',
    agentId: 'test-agent',
    ...overrides,
  });
}

describe('AgnoClient session_state wiring', () => {
  test('getSessionState() is null on a fresh client', () => {
    const client = makeClient();
    expect(client.getSessionState()).toBeNull();
  });

  test('CustomEvent with session_state updates the cache and emits session-state:change', async () => {
    const client = makeClient();

    const events: Array<Record<string, unknown> | null> = [];
    client.on('session-state:change', (state) => events.push(state));

    // Simulate a CustomEvent chunk arriving from the stream by invoking the
    // private handleChunk through a minimal RunStarted → CustomEvent sequence.
    // We cast to any to reach the private handler — this is the lightest-touch
    // way to verify the wiring without standing up a fake HTTP server.
    const handle = (client as unknown as {
      handleChunk: (chunk: unknown, sid: string | undefined, msg: string) => void;
    }).handleChunk.bind(client);

    handle({ event: 'RunStarted', session_id: 's1', created_at: 0, content_type: 'str' } as any, undefined, 'hi');
    handle(
      {
        event: 'CustomEvent',
        session_id: 's1',
        created_at: 1,
        content_type: 'str',
        session_state: { counter: 5, marker: 'live' },
      } as any,
      's1',
      'hi'
    );

    expect(client.getSessionState()).toEqual({ counter: 5, marker: 'live' });
    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(events[events.length - 1]).toEqual({ counter: 5, marker: 'live' });
  });

  test('CustomEvent without session_state does not clear or change the cache', () => {
    const client = makeClient();
    const handle = (client as unknown as {
      handleChunk: (chunk: unknown, sid: string | undefined, msg: string) => void;
    }).handleChunk.bind(client);

    handle({ event: 'RunStarted', session_id: 's1', created_at: 0, content_type: 'str' } as any, undefined, 'x');
    handle(
      {
        event: 'CustomEvent',
        session_id: 's1',
        created_at: 1,
        content_type: 'str',
        session_state: { counter: 1 },
      } as any,
      's1',
      'x'
    );
    expect(client.getSessionState()).toEqual({ counter: 1 });

    // Second custom event carries unrelated data — state must stay put.
    handle(
      {
        event: 'CustomEvent',
        session_id: 's1',
        created_at: 2,
        content_type: 'str',
        greeting: 'hi',
      } as any,
      's1',
      'x'
    );
    expect(client.getSessionState()).toEqual({ counter: 1 });
  });

  test('extractSessionStateFromCustomEvent: false disables auto-extraction', () => {
    const client = makeClient({ extractSessionStateFromCustomEvent: false });
    const handle = (client as unknown as {
      handleChunk: (chunk: unknown, sid: string | undefined, msg: string) => void;
    }).handleChunk.bind(client);

    handle({ event: 'RunStarted', session_id: 's1', created_at: 0, content_type: 'str' } as any, undefined, 'x');
    handle(
      {
        event: 'CustomEvent',
        session_id: 's1',
        created_at: 1,
        content_type: 'str',
        session_state: { counter: 9 },
      } as any,
      's1',
      'x'
    );
    expect(client.getSessionState()).toBeNull();
  });

  test('custom extractor function is honored', () => {
    const client = makeClient({
      extractSessionStateFromCustomEvent: (e: Record<string, unknown>) =>
        (e.custom_state as Record<string, unknown>) ?? null,
    });
    const handle = (client as unknown as {
      handleChunk: (chunk: unknown, sid: string | undefined, msg: string) => void;
    }).handleChunk.bind(client);

    handle({ event: 'RunStarted', session_id: 's1', created_at: 0, content_type: 'str' } as any, undefined, 'x');
    handle(
      {
        event: 'CustomEvent',
        session_id: 's1',
        created_at: 1,
        content_type: 'str',
        custom_state: { ok: true },
      } as any,
      's1',
      'x'
    );
    expect(client.getSessionState()).toEqual({ ok: true });
  });

  test('agent RunCompleted chunk with session_state updates the cache', () => {
    const client = makeClient();
    const handle = (client as unknown as {
      handleChunk: (chunk: unknown, sid: string | undefined, msg: string) => void;
    }).handleChunk.bind(client);

    handle({ event: 'RunStarted', session_id: 's1', created_at: 0, content_type: 'str' } as any, undefined, 'x');
    handle(
      {
        event: 'RunCompleted',
        session_id: 's1',
        created_at: 2,
        content_type: 'str',
        content: 'done',
        session_state: { counter: 7 },
      } as any,
      's1',
      'x'
    );
    expect(client.getSessionState()).toEqual({ counter: 7 });
  });

  test('clearMessages clears session_state and emits', () => {
    const client = makeClient();
    const handle = (client as unknown as {
      handleChunk: (chunk: unknown, sid: string | undefined, msg: string) => void;
    }).handleChunk.bind(client);

    handle({ event: 'RunStarted', session_id: 's1', created_at: 0, content_type: 'str' } as any, undefined, 'x');
    handle(
      {
        event: 'CustomEvent',
        session_id: 's1',
        created_at: 1,
        content_type: 'str',
        session_state: { counter: 4 },
      } as any,
      's1',
      'x'
    );
    expect(client.getSessionState()).not.toBeNull();

    let cleared: Record<string, unknown> | null | undefined = undefined;
    client.on('session-state:change', (state) => {
      cleared = state as Record<string, unknown> | null;
    });

    client.clearMessages();
    expect(client.getSessionState()).toBeNull();
    expect(cleared).toBeNull();
  });
});
