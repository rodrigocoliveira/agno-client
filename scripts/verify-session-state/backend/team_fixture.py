"""
Team fixture for Phase 0 session_state verification.

Mirrors agent_fixture.py at the team level. Verifies that TeamRunCompleted
carries session_state and that custom events yielded by team tools propagate
session_state in their payloads.
"""

from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.team import Team
from agno.tools import tool

from agent_fixture import SessionStateUpdatedEvent


def create_state_test_team(db):
    @tool()
    async def increment_team_counter(run_context):
        """Increments the team counter in session_state by 1 and yields the new state.

        Use this tool whenever the user asks to count, increment, or bump the counter.
        """
        state = run_context.session_state
        state["counter"] = int(state.get("counter", 0)) + 1
        state["last_action"] = "increment_team_counter"
        yield SessionStateUpdatedEvent(session_state=dict(state))
        yield f"team counter is now {state['counter']}"

    counter_agent = Agent(
        name="counter-agent",
        id="counter-agent",
        db=db,
        model=OpenAIChat(id="gpt-4o-mini"),
        description="Counter specialist that mutates session_state.",
        instructions=[
            "You are responsible for counter operations.",
            "When asked to count or increment, call increment_team_counter.",
        ],
        tools=[increment_team_counter],
    )

    return Team(
        name="state-test-team",
        id="state-test-team",
        db=db,
        members=[counter_agent],
        model=OpenAIChat(id="gpt-4o-mini"),
        description="Team used to verify session_state propagation in agno-client.",
        instructions=[
            "Coordinate with the counter-agent for any counter-related requests.",
            "When the user asks to count, increment, or bump the counter, delegate to counter-agent.",
        ],
        session_state={"counter": 0, "marker": "team-initial"},
        add_history_to_context=True,
        markdown=False,
    )
