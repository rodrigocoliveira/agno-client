import { describe, expect, test } from 'bun:test';
import { getPendingTools } from '../pending-tools';

/**
 * A team pause caused by a delegated MEMBER's tool arrives only in `requirements`
 * (tagged with member_*) — the team's flat `tools` never gets it. Verified against
 * agno==3.0.6 `team/_run.py`: member requirements are appended to
 * `run_response.requirements` with no corresponding merge into `run_response.tools`.
 */

const memberTool = {
  tool_call_id: 'm1',
  tool_name: 'member_action',
  tool_args: {},
  tool_call_error: null,
  created_at: 0,
  requires_confirmation: true,
  confirmed: null,
};

describe('getPendingTools', () => {
  test('finds a member-originated pause carried only by requirements', () => {
    const pending = getPendingTools({
      tools: [],
      requirements: [
        {
          id: 'req-1',
          tool_execution: memberTool,
          member_agent_id: 'member-a',
          member_agent_name: 'Member A',
          member_run_id: 'member-run-1',
        },
      ],
    });

    expect(pending).toHaveLength(1);
    expect(pending[0].tool_call_id).toBe('m1');
    expect(pending[0].requirement_id).toBe('req-1');
    expect(pending[0].member_agent_id).toBe('member-a');
    expect(pending[0].member_run_id).toBe('member-run-1');
  });

  test('dedupes by tool_call_id when the same tool is in both tools and requirements', () => {
    const pending = getPendingTools({
      tools: [memberTool],
      requirements: [{ id: 'req-1', tool_execution: memberTool }],
    });

    expect(pending).toHaveLength(1);
    expect(pending[0].requirement_id).toBe('req-1');
  });

  test('drops requirements that are already resolved', () => {
    const pending = getPendingTools({
      requirements: [{ id: 'req-1', tool_execution: { ...memberTool, confirmed: true } }],
    });
    expect(pending).toHaveLength(0);
  });

  test('accepts a missing/null source', () => {
    expect(getPendingTools(undefined)).toEqual([]);
    expect(getPendingTools({ tools: null, requirements: null })).toEqual([]);
  });
});
