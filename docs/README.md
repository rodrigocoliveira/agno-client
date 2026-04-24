# Documentation

Welcome to the Agno Client Libraries documentation. This hub links to all guides, architecture details, and API references.

## Quick Links

| Resource | Description |
|----------|-------------|
| [Getting Started](./guides/01_getting_started.md) | Send your first message in under 5 minutes |
| [Architecture](./architecture.md) | Package structure, event flow, and internals |
| [Frontend Tool Execution](./frontend-tools.md) | Human-in-the-Loop (HITL) and Generative UI |

## Package API References

| Package | Description | README |
|---------|-------------|--------|
| `@rodrigocoliveira/agno-client` | Core stateful client | [API Reference](../packages/core/README.md) |
| `@rodrigocoliveira/agno-react` | React hooks adapter | [API Reference](../packages/react/README.md) |
| `@rodrigocoliveira/agno-types` | Shared TypeScript types | [API Reference](../packages/types/README.md) |

## Step-by-Step Guides

The [guides](./guides/README.md) follow a progressive learning path. Start from the top and work your way down, or jump to the topic you need.

### Getting Started

| Guide | Topics |
|-------|--------|
| [01. Getting Started](./guides/01_getting_started.md) | Installation, first message, basic setup |
| [02. Configuration](./guides/02_configuration.md) | Endpoint, auth, mode, userId, dbId |
| [03. Sending Messages](./guides/03_sending_messages.md) | Message sending, streaming, cancellation |
| [04. Handling Responses](./guides/04_handling_responses.md) | ChatMessage structure, tool calls, reasoning |
| [05. Session Management](./guides/05_session_management.md) | Load, list, delete sessions |

### React Integration

| Guide | Topics |
|-------|--------|
| [06. React Basics](./guides/06_react_basics.md) | AgnoProvider, hooks overview |
| [07. React Chat UI](./guides/07_react_chat_ui.md) | Complete chat interface |

### Frontend Tool Execution (HITL)

| Guide | Topics |
|-------|--------|
| [08. Tool Execution Basics](./guides/08_tool_execution_basics.md) | HITL concept, auto-execution |
| [09. Tool Execution Advanced](./guides/09_tool_execution_advanced.md) | Manual approval, global handlers |

### Generative UI

| Guide | Topics |
|-------|--------|
| [10. Generative UI: Charts](./guides/10_generative_ui_charts.md) | Bar, line, pie, area charts |
| [11. Generative UI: Components](./guides/11_generative_ui_components.md) | Cards, tables, custom renders |

### Advanced Topics

| Guide | Topics |
|-------|--------|
| [12. State and Events](./guides/12_state_and_events.md) | ClientState, event listeners |
| [13. Custom Params & Headers](./guides/13_custom_params_headers.md) | Query params, custom headers |
| [14. Media Handling](./guides/14_media_handling.md) | Images, video, audio |
| [15. Error Handling](./guides/15_error_handling.md) | Error recovery, debugging |
| [16. Production Tips](./guides/16_production_tips.md) | Security, performance, best practices |
| [17. Secure Authentication](./guides/17_secure_auth.md) | Token refresh, short-lived tokens |

## Design Documents

| Document | Description |
|----------|-------------|
| [Generative UI Design](../GENERATIVE_UI_DESIGN.md) | Internal design spec for Generative UI architecture |
