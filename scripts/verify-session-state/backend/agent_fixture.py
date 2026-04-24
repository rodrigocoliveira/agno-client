"""
Agent fixture for Phase 0 session_state verification.

Defines a minimal agent with a tool that mutates session_state and yields
a SessionStateUpdatedEvent during execution. Used to verify that:
  - The chunk emitted on RunCompleted carries `session_state`.
  - A custom event yielded mid-run carries `session_state` in its payload.
"""

from dataclasses import dataclass
from typing import Any, Dict, Optional

from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.run.agent import CustomEvent
from agno.tools import tool


@dataclass
class SessionStateUpdatedEvent(CustomEvent):
    """Custom event yielded by tools to push session_state to the client mid-run."""

    session_state: Optional[Dict[str, Any]] = None


def create_state_test_agent(db):
    @tool()
    async def increment_counter(run_context):
        """Increments the counter in session_state by 1 and yields the new state.

        Use this tool whenever the user asks to count, increment, or bump the counter.
        """
        state = run_context.session_state
        state["counter"] = int(state.get("counter", 0)) + 1
        state["last_action"] = "increment_counter"
        yield SessionStateUpdatedEvent(session_state=dict(state))
        # Yield the textual result last; Agno surfaces the final yielded string as the tool result.
        yield f"counter is now {state['counter']}"

    return Agent(
        name="state-test-agent",
        id="state-test-agent",
        db=db,
        model=OpenAIChat(id="gpt-4o-mini"),
        description="Agent used to verify session_state propagation in agno-client.",
        instructions=[
            "You are a counter agent.",
            "When the user asks to count, increment, or bump the counter, call increment_counter.",
            "After calling the tool, briefly confirm the new counter value.",
        ],
        session_state={"counter": 0, "marker": "initial"},
        tools=[increment_counter],
        add_history_to_context=True,
        markdown=False,
    )
