import { describe, expect, test } from 'bun:test';
import { AgnoClient } from '../client';

/**
 * Regression tests for issue #11 — `tool_args` values that arrive from
 * agno as Python `repr()` strings (single-quoted literals) must be coerced
 * to structured JS values before consumers see them. Workaround for
 * agno#8007.
 *
 * Forward-compat: already-structured values must pass through unchanged.
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

const pythonReprData =
  "[{'month': 'Jan', 'revenue': 5000, 'expenses': 3000}, " +
  "{'month': 'Feb', 'revenue': 6000, 'expenses': 3500}]";

describe('AgnoClient RunPaused — Python-repr tool_args coercion', () => {
  test('coerces single-quoted Python list of dicts to JS array', () => {
    const client = makeClient();
    const handle = getHandleChunk(client);

    handle(
      {
        event: 'RunPaused',
        run_id: 'r1',
        session_id: 's1',
        created_at: 1,
        content_type: 'str',
        tools: [
          {
            role: 'tool',
            content: null,
            tool_call_id: 't1',
            tool_name: 'render_revenue_chart',
            tool_args: { data: pythonReprData, title: 'Monthly Revenue' },
            tool_call_error: false,
            metrics: { time: 0 },
            created_at: 0,
            external_execution_required: true,
            result: null,
          },
        ],
      } as any,
      's1',
      'show me revenue'
    );

    const state = client.getState();
    expect(state.toolsAwaitingExecution).toHaveLength(1);

    const args = state.toolsAwaitingExecution![0].tool_args;
    expect(Array.isArray(args.data)).toBe(true);
    expect(args.data).toEqual([
      { month: 'Jan', revenue: 5000, expenses: 3000 },
      { month: 'Feb', revenue: 6000, expenses: 3500 },
    ]);
    // Scalar strings stay as strings
    expect(args.title).toBe('Monthly Revenue');
  });

  test('coerces tool_args inside chunk.tools fallback path', () => {
    const client = makeClient();
    const handle = getHandleChunk(client);

    handle(
      {
        event: 'RunPaused',
        run_id: 'r2',
        session_id: 's2',
        created_at: 1,
        content_type: 'str',
        tools: [
          {
            role: 'tool',
            content: null,
            tool_call_id: 't2',
            tool_name: 'render_revenue_chart',
            tool_args: { data: pythonReprData },
            tool_call_error: false,
            metrics: { time: 0 },
            created_at: 0,
            external_execution_required: true,
            result: null,
          },
        ],
      } as any,
      's2',
      'show me revenue'
    );

    const state = client.getState();
    const args = state.toolsAwaitingExecution![0].tool_args;
    expect(Array.isArray(args.data)).toBe(true);
    expect((args.data as any[])[0]).toEqual({
      month: 'Jan',
      revenue: 5000,
      expenses: 3000,
    });
  });

  test('forward-compat: already-structured tool_args pass through', () => {
    const client = makeClient();
    const handle = getHandleChunk(client);

    const structured = [
      { month: 'Jan', revenue: 5000 },
      { month: 'Feb', revenue: 6000 },
    ];

    handle(
      {
        event: 'RunPaused',
        run_id: 'r3',
        session_id: 's3',
        created_at: 1,
        content_type: 'str',
        tools: [
          {
            role: 'tool',
            content: null,
            tool_call_id: 't3',
            tool_name: 'render_revenue_chart',
            tool_args: { data: structured },
            tool_call_error: false,
            metrics: { time: 0 },
            created_at: 0,
            external_execution_required: true,
            result: null,
          },
        ],
      } as any,
      's3',
      'show me revenue'
    );

    const state = client.getState();
    const args = state.toolsAwaitingExecution![0].tool_args;
    expect(args.data).toEqual(structured);
  });
});
