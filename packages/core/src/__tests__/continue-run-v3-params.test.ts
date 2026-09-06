import { afterEach, describe, expect, test } from 'bun:test';
import { AgnoClient } from '../client';
import type { ToolCall } from '@rodrigocoliveira/agno-types';

/**
 * Regression tests for Agno v3's additional `/continue` FormData fields
 * (`input`, `continue_from`, `fork`, `regenerate`, `replace_original`,
 * `additional_instructions`, `background`) — verified against `agno==3.0.6`
 * source (`continue_agent_run`/`continue_team_run` signatures). These are
 * unrelated to submitting HITL tool results (`tools`/`requirements`).
 */

function makeClient() {
  return new AgnoClient({ endpoint: 'http://127.0.0.1:0', mode: 'agent', agentId: 'test-agent' });
}

function pausedTool(): ToolCall {
  return {
    tool_call_id: 't1',
    tool_name: 'risky_action',
    tool_args: {},
    tool_call_error: false,
    created_at: 0,
    requires_confirmation: true,
    confirmed: true,
    result: 'ok',
  };
}

function setPaused(client: AgnoClient, runId: string) {
  (client as unknown as { state: { isPaused: boolean; pausedRunId: string } }).state.isPaused = true;
  (client as unknown as { state: { isPaused: boolean; pausedRunId: string } }).state.pausedRunId = runId;
}

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

describe('continueRun Agno v3 parameters', () => {
  test('sends fork/regenerate/continueFrom/additionalInstructions/input/replaceOriginal/background', async () => {
    let capturedBody: FormData | undefined;
    global.fetch = (async (_url: string, init?: RequestInit) => {
      if (init?.body instanceof FormData) {
        capturedBody = init.body;
        return new Response('event: RunCompleted\ndata: {"event":"RunCompleted","content":"ok"}\n\n', {
          status: 200,
          headers: { 'Content-Type': 'text/event-stream' },
        });
      }
      return new Response(JSON.stringify([]), { status: 200 });
    }) as typeof fetch;

    const client = makeClient();
    setPaused(client, 'run-1');

    await client.continueRun([pausedTool()], {
      input: 'one more thing',
      continueFrom: 'last_user',
      fork: true,
      regenerate: true,
      replaceOriginal: false,
      additionalInstructions: 'be brief',
      background: true,
    });

    expect(capturedBody?.get('input')).toBe('one more thing');
    expect(capturedBody?.get('continue_from')).toBe('last_user');
    expect(capturedBody?.get('fork')).toBe('true');
    expect(capturedBody?.get('regenerate')).toBe('true');
    expect(capturedBody?.get('replace_original')).toBe('false');
    expect(capturedBody?.get('additional_instructions')).toBe('be brief');
    expect(capturedBody?.get('background')).toBe('true');
  });

  test('omits the new fields entirely when not provided (no unexpected FormData keys)', async () => {
    let capturedBody: FormData | undefined;
    global.fetch = (async (_url: string, init?: RequestInit) => {
      if (init?.body instanceof FormData) {
        capturedBody = init.body;
        return new Response('event: RunCompleted\ndata: {"event":"RunCompleted","content":"ok"}\n\n', {
          status: 200,
          headers: { 'Content-Type': 'text/event-stream' },
        });
      }
      return new Response(JSON.stringify([]), { status: 200 });
    }) as typeof fetch;

    const client = makeClient();
    setPaused(client, 'run-2');

    await client.continueRun([pausedTool()]);

    expect(capturedBody?.has('input')).toBe(false);
    expect(capturedBody?.has('continue_from')).toBe(false);
    expect(capturedBody?.has('fork')).toBe(false);
    expect(capturedBody?.has('regenerate')).toBe(false);
    expect(capturedBody?.has('replace_original')).toBe(false);
    expect(capturedBody?.has('additional_instructions')).toBe(false);
    expect(capturedBody?.has('background')).toBe(false);
  });
});
