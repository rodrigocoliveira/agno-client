import { afterEach, describe, expect, test } from 'bun:test';
import { AgnoClient } from '../client';
import type { ToolCall } from '@rodrigocoliveira/agno-types';

/**
 * Regression tests for the Agno v3 migration: teams now support
 * `POST /teams/{id}/runs/{run_id}/continue` (the v2-era assumption that only
 * agents support HITL continue no longer holds). Verified byte-for-byte
 * against `agno==3.0.6` source: the agent endpoint takes a flat `tools`
 * FormData field parsed via `ToolExecution.from_dict`, while the team
 * endpoint takes a `requirements` field parsed via `RunRequirement.from_dict`
 * — a different field name AND a different (wrapped) JSON shape.
 */

function makeAgentClient() {
  return new AgnoClient({
    endpoint: 'http://127.0.0.1:0',
    mode: 'agent',
    agentId: 'test-agent',
  });
}

function makeTeamClient() {
  return new AgnoClient({
    endpoint: 'http://127.0.0.1:0',
    mode: 'team',
    teamId: 'test-team',
  });
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
    result: 'action executed',
  };
}

function sseResponse(frames: string): Response {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(frames));
      controller.close();
    },
  });
  return new Response(body, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
}

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

function setPaused(client: AgnoClient, runId: string) {
  (client as unknown as { state: { isPaused: boolean; pausedRunId: string } }).state.isPaused = true;
  (client as unknown as { state: { isPaused: boolean; pausedRunId: string } }).state.pausedRunId = runId;
}

describe('continueRun payload by mode', () => {
  test('agent mode sends a flat `tools` FormData field', async () => {
    let capturedBody: FormData | undefined;
    global.fetch = (async (_url: string, init?: RequestInit) => {
      if (init?.body instanceof FormData) {
        capturedBody = init.body;
        return sseResponse('event: RunCompleted\ndata: {"event":"RunCompleted","content":"ok"}\n\n');
      }
      return new Response(JSON.stringify([]), { status: 200 });
    }) as typeof fetch;

    const client = makeAgentClient();
    setPaused(client, 'run-1');

    await client.continueRun([pausedTool()]);

    expect(capturedBody?.has('tools')).toBe(true);
    expect(capturedBody?.has('requirements')).toBe(false);
    const tools = JSON.parse(capturedBody!.get('tools') as string);
    expect(tools).toHaveLength(1);
    expect(tools[0].tool_call_id).toBe('t1');
  });

  test('team mode no longer throws, and sends a `requirements` field wrapping each tool', async () => {
    let capturedBody: FormData | undefined;
    global.fetch = (async (_url: string, init?: RequestInit) => {
      if (init?.body instanceof FormData) {
        capturedBody = init.body;
        return sseResponse('event: TeamRunCompleted\ndata: {"event":"TeamRunCompleted","content":"ok"}\n\n');
      }
      return new Response(JSON.stringify([]), { status: 200 });
    }) as typeof fetch;

    const client = makeTeamClient();
    setPaused(client, 'run-2');

    await expect(client.continueRun([pausedTool()])).resolves.toBeUndefined();

    expect(capturedBody?.has('requirements')).toBe(true);
    expect(capturedBody?.has('tools')).toBe(false);

    const requirements = JSON.parse(capturedBody!.get('requirements') as string);
    expect(requirements).toHaveLength(1);
    // The decision lives on tool_execution — that's what the backend's dispatch reads.
    expect(requirements[0].tool_execution.tool_call_id).toBe('t1');
    expect(requirements[0].tool_execution.confirmed).toBe(true);
    expect(requirements[0].tool_execution.result).toBe('action executed');
  });

  test('team mode round-trips requirement id and member_* from a member-originated pause', async () => {
    let capturedBody: FormData | undefined;
    global.fetch = (async (_url: string, init?: RequestInit) => {
      if (init?.body instanceof FormData) {
        capturedBody = init.body;
        return sseResponse('event: TeamRunCompleted\ndata: {"event":"TeamRunCompleted","content":"ok"}\n\n');
      }
      return new Response(JSON.stringify([]), { status: 200 });
    }) as typeof fetch;

    const client = makeTeamClient();
    setPaused(client, 'run-3');

    await client.continueRun([
      {
        ...pausedTool(),
        requirement_id: 'req-1',
        member_agent_id: 'member-a',
        member_agent_name: 'Member A',
        member_run_id: 'member-run-1',
      },
    ]);

    const [req] = JSON.parse(capturedBody!.get('requirements') as string);
    expect(req.id).toBe('req-1');
    expect(req.member_agent_id).toBe('member-a');
    expect(req.member_run_id).toBe('member-run-1');
    // Client-only round-trip fields must not leak into the ToolExecution itself.
    expect(req.tool_execution.requirement_id).toBeUndefined();
    expect(req.tool_execution.member_agent_id).toBeUndefined();
  });
});
