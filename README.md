# Agno Client Libraries

JavaScript/TypeScript client libraries for [Agno AgentOS](https://docs.agno.com/agentOS).

![Agno Client API Demo](./assets/demo.png)

## What is Agno AgentOS?

[Agno](https://www.agno.com) is a framework for building multi-agent AI systems. [AgentOS](https://docs.agno.com/agentOS) is the production runtime that serves your agents over HTTP with built-in session management, memory, and tool execution.

This project provides the official JavaScript/TypeScript client for connecting to AgentOS. It handles streaming responses, session history, memory management, and frontend tool execution so you can focus on building your UI.

## Packages

| Package | Description | Install |
|---------|-------------|---------|
| [`@rodrigocoliveira/agno-react`](./packages/react) | React hooks adapter (includes core + types) | `npm install @rodrigocoliveira/agno-react` |
| [`@rodrigocoliveira/agno-client`](./packages/core) | Core stateful client for any JS environment | `npm install @rodrigocoliveira/agno-client` |
| [`@rodrigocoliveira/agno-types`](./packages/types) | Shared TypeScript types | `npm install @rodrigocoliveira/agno-types` |

> **Note:** `@rodrigocoliveira/agno-react` includes the core client and types as dependencies. For React apps, you only need to install the React package.

## Quick Start (React)

```tsx
import { AgnoProvider, useAgnoChat, useAgnoActions } from '@rodrigocoliveira/agno-react';

function App() {
  return (
    <AgnoProvider
      config={{
        endpoint: 'http://localhost:7777',
        mode: 'agent',
        agentId: 'your-agent-id',
      }}
    >
      <Chat />
    </AgnoProvider>
  );
}

function Chat() {
  const { messages, sendMessage, isStreaming } = useAgnoChat();
  const { initialize } = useAgnoActions();

  useEffect(() => { initialize(); }, [initialize]);

  return (
    <div>
      {messages.map((msg, i) => (
        <div key={i}><strong>{msg.role}:</strong> {msg.content}</div>
      ))}
      <button onClick={() => sendMessage('Hello!')} disabled={isStreaming}>
        Send
      </button>
    </div>
  );
}
```

See the [full guides](./docs/guides/README.md) for a complete walkthrough.

## Quick Start (Core)

```typescript
import { AgnoClient } from '@rodrigocoliveira/agno-client';

const client = new AgnoClient({
  endpoint: 'http://localhost:7777',
  mode: 'agent',
  agentId: 'your-agent-id',
});

client.on('message:update', (messages) => console.log(messages));
await client.sendMessage('Hello!');
```

## Features

- **Real-time streaming** -- incremental JSON parsing for token-by-token responses
- **Session management** -- load, list, and delete conversation history ([guide](./docs/guides/05_session_management.md))
- **Memory API** -- create, read, update, and delete user memories across sessions
- **Frontend tool execution (HITL)** -- delegate tools to the browser with auto or manual approval ([docs](./docs/frontend-tools.md))
- **Generative UI** -- render charts, cards, and tables driven by agent responses ([guide](./docs/guides/10_generative_ui_charts.md))
- **Request cancellation** -- abort client stream and notify backend in one call
- **Auth token refresh** -- automatic retry on 401 with `onTokenExpired` callback ([guide](./docs/guides/17_secure_auth.md))
- **Custom query parameters** -- append params globally or per-request ([guide](./docs/guides/13_custom_params_headers.md))
- **User ID tracking** -- link sessions and memories to specific users
- **TypeScript-first** -- full type coverage matching the Agno API spec

## Documentation

| Resource | Description |
|----------|-------------|
| [Documentation Hub](./docs/README.md) | Index of all docs and guides |
| [Getting Started](./docs/guides/01_getting_started.md) | First message in under 5 minutes |
| [Step-by-Step Guides](./docs/guides/README.md) | 17 progressive guides from basics to production |
| [Architecture](./docs/architecture.md) | Package structure, event flow, internals |
| [Frontend Tool Execution](./docs/frontend-tools.md) | HITL and Generative UI reference |
| [Core Client API](./packages/core/README.md) | `@rodrigocoliveira/agno-client` API |
| [React Hooks API](./packages/react/README.md) | `@rodrigocoliveira/agno-react` API |
| [Type Definitions](./packages/types/README.md) | `@rodrigocoliveira/agno-types` API |

## Development

### Prerequisites

- Node.js 18+
- [Bun](https://bun.sh) 1.0+

### Setup

```bash
bun install        # Install dependencies
bun run build      # Build all packages (types -> core -> react)
bun run dev        # Watch mode
bun run typecheck  # Type checking
```

### Project Structure

```
agno-client/
├── packages/
│   ├── core/          # @rodrigocoliveira/agno-client
│   ├── react/         # @rodrigocoliveira/agno-react
│   └── types/         # @rodrigocoliveira/agno-types
├── docs/              # Guides and architecture docs
├── examples/
│   └── react-chat/    # Example React app
└── package.json       # Monorepo root
```

## Contributing

Contributions are welcome! This is an independent open-source project.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

## Acknowledgments

This library is built to work with [Agno](https://www.agno.com) agents and [AgentOS](https://docs.agno.com/agentOS). It is an independent open-source project and is not officially affiliated with or endorsed by Agno.
