/**
 * Shape validation script for Schedules / Approvals / Components APIs.
 *
 * Purpose: after bumping the `agno` Python pin, hit the new AgentOS endpoints
 * added in PR #3 and assert that the client's TypeScript types still match
 * the server's wire format. This is *shape* validation only — empty data
 * arrays on a fresh AgentOS DB are expected and pass. Any thrown fetch
 * error or shape mismatch is a real finding.
 *
 * Usage:
 *   # terminal 1
 *   cd examples/agno-mock-server
 *   python server.py     # serves http://localhost:7777
 *
 *   # terminal 2 (from repo root)
 *   bun run examples/agno-mock-server/validate-apis.ts
 *
 * Exits non-zero on the first failed assertion.
 */

import { AgnoClient } from '@rodrigocoliveira/agno-client';

const ENDPOINT = process.env.AGNO_ENDPOINT ?? 'http://localhost:7777';

const client = new AgnoClient({
  endpoint: ENDPOINT,
  mode: 'agent',
  agentId: 'validate-apis-stub',
});

let failed = false;

function ok(label: string, detail: unknown) {
  console.log(`  ok  ${label} — ${JSON.stringify(detail)}`);
}

function fail(label: string, detail: unknown) {
  failed = true;
  console.error(`  FAIL ${label} — ${JSON.stringify(detail)}`);
}

function assertPaginated(label: string, res: { data?: unknown; meta?: unknown }) {
  if (!Array.isArray(res.data)) {
    fail(label, { reason: 'res.data is not an array', got: typeof res.data });
    return;
  }
  if (!res.meta || typeof res.meta !== 'object') {
    fail(label, { reason: 'res.meta missing or not an object', got: res.meta });
    return;
  }
  ok(label, { count: (res.data as unknown[]).length, meta: res.meta });
}

async function run() {
  console.log(`Validating Agno client API shapes against ${ENDPOINT}\n`);

  // Schedules
  try {
    console.log('GET /schedules');
    const res = await client.fetchSchedules();
    assertPaginated('fetchSchedules', res);
  } catch (err) {
    fail('fetchSchedules', { error: (err as Error).message });
  }

  // Approvals (the site exercised by the PR #3 type fix)
  try {
    console.log('GET /approvals');
    const res = await client.fetchApprovals();
    assertPaginated('fetchApprovals', res);
  } catch (err) {
    fail('fetchApprovals', { error: (err as Error).message });
  }

  try {
    console.log('GET /approvals/count');
    const res = await client.getApprovalCount();
    if (typeof res.count === 'number') {
      ok('getApprovalCount', { count: res.count });
    } else {
      fail('getApprovalCount', { reason: 'res.count is not a number', got: typeof res.count });
    }
  } catch (err) {
    fail('getApprovalCount', { error: (err as Error).message });
  }

  // Components
  let firstComponentId: string | undefined;
  try {
    console.log('GET /components');
    const res = await client.fetchComponents();
    assertPaginated('fetchComponents', res);
    firstComponentId = res.data[0]?.component_id;
  } catch (err) {
    fail('fetchComponents', { error: (err as Error).message });
  }

  // Component configs — bare List[ComponentConfigResponse] per server
  if (firstComponentId) {
    try {
      console.log(`GET /components/${firstComponentId}/configs`);
      const res = await client.fetchComponentConfigs(firstComponentId);
      if (Array.isArray(res)) {
        ok('fetchComponentConfigs', { count: res.length });
      } else {
        fail('fetchComponentConfigs', { reason: 'response is not an array', got: typeof res });
      }
    } catch (err) {
      fail('fetchComponentConfigs', { error: (err as Error).message });
    }
  } else {
    console.log('  skip fetchComponentConfigs — no components returned by server (fresh DB)');
  }

  console.log();
  if (failed) {
    console.error('One or more shape checks failed.');
    process.exit(1);
  }
  console.log('All shape checks passed.');
}

run().catch((err) => {
  console.error('Fatal error running validator:', err);
  process.exit(1);
});
