# Phase 0 — Empirical findings

Captured on 2026-04-24 against **Agno 2.6.0** (also re-confirmed against 2.5.17) using the scripts in this directory.

## Results

| # | Source | Result |
|---|---|---|
| 01 | Agent `RunCompleted` chunk carries `session_state` | **PASS** |
| 02 | Team `TeamRunCompleted` chunk carries `session_state` | **FAIL** |
| 03 | Custom event payload carries `session_state` when the backend yields a `CustomEvent` dataclass with that field | **PASS** |
| 04 | `GET /sessions/{id}` returns `session_state` for both agent and team sessions | **PASS** (both) |

## What the `TeamRunCompleted` chunk actually contains

```
created_at, event, team_id, team_name, run_id, session_id,
nested_depth, content, content_type, model_provider_data,
member_responses, metrics
```

No `session_state` key. The field exists on `RunCompletedEvent` in `libs/agno/agno/run/team.py:288`, but the populator (`run_response.session_state = run_context.session_state`) is inside `_cleanup_and_store` (`libs/agno/agno/team/_run.py:~4138`), which runs *after* `create_team_run_completed_event` builds the event. Confirmed across 2.5.17 and 2.6.0 — see the upstream PR notes. Not worth chasing inside this client — the fallback path (REST refresh on `stream:end`) is reliable until upstream lands a fix.

## Implications for the implementation

### Agents
- Primary path: extract `session_state` from the `RunCompleted` chunk — free, already in the stream.
- Live mid-run: extract from any `CustomEvent` whose payload carries `session_state`.

### Teams
- Primary path: `TeamRunCompleted` is **unreliable**. On `stream:end`, when `mode === 'team'`, automatically call `refreshSessionState()` once to sync.
- Live mid-run: same as agents — custom event payload extraction works.

### Both
- Session switch: call `getSessionById()` in parallel with `loadSession()` to hydrate `sessionState`.
- Manual escape hatch: `refreshSessionState()` always available.

## Useful custom-event chunk shape (from script 03)

```
created_at, event, agent_id, agent_name, run_id, session_id,
nested_depth, tool_call_id, session_state
```

Agno auto-populates `current_session_id` and `current_run_id` inside `session_state` when the dataclass copies from `run_context.session_state`. Harmless for our purposes but worth noting: consumers should not rely on those keys in their own application state.

## Re-running

```bash
# Backend (uses the existing agno-mock-server .venv as a shortcut)
cd scripts/verify-session-state/backend
/path/to/repo/examples/agno-mock-server/.venv/bin/python serve.py

# Client scripts (from repo root, another terminal)
bun run scripts/verify-session-state/client/01_capture_run_completed_agent.ts
bun run scripts/verify-session-state/client/02_capture_run_completed_team.ts
bun run scripts/verify-session-state/client/03_capture_custom_event.ts
bun run scripts/verify-session-state/client/04_get_session_by_id.ts
```

If script 02 ever starts passing (Agno backend is fixed in a future release), the `stream:end` fallback can be removed and teams can rely on the stream like agents. Re-run all five scripts whenever bumping the verified Agno version in `backend/requirements.txt`.
