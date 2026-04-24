# TODO — Remove the team `session_state` post-stream refresh workaround

**Status:** blocked on upstream
**Created:** 2026-04-24
**Owner:** unassigned
**Affects:** `@rodrigocoliveira/agno-client`, `@rodrigocoliveira/agno-react`

## Why this exists

When we shipped first-class `session_state` management ([guide](../guides/12_state_and_events.md), [findings](../../scripts/verify-session-state/FINDINGS.md)), empirical verification proved that **`TeamRunCompleted` does not carry `session_state` over the SSE wire** through Agno 2.5.17 and 2.6.0, even though `RunCompleted` for agents does. To paper over this asymmetry, the client falls back to a one-time `GET /sessions/{id}` after a team stream ends.

The fallback adds one REST call per team run. It's correct but not ideal — once Agno fixes the upstream bug, we should remove the extra round trip.

## Root cause (upstream)

In `agno-agi/agno`, file `libs/agno/agno/team/_run.py` (verified at 2.6.0):
- The team event is built via `create_team_run_completed_event(from_run_response=run_response)` at six call sites (lines 868, 1641, 2687, 3749, 6226, 7203).
- The populator `run_response.session_state = run_context.session_state` lives inside `_cleanup_and_store` (line ~4138), which runs *after* the event is constructed — so the event captures `session_state=None`.
- The agent does it correctly: it sets `run_response.session_state` inline immediately before each `create_run_completed_event(...)` call.

Repro: `bun run scripts/verify-session-state/client/02_capture_run_completed_team.ts` against any Agno backend with a team that has `session_state`.

## Trigger to act

Re-run `scripts/verify-session-state/client/02_capture_run_completed_team.ts` after every Agno bump. The day it prints PASS instead of FAIL, this TODO is unblocked.

(Optional, faster signal: subscribe to the upstream issue/PR — link below.)

## Upstream link

- Issue: _TBD — fill in once filed_
- PR: _TBD — fill in once opened_

(See the prompt drafted in the conversation log for the suggested PR shape: inline the populator at all six call sites in `team/_run.py` mirroring the agent pattern.)

## What to change in this repo when upstream lands

1. **Bump verified version**
   - `scripts/verify-session-state/backend/requirements.txt` → minimum version that contains the fix
   - Re-run all five verification scripts; expect 02 to PASS for the first time

2. **Wire the chunk path for teams** (in `packages/core/src/client.ts`, the chunk handler around the `RunCompleted | TeamRunCompleted` case)
   - Today the `chunk.session_state !== undefined` branch only fires for `RunCompleted`. Extend it to fire for `TeamRunCompleted` as well — same call to `applySessionState(chunk.session_state, { source: 'run-completed' })`.

3. **Default the post-stream REST refresh to off for teams**
   - In `packages/types/src/config.ts`, change the doc on `refreshTeamSessionStateOnStreamEnd` to note it is now opt-in, and flip the default in the client.
   - Keep the option around for one major release as a compat escape hatch. Schedule full removal in the release-after-next.

4. **Update version callouts**
   - Search the repo for `Agno 2.6.0` / `through Agno 2.6.0` and replace with the new "fixed in" version
   - Files: `packages/types/src/api.ts`, `packages/types/src/config.ts`, `packages/core/src/client.ts`, `packages/react/src/hooks/useAgnoSessionState.ts`, `docs/guides/12_state_and_events.md`, `scripts/verify-session-state/FINDINGS.md`

5. **Update the docs guide** (`docs/guides/12_state_and_events.md`)
   - Change the "Team runs, on `stream:end`" row in the Sources table to reflect the new behavior (chunk-driven for new versions, REST fallback only for old versions)

6. **Tests**
   - Add a client integration test mirroring the existing agent `RunCompleted` chunk test, but for `TeamRunCompleted`
   - Re-run `bun test` and `scripts/verify-session-state/client/05_client_integration.ts` — both should remain green

7. **Delete this file** once shipped.

## Don't forget

- The `chunk.session_state` extraction must coexist with the post-stream REST refresh during the deprecation window — do not regress users still on older Agno versions.
- The cancellation/epoch logic in `SessionStateManager` already handles the "two writers in quick succession" case, so doubling up is safe.
