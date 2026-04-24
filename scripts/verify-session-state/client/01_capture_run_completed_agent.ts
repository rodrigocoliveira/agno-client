/**
 * Phase 0 verification #1
 *
 * Asserts that an agent's RunCompleted chunk carries `session_state`.
 * If this fails, the lib cannot rely on the stream alone to sync session_state
 * after a run completes for agents — it must fall back to refreshSessionState().
 */

import {
  assert,
  done,
  dumpStream,
  sendAgentRun,
  StreamChunk,
  summary,
} from './shared/stream-dump';

const AGENT_ID = 'state-test-agent';

async function main() {
  console.log('[01] Sending message to agent to trigger increment_counter tool...\n');
  const response = await sendAgentRun(AGENT_ID, 'Please increment the counter once.');
  const chunks: StreamChunk[] = await dumpStream(response);

  summary('01_capture_run_completed_agent', chunks);

  const runCompleted = chunks.find((c) => c.event === 'RunCompleted');
  assert(runCompleted, 'RunCompleted event was emitted');

  if (!runCompleted) return done();

  assert(
    'session_state' in runCompleted,
    'RunCompleted chunk has a `session_state` field',
    { keys: Object.keys(runCompleted) }
  );

  assert(
    runCompleted.session_state && typeof runCompleted.session_state === 'object',
    'RunCompleted.session_state is a non-null object',
    runCompleted.session_state
  );

  const state = runCompleted.session_state as Record<string, unknown> | undefined;
  assert(
    state && typeof state.counter === 'number' && (state.counter as number) >= 1,
    'RunCompleted.session_state.counter reflects the tool mutation (>= 1)',
    state
  );

  console.log('\n[01] Final session_state from RunCompleted:', state);
  done();
}

main().catch((err) => {
  console.error('[01] Unhandled error:', err);
  process.exit(1);
});
