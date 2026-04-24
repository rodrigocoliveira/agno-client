/**
 * Phase 0 verification #4
 *
 * Asserts that GET /sessions/{id} returns `session_state` for both
 * agent and team sessions. This is the hydration path used by the planned
 * `loadSession()` parallel call and `refreshSessionState()` escape hatch.
 */

import {
  assert,
  done,
  dumpStream,
  getSessionDetail,
  sendAgentRun,
  sendTeamRun,
  StreamChunk,
} from './shared/stream-dump';

const AGENT_ID = 'state-test-agent';
const TEAM_ID = 'state-test-team';

function pickSessionId(chunks: StreamChunk[]): string | undefined {
  for (const c of chunks) {
    if (typeof c.session_id === 'string') return c.session_id;
  }
  return undefined;
}

async function verify(label: string, sessionId: string) {
  console.log(`\n[04] Fetching session detail for ${label} (id=${sessionId})...`);
  const detail = await getSessionDetail(sessionId);
  console.log('[04] Detail keys:', Object.keys(detail));

  assert('session_state' in detail, `${label}: GET /sessions/${sessionId} response includes \`session_state\``);
  assert(
    detail.session_state && typeof detail.session_state === 'object',
    `${label}: detail.session_state is a non-null object`,
    detail.session_state
  );

  const state = detail.session_state as Record<string, unknown>;
  assert(
    typeof state.counter === 'number' && (state.counter as number) >= 1,
    `${label}: detail.session_state.counter is set (>= 1)`,
    state
  );
}

async function main() {
  console.log('[04] Triggering a run on agent and team to create sessions...\n');

  const agentChunks = await dumpStream(
    await sendAgentRun(AGENT_ID, 'Please increment the counter once.')
  );
  const agentSessionId = pickSessionId(agentChunks);
  assert(agentSessionId, 'Agent session_id was emitted in stream chunks');

  const teamChunks = await dumpStream(
    await sendTeamRun(TEAM_ID, 'Please increment the counter once.')
  );
  const teamSessionId = pickSessionId(teamChunks);
  assert(teamSessionId, 'Team session_id was emitted in stream chunks');

  if (agentSessionId) await verify('agent', agentSessionId);
  if (teamSessionId) await verify('team', teamSessionId);

  done();
}

main().catch((err) => {
  console.error('[04] Unhandled error:', err);
  process.exit(1);
});
