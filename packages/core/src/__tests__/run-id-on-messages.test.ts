import { describe, expect, test } from 'bun:test';
import { AgnoClient } from '../client';
import { SessionManager } from '../managers/session-manager';
import type { RunSchema } from '@rodrigocoliveira/agno-types';

/**
 * Regression tests for issue #15 — `run_id` must be exposed on `ChatMessage`
 * so consumers can correlate a conversation round (user + agent pair, or a
 * paused/continued run) with backend traces / metrics / feedback.
 *
 * Three flows covered:
 *  1. Streaming: `RunStarted` backfills `run_id` on the optimistic user
 *     message + agent placeholder added in `sendMessage()`.
 *  2. Session reload: `convertSessionToMessages` propagates `run.run_id` to
 *     both the user and agent message of each round.
 *  3. HITL pause: a `RunPaused` event arriving after `RunStarted` does not
 *     wipe the `run_id` already attached to the messages.
 */

function makeClient() {
  return new AgnoClient({
    endpoint: 'http://127.0.0.1:0',
    mode: 'agent',
    agentId: 'test-agent',
  });
}

function getHandleChunk(client: AgnoClient) {
  return (client as unknown as {
    handleChunk: (chunk: unknown, sid: string | undefined, msg: string) => void;
  }).handleChunk.bind(client);
}

function getMessageStore(client: AgnoClient) {
  return (client as unknown as {
    messageStore: {
      addMessage: (m: any) => void;
      getMessages: () => any[];
    };
  }).messageStore;
}

describe('issue #15 — run_id on ChatMessage', () => {
  test('streaming: RunStarted backfills run_id on user + agent placeholder', () => {
    const client = makeClient();
    const store = getMessageStore(client);

    // Simulate what sendMessage() does before the first chunk arrives:
    // optimistically add the user message + agent placeholder with no run_id.
    store.addMessage({
      role: 'user',
      content: 'hello',
      created_at: 1,
    });
    store.addMessage({
      role: 'agent',
      content: '',
      tool_calls: [],
      streamingError: false,
      created_at: 2,
    });

    const before = store.getMessages();
    expect(before[0].run_id).toBeUndefined();
    expect(before[1].run_id).toBeUndefined();

    getHandleChunk(client)(
      {
        event: 'RunStarted',
        run_id: 'run-abc',
        session_id: 'sess-1',
        created_at: 3,
      },
      undefined,
      'hello'
    );

    const after = store.getMessages();
    expect(after).toHaveLength(2);
    expect(after[0].role).toBe('user');
    expect(after[0].run_id).toBe('run-abc');
    expect(after[1].role).toBe('agent');
    expect(after[1].run_id).toBe('run-abc');
    expect(client.getState().currentRunId).toBe('run-abc');
  });

  test('streaming: TeamRunStarted also backfills run_id', () => {
    const client = new AgnoClient({
      endpoint: 'http://127.0.0.1:0',
      mode: 'team',
      teamId: 'test-team',
    });
    const store = getMessageStore(client);

    store.addMessage({ role: 'user', content: 'hi', created_at: 1 });
    store.addMessage({
      role: 'agent',
      content: '',
      tool_calls: [],
      streamingError: false,
      created_at: 2,
    });

    getHandleChunk(client)(
      {
        event: 'TeamRunStarted',
        run_id: 'team-run-xyz',
        session_id: 'sess-2',
        created_at: 3,
      },
      undefined,
      'hi'
    );

    const msgs = store.getMessages();
    expect(msgs[0].run_id).toBe('team-run-xyz');
    expect(msgs[1].run_id).toBe('team-run-xyz');
  });

  test('streaming: does not overwrite an existing run_id (idempotent)', () => {
    const client = makeClient();
    const store = getMessageStore(client);

    store.addMessage({
      role: 'user',
      content: 'hello',
      created_at: 1,
      run_id: 'preset',
    });
    store.addMessage({
      role: 'agent',
      content: '',
      tool_calls: [],
      streamingError: false,
      created_at: 2,
      run_id: 'preset',
    });

    getHandleChunk(client)(
      {
        event: 'RunStarted',
        run_id: 'new-run',
        session_id: 'sess-1',
        created_at: 3,
      },
      undefined,
      'hello'
    );

    const msgs = store.getMessages();
    // Existing run_id is preserved (backfill is gated on !m.run_id).
    expect(msgs[0].run_id).toBe('preset');
    expect(msgs[1].run_id).toBe('preset');
  });

  test('session reload: each user/agent pair shares run_id', () => {
    const sm = new SessionManager();

    const runs: RunSchema[] = [
      {
        run_id: 'run-1',
        session_id: 'sess-1',
        run_input: 'first question',
        content: 'first answer',
        created_at: 1000,
        events: [{ event: 'RunCompleted' }] as any,
        status: 'completed',
      } as any,
      {
        run_id: 'run-2',
        session_id: 'sess-1',
        run_input: 'second question',
        content: 'second answer',
        created_at: 2000,
        events: [{ event: 'RunCompleted' }] as any,
        status: 'completed',
      } as any,
    ];

    const messages = sm.convertSessionToMessages(runs);

    expect(messages).toHaveLength(4);
    // Round 1
    expect(messages[0].role).toBe('user');
    expect(messages[0].content).toBe('first question');
    expect(messages[0].run_id).toBe('run-1');
    expect(messages[1].role).toBe('agent');
    expect(messages[1].content).toBe('first answer');
    expect(messages[1].run_id).toBe('run-1');
    // Round 2
    expect(messages[2].run_id).toBe('run-2');
    expect(messages[3].run_id).toBe('run-2');
  });

  test('session reload: child runs (parent_run_id) are filtered, no orphans', () => {
    const sm = new SessionManager();

    const runs: RunSchema[] = [
      {
        run_id: 'root',
        session_id: 's',
        run_input: 'q',
        content: 'a',
        created_at: 1,
        events: [{ event: 'RunCompleted' }] as any,
      } as any,
      {
        run_id: 'child',
        parent_run_id: 'root',
        session_id: 's',
        run_input: 'internal',
        content: 'internal answer',
        created_at: 2,
        events: [{ event: 'RunCompleted' }] as any,
      } as any,
    ];

    const messages = sm.convertSessionToMessages(runs);
    expect(messages).toHaveLength(2);
    expect(messages.every((m) => m.run_id === 'root')).toBe(true);
  });

  test('HITL: run_id persists across RunStarted → RunPaused', () => {
    const client = makeClient();
    const store = getMessageStore(client);
    const handle = getHandleChunk(client);

    store.addMessage({ role: 'user', content: 'do it', created_at: 1 });
    store.addMessage({
      role: 'agent',
      content: '',
      tool_calls: [],
      streamingError: false,
      created_at: 2,
    });

    handle(
      {
        event: 'RunStarted',
        run_id: 'run-hitl',
        session_id: 'sess-hitl',
        created_at: 3,
      },
      undefined,
      'do it'
    );

    // After RunStarted both messages have the run_id.
    let msgs = store.getMessages();
    expect(msgs[0].run_id).toBe('run-hitl');
    expect(msgs[1].run_id).toBe('run-hitl');

    // A pause arrives — run_id on existing messages must not be wiped.
    handle(
      {
        event: 'RunPaused',
        run_id: 'run-hitl',
        session_id: 'sess-hitl',
        created_at: 4,
        content_type: 'str',
        tools: [
          {
            role: 'tool',
            content: null,
            tool_call_id: 't1',
            tool_name: 'confirm',
            tool_args: {},
            tool_call_error: false,
            metrics: { time: 0 },
            created_at: 4,
            external_execution_required: true,
            result: null,
          },
        ],
      } as any,
      'sess-hitl',
      'do it'
    );

    msgs = store.getMessages();
    expect(client.getState().isPaused).toBe(true);
    expect(client.getState().pausedRunId).toBe('run-hitl');
    expect(msgs[0].run_id).toBe('run-hitl');
    expect(msgs[1].run_id).toBe('run-hitl');
  });
});
