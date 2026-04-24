/**
 * Phase 5 verification — race-defense for the SessionStatePage
 *
 * Reproduces the exact bug the user hit: when `client.initialize()` runs and
 * the env vars don't pin an agentId, the lib auto-selects the FIRST agent
 * returned by the backend (here: `generative-ui-demo`). If the page's
 * `updateConfig({ agentId: 'state-counter-agent' })` ran before initialize
 * resolved, the auto-select clobbered it.
 *
 * The page now defends by listening to `config:change` and re-applying when
 * it detects drift. This script asserts the defense works:
 *
 *   1. Create AgnoClient with no agentId
 *   2. Page-side useEffect equivalent: register the enforcer + apply once
 *   3. Run initialize() — it WILL set agentId to the first agent (drift)
 *   4. Assert the enforcer immediately puts agentId back to state-counter-agent
 *   5. Send a real message and assert the response comes from state-counter-agent
 *      (verified by the increment_counter tool firing and counter > 0).
 */

import { AgnoClient } from '../../../packages/core/src/client';
import { assert, done } from './shared/stream-dump';

const ENDPOINT = process.env.AGNO_ENDPOINT ?? 'http://localhost:7777';
const TARGET_AGENT = 'state-counter-agent';

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log('[06] Race-defense scenario\n');

  // Step 1: client without an agentId — same as the user's setup
  const client = new AgnoClient({ endpoint: ENDPOINT, mode: 'agent' });

  // Step 2: install the enforcer the page now uses
  let enforcerCalls = 0;
  const enforce = () => {
    const cfg = client.getConfig();
    if (cfg.agentId !== TARGET_AGENT) {
      enforcerCalls++;
      client.updateConfig({ mode: 'agent', agentId: TARGET_AGENT, teamId: undefined });
    }
  };
  enforce(); // initial apply (page mount)
  client.on('config:change', enforce);

  assert(client.getConfig().agentId === TARGET_AGENT, 'after initial enforce, agentId is the target');

  // Step 3: run initialize() — this is what AutoInitializer does. It will
  // see "no agentId? actually we just set one..." — let's confirm.
  console.log('[06] running client.initialize() (this may auto-select an agent)…');
  await client.initialize();
  await sleep(50); // settle event loop

  const afterInit = client.getConfig().agentId;
  console.log('[06] agentId after initialize+enforce defense:', afterInit);

  // initialize() only auto-selects when neither agentId nor teamId is set.
  // Since we set agentId BEFORE initialize, no auto-select happens. The
  // original user bug was: page mounts FIRST (sets agentId), but with a
  // conflicting auto-select. Let's force the actual race by clearing then
  // letting initialize fire while the listener is in place.
  console.log('\n[06] forcing the race: clearing agentId, then running initialize again…');
  client.updateConfig({ agentId: undefined, teamId: undefined });
  // The enforcer just fired (because we triggered config:change). It put
  // agentId back to target. So let's bypass the enforcer for one moment by
  // removing it, clearing, then re-adding right before initialize.
  client.off('config:change', enforce);
  client.updateConfig({ agentId: undefined, teamId: undefined });
  client.on('config:change', enforce);

  await client.initialize();
  await sleep(50);

  const afterRace = client.getConfig().agentId;
  console.log('[06] agentId after race + defense:', afterRace);
  console.log('[06] enforcer total invocations:', enforcerCalls);
  assert(afterRace === TARGET_AGENT, 'after the race + enforcer, agentId is back to the target');

  // Step 5: send a real message and confirm the response came from our agent
  console.log('\n[06] sending a real message and checking the response is from state-counter-agent…');
  let counterFromState: number | undefined;
  client.on('session-state:change', (state) => {
    if (state && typeof (state as Record<string, unknown>).counter === 'number') {
      counterFromState = (state as Record<string, number>).counter;
    }
  });

  await client.sendMessage('Increment the counter by 7.');
  await sleep(200);

  assert(
    typeof counterFromState === 'number' && counterFromState >= 7,
    'session_state.counter is >= 7 after the run (means our increment_counter tool fired)',
    counterFromState
  );

  done();
}

main().catch((err) => {
  console.error('[06] Unhandled error:', err);
  process.exit(1);
});
