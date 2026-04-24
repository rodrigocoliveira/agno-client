"""
Agno Mock Server

Serves both an agent and a team for testing the agno-client library.

Usage:
    python examples/agno-mock-server/server.py

Then connect the frontend to http://localhost:7777
"""

from agno.db.sqlite import SqliteDb
from agno.os import AgentOS
from dotenv import load_dotenv

from agent import create_agent, create_knowledge_base
from team import create_team
from state_counter import create_state_counter_agent, create_state_counter_team
from agno.tracing import setup_tracing

load_dotenv()

# Shared database for sessions and other data
db = SqliteDb(db_file="tmp/data.db")

# Enable tracing (call once at startup)
setup_tracing(db=db)

# Create a separate database for knowledge content with an explicit ID
# This ID is used by the frontend to access the knowledge API
knowledge_db = SqliteDb(
    db_file="tmp/knowledge.db",
    id="demo-knowledge-db",  # Explicit ID for the AgentOS knowledge API
)

# Create the knowledge base with the dedicated database
knowledge = create_knowledge_base(contents_db=knowledge_db)

# Create the agent with the knowledge base
agent = create_agent(db, knowledge=knowledge)

# Create the team
team = create_team(db)

# Create the session_state demo agent + team (used by the SessionStatePage in
# examples/react-chat). Backed by the same db; isolated session_state per session.
state_counter_agent = create_state_counter_agent(db)
state_counter_team = create_state_counter_team(db)

# Create AgentOS with agent, team, knowledge, and tracing
agent_os = AgentOS(
    id="agno-demo",
    description="Demo server with agent and team examples",
    agents=[agent, state_counter_agent],
    teams=[team, state_counter_team],
    db=db,
    knowledge=[knowledge],  # Attach knowledge to AgentOS for the knowledge API
    tracing=True,  # Enable detailed tracing (uses setup_tracing db)
    scheduler=True,
    scheduler_poll_interval=15,  # seconds between poll cycles (default: 15)
)

app = agent_os.get_app()

# --- Fake transcription endpoint for testing audio transcription mode ---
import asyncio
from starlette.requests import Request
from starlette.responses import JSONResponse

async def transcribe(request: Request):
    """Fake transcription endpoint that returns a fixed string after a simulated delay."""
    await asyncio.sleep(1.5)  # Simulate API latency
    return JSONResponse({"transcription": "This is a fake transcription. Implement the backend to transcribe."})

app.add_route("/transcribe", transcribe, methods=["POST"])

if __name__ == "__main__":
    print("\n" + "="*70)
    print("Agno Demo Server")
    print("="*70)
    print("\nAvailable components:")
    print("\n  AGENT: generative-ui-demo")
    print("    - Revenue charts (bar/line)")
    print("    - Rental car cards")
    print("    - Product comparison tables")
    print("    - Dashboard metrics")
    print("    - Smart data visualization")
    print("    - Knowledge base with vector search (LanceDB)")
    print("\n  TEAM: language-team")
    print("    - English agent")
    print("    - Chinese agent")
    print("    - Germanic team (German + Dutch agents)")
    print("\n  AGENT: state-counter-agent  (session_state demo)")
    print("    - increment_counter / reset_counter tools")
    print("    - Yields SessionStateUpdatedEvent for live mid-run sync")
    print("\n  TEAM:  state-counter-team   (session_state demo + team REST refresh path)")
    print("    - Same tools delegated through a member agent")
    print("\nStarting server on http://localhost:7777")
    print("\nExample prompts:")
    print("  Agent: 'Show me monthly revenue'")
    print("  Agent: 'Compare laptops'")
    print("  Team:  'Say hello in all languages'")
    print("\nKnowledge base:")
    print("  Upload documents via the Knowledge page in the demo app")
    print("  Knowledge DB ID: demo-knowledge-db")
    print("  Vector storage: tmp/lancedb")
    print("\n" + "="*70 + "\n")

    agent_os.serve(app="server:app", reload=True)
