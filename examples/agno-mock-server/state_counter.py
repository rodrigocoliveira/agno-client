"""
State Counter Agent + Team

Demonstrates the `session_state` synchronization features of agno-client:
  - Tools that mutate session_state mid-run
  - A custom event (`SessionStateUpdatedEvent`) yielded after every mutation,
    so React clients using `useAgnoSessionState` see updates live without
    waiting for the run to complete.
  - The same shape works for both agents and teams.

Pattern is intentionally identical to scripts/verify-session-state/backend/
agent_fixture.py (the regression-tested fixture). Copied (not imported) so
the demo isn't coupled to verification scripts.
"""

from dataclasses import dataclass
from typing import Any, Dict, Optional

from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.run.agent import CustomEvent
from agno.team import Team
from agno.tools import tool


@dataclass
class SessionStateUpdatedEvent(CustomEvent):
    """Yielded by tools to push session_state to the client mid-run.

    The agno-client library auto-extracts the `session_state` field from any
    custom event with that key (controlled by `extractSessionStateFromCustomEvent`).
    """

    session_state: Optional[Dict[str, Any]] = None


def _initial_state() -> Dict[str, Any]:
    return {"counter": 0, "history": []}


@tool()
async def increment_counter(run_context, by: int = 1):
    """Increment the counter in session_state. Use when the user asks to
    increment, bump, count, or add to the counter. Defaults to +1.

    Args:
        by: Amount to increment by. Defaults to 1.
    """
    state = run_context.session_state
    state["counter"] = int(state.get("counter", 0)) + int(by)
    history = state.setdefault("history", [])
    history.append({"action": "increment", "by": int(by), "result": state["counter"]})
    yield SessionStateUpdatedEvent(session_state=dict(state))
    yield f"counter is now {state['counter']}"


@tool()
async def reset_counter(run_context):
    """Reset the counter back to zero. Use when the user asks to reset, clear,
    or zero the counter."""
    state = run_context.session_state
    state["counter"] = 0
    history = state.setdefault("history", [])
    history.append({"action": "reset", "result": 0})
    yield SessionStateUpdatedEvent(session_state=dict(state))
    yield "counter reset to 0"


def create_state_counter_agent(db) -> Agent:
    """Single-agent counter that mutates its own session_state."""
    return Agent(
        name="state-counter-agent",
        id="state-counter-agent",
        db=db,
        model=OpenAIChat(id="gpt-4o-mini"),
        description="Demo agent that mutates session_state via tools and yields a SessionStateUpdatedEvent so clients can live-sync.",
        instructions=[
            "You are a counter agent.",
            "When the user asks to increment, bump, add, or count: call increment_counter.",
            "When the user asks to reset, clear, or zero: call reset_counter.",
            "After calling a tool, briefly confirm the new value in one short sentence.",
        ],
        session_state=_initial_state(),
        tools=[increment_counter, reset_counter],
        add_history_to_context=True,
        markdown=False,
    )


def create_state_counter_team(db) -> Team:
    """Team variant — exercises the post-team-run REST refresh fallback in
    agno-client (Agno 2.6.0 emits `TeamRunCompleted` without `session_state`)."""
    counter_agent = Agent(
        name="counter-worker",
        id="counter-worker",
        db=db,
        model=OpenAIChat(id="gpt-4o-mini"),
        description="Counter specialist that mutates the team's session_state.",
        instructions=[
            "You handle counter operations for the team.",
            "When asked to increment, bump, or count: call increment_counter.",
            "When asked to reset: call reset_counter.",
        ],
        tools=[increment_counter, reset_counter],
    )

    return Team(
        name="state-counter-team",
        id="state-counter-team",
        db=db,
        members=[counter_agent],
        model=OpenAIChat(id="gpt-4o-mini"),
        description="Demo team that mutates session_state via member tools.",
        instructions=[
            "Coordinate with counter-worker for any counter-related request.",
            "When the user asks to increment, bump, count, or reset: delegate to counter-worker.",
        ],
        session_state=_initial_state(),
        add_history_to_context=True,
        markdown=False,
    )
