/**
 * Phase 0 verification #3
 *
 * Asserts that a custom event yielded by a tool propagates `session_state` in
 * its serialized payload. This is the live-mid-run path that powers the
 * `extractSessionStateFromCustomEvent` feature.
 *
 * If this fails, the planned auto-extraction is not feasible and the lib must
 * either rely on the stream-end RunCompleted chunk or expose a different mechanism.
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
  console.log('[03] Sending message to agent — expecting a CustomEvent with session_state...\n');
  const response = await sendAgentRun(AGENT_ID, 'Please increment the counter once.');
  const chunks: StreamChunk[] = await dumpStream(response);

  summary('03_capture_custom_event', chunks);

  const customEvents = chunks.filter((c) => c.event === 'CustomEvent');
  assert(customEvents.length > 0, 'At least one CustomEvent chunk was received');

  if (customEvents.length === 0) return done();

  const stateEvents = customEvents.filter(
    (c) => 'session_state' in c && c.session_state !== null && c.session_state !== undefined
  );
  assert(
    stateEvents.length > 0,
    'A CustomEvent carries the `session_state` field in its payload',
    customEvents.map((c) => Object.keys(c))
  );

  if (stateEvents.length === 0) return done();

  const first = stateEvents[0];
  const state = first.session_state as Record<string, unknown>;
  assert(
    typeof state.counter === 'number' && (state.counter as number) >= 1,
    'Custom-event `session_state.counter` reflects the in-tool mutation (>= 1)',
    state
  );

  console.log('\n[03] Custom event session_state payload:', state);
  console.log('[03] Custom event chunk keys:', Object.keys(first));
  done();
}

main().catch((err) => {
  console.error('[03] Unhandled error:', err);
  process.exit(1);
});
