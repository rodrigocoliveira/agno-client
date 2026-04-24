"""
Verification AgentOS server.

Serves the state-test agent and team for the Phase 0 verification scripts.
Listens on http://localhost:7777.

Usage:
    cd scripts/verify-session-state/backend
    python -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
    export OPENAI_API_KEY=sk-...
    python serve.py
"""

import os
import sys

# Make sibling files importable when running from this directory.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from agno.db.sqlite import SqliteDb
from agno.os import AgentOS
from dotenv import load_dotenv

from agent_fixture import create_state_test_agent
from team_fixture import create_state_test_team

# Load .env from the verification backend dir, then fall back to the
# repo's existing dev .env so `OPENAI_API_KEY` is available out of the box.
HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
for candidate in (
    os.path.join(HERE, ".env"),
    os.path.join(REPO_ROOT, "examples", "agno-mock-server", ".env"),
    os.path.join(REPO_ROOT, ".env"),
):
    if os.path.exists(candidate):
        load_dotenv(candidate, override=False)

os.makedirs("tmp", exist_ok=True)
db = SqliteDb(db_file="tmp/verify-session-state.db")

agent = create_state_test_agent(db)
team = create_state_test_team(db)

agent_os = AgentOS(
    id="verify-session-state",
    description="Phase 0 fixture for session_state verification.",
    agents=[agent],
    teams=[team],
    db=db,
)

app = agent_os.get_app()


if __name__ == "__main__":
    print("\n" + "=" * 70)
    print("Phase 0 verification server")
    print("=" * 70)
    print("\nAgent:  state-test-agent  (initial state: counter=0, marker=initial)")
    print("Team:   state-test-team    (initial state: counter=0, marker=team-initial)")
    print("\nListening on http://localhost:7777\n")
    print("Run the client scripts in another terminal:")
    print("  bun run scripts/verify-session-state/client/01_capture_run_completed_agent.ts")
    print("  bun run scripts/verify-session-state/client/02_capture_run_completed_team.ts")
    print("  bun run scripts/verify-session-state/client/03_capture_custom_event.ts")
    print("  bun run scripts/verify-session-state/client/04_get_session_by_id.ts")
    print("=" * 70 + "\n")

    agent_os.serve(app="serve:app", reload=False)
