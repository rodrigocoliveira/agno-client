/**
 * Phase 0 verification #2
 *
 * Asserts that a team's TeamRunCompleted chunk carries `session_state`.
 * If this fails, teams cannot rely on the stream alone for session_state sync
 * and must fall back to refreshSessionState() / custom event.
 */

import {
  assert,
  done,
  dumpStream,
  sendTeamRun,
  StreamChunk,
  summary,
} from './shared/stream-dump';

const TEAM_ID = 'state-test-team';

async function main() {
  console.log('[02] Sending message to team to trigger increment_team_counter tool...\n');
  const response = await sendTeamRun(TEAM_ID, 'Please increment the counter once.');
  const chunks: StreamChunk[] = await dumpStream(response);

  summary('02_capture_run_completed_team', chunks);

  // Team completion can be emitted as either TeamRunCompleted or RunCompleted depending
  // on the Agno version — accept either, but flag which one was seen.
  const teamCompleted = chunks.find((c) => c.event === 'TeamRunCompleted');
  const runCompleted = chunks.find((c) => c.event === 'RunCompleted');
  const completed = teamCompleted ?? runCompleted;

  assert(completed, 'A run-completion event was emitted (TeamRunCompleted or RunCompleted)');
  if (teamCompleted) console.log('[02] Saw TeamRunCompleted');
  else if (runCompleted) console.log('[02] Saw RunCompleted (no TeamRunCompleted)');

  if (!completed) return done();

  assert(
    'session_state' in completed,
    'Team completion chunk has a `session_state` field',
    { keys: Object.keys(completed) }
  );

  assert(
    completed.session_state && typeof completed.session_state === 'object',
    'Team completion `session_state` is a non-null object',
    completed.session_state
  );

  const state = completed.session_state as Record<string, unknown> | undefined;
  assert(
    state && typeof state.counter === 'number' && (state.counter as number) >= 1,
    'Team completion `session_state.counter` reflects the tool mutation (>= 1)',
    state
  );

  console.log('\n[02] Final session_state from team completion:', state);
  done();
}

main().catch((err) => {
  console.error('[02] Unhandled error:', err);
  process.exit(1);
});
