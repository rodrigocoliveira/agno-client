import { describe, expect, test } from 'bun:test';
import { AgnoClient } from '../client';

/**
 * Regression tests for issue #8 — the SSE `RunPaused` handler must not put
 * already-completed tools into `state.toolsAwaitingExecution`. When the
 * server only sends the full `tools` list (no `tools_awaiting_*` field), the
 * fallback must filter to pending external-execution tools, mirroring the
 * same selector `loadSession` uses for runs that are paused on reload.
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

const completedSyncTool = {
  role: 'tool' as const,
  content: null,
  tool_call_id: 't1',
  tool_name: 'search_catalog',
  tool_args: {},
  tool_call_error: false,
  metrics: { time: 0 },
  created_at: 0,
  external_execution_required: false,
  result: '{"matches":[]}',
};

const pendingExternalTool = {
  role: 'tool' as const,
  content: null,
  tool_call_id: 't2',
  tool_name: 'show_product_card',
  tool_args: {},
  tool_call_error: false,
  metrics: { time: 0 },
  created_at: 0,
  external_execution_required: true,
  result: null,
};

describe('AgnoClient RunPaused handler', () => {
  test('filters chunk.tools fallback to pending external tools only', () => {
    const client = makeClient();
    const emitted: any[] = [];
    client.on('run:paused', (payload) => emitted.push(payload));

    const handle = getHandleChunk(client);
    handle(
      {
        event: 'RunPaused',
        run_id: 'r1',
        session_id: 's1',
        created_at: 1,
        content_type: 'str',
        tools: [completedSyncTool, pendingExternalTool],
      } as any,
      's1',
      'hi'
    );

    const state = client.getState();
    expect(state.isPaused).toBe(true);
    expect(state.pausedRunId).toBe('r1');
    expect(state.toolsAwaitingExecution).toHaveLength(1);
    expect(state.toolsAwaitingExecution![0].tool_call_id).toBe('t2');

    expect(emitted).toHaveLength(1);
    expect(emitted[0].tools).toHaveLength(1);
    expect(emitted[0].tools[0].tool_call_id).toBe('t2');
  });

  test('ignores tools_awaiting_external_execution shortcut key (never sent by Agno v3) and filters chunk.tools itself', () => {
    const client = makeClient();
    const handle = getHandleChunk(client);

    handle(
      {
        event: 'RunPaused',
        run_id: 'r2',
        session_id: 's2',
        created_at: 1,
        content_type: 'str',
        // Verified against agno==3.0.6 source + a live capture: this shortcut key is a
        // Python @property, never serialized on the wire. It's set here to prove the
        // client doesn't rely on it, and would give the wrong (empty) answer if read.
        tools_awaiting_external_execution: [],
        tools: [completedSyncTool, pendingExternalTool],
      } as any,
      's2',
      'hi'
    );

    const state = client.getState();
    expect(state.toolsAwaitingExecution).toHaveLength(1);
    expect(state.toolsAwaitingExecution![0].tool_call_id).toBe('t2');
  });

  test('empty toolsAwaitingExecution when chunk has no tools at all', () => {
    const client = makeClient();
    const handle = getHandleChunk(client);

    handle(
      {
        event: 'RunPaused',
        run_id: 'r3',
        session_id: 's3',
        created_at: 1,
        content_type: 'str',
      } as any,
      's3',
      'hi'
    );

    const state = client.getState();
    expect(state.isPaused).toBe(true);
    expect(state.pausedRunId).toBe('r3');
    expect(state.toolsAwaitingExecution).toEqual([]);
  });

  test('does not treat a bare `external_execution` field as pending (v3 field is `external_execution_required`)', () => {
    const client = makeClient();
    const handle = getHandleChunk(client);

    // `external_execution` (without `_required`) is not a real Agno v3 field —
    // confirmed against `agno==3.0.6` source (`ToolExecution.external_execution_required`)
    // and a live capture. A tool shaped like this must NOT be treated as pending.
    const notARealField = {
      ...pendingExternalTool,
      tool_call_id: 't4',
      external_execution_required: undefined,
      external_execution: true,
    };

    handle(
      {
        event: 'RunPaused',
        run_id: 'r4',
        session_id: 's4',
        created_at: 1,
        content_type: 'str',
        tools: [completedSyncTool, notARealField],
      } as any,
      's4',
      'hi'
    );

    const state = client.getState();
    expect(state.toolsAwaitingExecution).toHaveLength(0);
  });
});
