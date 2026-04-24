# Phase 0 — `session_state` empirical verification

This is the gate before implementing first-class `session_state` management in the lib. The implementation depends on three Agno-side assumptions; these scripts prove each one with real SSE payloads, not by reading source code.

## Assumptions to verify

1. The chunk emitted on `RunCompleted` (agent runs) carries a `session_state` field over the wire.
2. The chunk emitted on `TeamRunCompleted` (team runs) carries a `session_state` field over the wire.
3. A user-defined custom event (a Python dataclass extending `CustomEvent` with a `session_state` field) preserves that field in its serialized payload.
4. `GET /sessions/{id}` returns `session_state` for both agent and team sessions.

If any of these fail, the implementation plan changes (the failing source falls back to the manual `refreshSessionState()` escape hatch).

## Setup

### Prerequisites

- Python 3.10+ on PATH
- An OpenAI API key (or any model provider supported by Agno) exported as `OPENAI_API_KEY`
- `bun` available (used by the client scripts)

### Backend

```bash
cd scripts/verify-session-state/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export OPENAI_API_KEY=sk-...
python serve.py
```

The backend exposes:
- An agent named `state-test-agent` with a `session_state = {"counter": 0, "marker": "initial"}` and a tool `increment_counter` that mutates state and yields a `SessionStateUpdatedEvent`.
- A team named `state-test-team` with the same shape.

It listens on `http://localhost:7777`.

### Client

In a second terminal (from the repo root):

```bash
# Wire-format checks — each one is independent
bun run scripts/verify-session-state/client/01_capture_run_completed_agent.ts
bun run scripts/verify-session-state/client/02_capture_run_completed_team.ts
bun run scripts/verify-session-state/client/03_capture_custom_event.ts
bun run scripts/verify-session-state/client/04_get_session_by_id.ts

# Client library integration — uses AgnoClient directly, exercises the full
# subscription chain (session-state:change, refresh events, opt-out config).
# Requires `bun run build` to have been run at the repo root.
bun run scripts/verify-session-state/client/05_client_integration.ts
```

Each script prints `PASS` or `FAIL` per assertion and exits non-zero on failure. Scripts 01-04 validate the Agno wire format; script 05 validates our client wiring against that format.

## Reading the output

Each script dumps the relevant chunks to stdout (truncated where verbose) and asserts the presence and shape of `session_state`. On failure, the script prints the full chunk it received so you can see what's actually on the wire.

## Why this lives in the repo

These scripts also serve as a regression suite. If a future Agno release changes the wire format, re-running them surfaces it before the lib silently breaks.
