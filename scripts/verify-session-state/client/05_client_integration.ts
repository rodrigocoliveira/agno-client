/**
 * Phase 5 verification — end-to-end client integration
 *
 * Uses the actual built `@rodrigocoliveira/agno-client` against the same
 * local backend as scripts 01-04 and asserts that the new session_state
 * wiring fires the expected events:
 *
 *   - `session-state:change` after the agent's `RunCompleted` chunk
 *   - `session-state:change` after a `CustomEvent` with `session_state`
 *   - `session-state:change` after a team run (fed by the post-stream REST refresh)
 *   - `client.getSessionState()` reflects the latest value at each step
 *
 * Run AFTER the backend is up and `bun run build` has been executed at the repo root.
 */

import { AgnoClient } from '../../../packages/core/src/client';
import { assert, done } from './shared/stream-dump';

const ENDPOINT = process.env.AGNO_ENDPOINT ?? 'http://localhost:7777';

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function agentRun(): Promise<void> {
  console.log('\n[05] Agent run — expecting session-state:change from custom event AND from RunCompleted');

  const client = new AgnoClient({
    endpoint: ENDPOINT,
    mode: 'agent',
    agentId: 'state-test-agent',
  });

  const stateChanges: Array<Record<string, unknown> | null> = [];
  client.on('session-state:change', (state) => stateChanges.push(state as Record<string, unknown> | null));
  client.on('stream:start', () => console.log('[05] stream:start'));
  client.on('stream:end', () => console.log('[05] stream:end'));
  client.on('message:error', (err) => console.log('[05] message:error:', err));

  try {
    await client.sendMessage('Please increment the counter once.');
  } catch (e) {
    console.error('[05] sendMessage threw:', e);
    throw e;
  }
  // sendMessage awaits the full stream (including onComplete), so the stream
  // is already closed by this point.
  await sleep(100);

  const final = client.getSessionState<{ counter?: number }>();
  assert(stateChanges.length >= 1, 'agent: session-state:change fired at least once');
  assert(final !== null, 'agent: client.getSessionState() is populated after the run', final);
  assert(
    typeof final?.counter === 'number' && final.counter >= 1,
    'agent: getSessionState().counter reflects the tool mutation (>= 1)',
    final
  );

  console.log('[05] Agent final getSessionState():', final);
  console.log('[05] Agent emitted session-state:change', stateChanges.length, 'times');
}

async function teamRun(): Promise<void> {
  console.log('\n[05] Team run — expecting session-state:change via the post-stream REST refresh');

  const client = new AgnoClient({
    endpoint: ENDPOINT,
    mode: 'team',
    teamId: 'state-test-team',
  });

  const stateChanges: Array<Record<string, unknown> | null> = [];
  client.on('session-state:change', (state) => stateChanges.push(state as Record<string, unknown> | null));

  let refreshStarted = 0;
  let refreshEnded = 0;
  client.on('session-state:refresh:start', () => {
    refreshStarted++;
  });
  client.on('session-state:refresh:end', () => {
    refreshEnded++;
  });

  await client.sendMessage('Please increment the counter once.');
  // sendMessage awaits onComplete which includes the post-stream REST refresh
  // for teams — but give a small extra grace window for emits to flush.
  await sleep(500);

  const final = client.getSessionState<{ counter?: number }>();
  assert(refreshStarted >= 1, 'team: session-state:refresh:start fired at least once');
  assert(refreshEnded >= 1, 'team: session-state:refresh:end fired at least once');
  assert(stateChanges.length >= 1, 'team: session-state:change fired at least once');
  assert(final !== null, 'team: client.getSessionState() is populated after the stream', final);
  assert(
    typeof final?.counter === 'number' && final.counter >= 1,
    'team: getSessionState().counter reflects the tool mutation (>= 1)',
    final
  );

  console.log('[05] Team final getSessionState():', final);
  console.log('[05] Team emitted session-state:change', stateChanges.length, 'times');
}

async function optOut(): Promise<void> {
  console.log('\n[05] Opt-out — extractSessionStateFromCustomEvent: false should suppress live updates');

  const client = new AgnoClient({
    endpoint: ENDPOINT,
    mode: 'agent',
    agentId: 'state-test-agent',
    extractSessionStateFromCustomEvent: false,
  });

  const customSeen: number[] = [];
  client.on('custom:event', () => customSeen.push(Date.now()));

  // Capture changes whose SOURCE was a custom event by recording what
  // session-state:change fires BEFORE stream:end. The RunCompleted-triggered
  // change is still expected, but it fires as part of processing the chunk
  // before stream:end, so we instead check that at least one custom:event
  // arrived and that after it but before stream:end the state either
  // remained null or only got set by the RunCompleted chunk itself.
  let stateAtCustomEvent: Record<string, unknown> | null | undefined;
  client.on('custom:event', () => {
    stateAtCustomEvent = client.getSessionState();
  });

  await client.sendMessage('Please increment the counter once.');
  await sleep(100);

  assert(customSeen.length >= 1, 'opt-out: custom:event still fires for useAgnoCustomEvents consumers');
  assert(
    stateAtCustomEvent === null || stateAtCustomEvent === undefined,
    'opt-out: session_state was NOT updated from the custom event',
    stateAtCustomEvent
  );

  // RunCompleted path still works even with opt-out.
  const final = client.getSessionState<{ counter?: number }>();
  assert(
    final !== null && typeof final?.counter === 'number',
    'opt-out: RunCompleted chunk still populates session_state (free, no extra request)',
    final
  );

  console.log('[05] Opt-out final getSessionState():', final);
}

async function main() {
  await agentRun();
  await teamRun();
  await optOut();
  done();
}

main().catch((err) => {
  console.error('[05] Unhandled error:', err);
  process.exit(1);
});
