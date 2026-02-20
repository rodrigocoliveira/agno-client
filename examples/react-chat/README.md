# Agno React Chat Example

A comprehensive chat application demonstrating the `@rodrigocoliveira/agno-react` library with two distinct approaches: building from scratch with hooks, or using pre-built compound components. Built with a modern UI using shadcn/ui.

## Two Chat Approaches

This example showcases two ways to build a chat interface:

### Chat (Root) — `/chat-root`

Build from scratch using React hooks. You have full control over every piece of the UI: message rendering, input handling, layout, and styling.

- Uses `useAgnoChat()`, `useAgnoSession()`, `useAgnoActions()`, `useAgnoClient()`
- Custom `ChatInterface`, `MessageItem`, `PromptInput` components
- Best for highly custom UIs or when you need fine-grained control

### Chat (Composed) — `/chat-composed`

Use the `AgnoChat` compound component from `@rodrigocoliveira/agno-react/ui`. Pre-built UI with customization via props and slots — get a full-featured chat interface with minimal code.

- Uses `AgnoChat` with sub-components: `Messages`, `EmptyState`, `SuggestedPrompts`, `ToolStatus`, `ErrorBar`, `Input`
- Customizable via props (avatars, classNames, action buttons, audio mode)
- Best for rapid development or when the default UI fits your needs

## Features

### Core Features
- Real-time message streaming with live updates
- Agent/Team configuration with dynamic endpoint management
- Session management (create, load, switch between sessions)
- Tool call execution with detailed display of arguments and results
- Frontend tool execution (HITL) with auto-execute and manual confirmation
- Reasoning steps visualization
- Media support (images, videos, audio)
- RAG references display
- Audio recording and transcription
- Error handling with user-friendly notifications

### React Hooks Demonstrated (Root approach)
- `useAgnoChat()` — Message management and streaming
- `useAgnoSession()` — Session loading and management
- `useAgnoActions()` — Initialization and configuration
- `useAgnoClient()` — Direct client access for advanced features
- `useAgnoToolExecution()` — Frontend tool execution (HITL)

### UI Components

**Custom components (Root approach):**
- **ChatInterface** — Custom message display with role-based styling
- **PromptInput** — Text input with send button and audio recorder
- **MessageItem** — Individual message with tool calls, reasoning, media

**Library components (Composed approach):**
- **AgnoChat** — Compound component with Messages, EmptyState, SuggestedPrompts, ToolStatus, ErrorBar, Input
- **AgnoMessageItem** — Pre-built message rendering with markdown, tool calls, reasoning
- **AgnoChatInput** — Input with file uploads, audio recording, and transcription

**Shared components:**
- **Configuration Panel** — Endpoint, auth, mode, and entity configuration
- **Session Sidebar** — Browse and load previous conversations
- **State Inspector** — Debug panel for real-time state and event monitoring
- **Responsive Layout** — Collapsible sidebars for optimal screen usage

## Setup

### Prerequisites

- Node.js 18+
- pnpm 8+
- An Agno instance running (default: `http://localhost:7777`)

### Installation

From the repository root:

```bash
# Install all dependencies
pnpm install

# Build the library packages (required before running the example)
pnpm build

# Navigate to the example directory
cd examples/react-chat

# Install example dependencies (if not already installed)
pnpm install
```

### Configuration

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Edit `.env` and configure your Agno connection:

```env
# Agno endpoint URL (default: http://localhost:7777)
VITE_AGNO_ENDPOINT=http://localhost:7777

# Optional: Authentication token for Agno API
VITE_AGNO_AUTH_TOKEN=

# Optional: Default mode (agent or team)
VITE_AGNO_MODE=agent

# Optional: Default agent ID
VITE_AGNO_AGENT_ID=

# Optional: Default team ID
VITE_AGNO_TEAM_ID=

# Optional: Database ID
VITE_AGNO_DB_ID=
```

**Note:** All configuration options can also be changed in the UI at runtime.

## Running the Example

```bash
# From examples/react-chat directory
pnpm dev
```

The application will open at `http://localhost:3000`.

## Usage Guide

### 1. Initialize the Connection

1. Click the **Settings** icon in the top-right corner
2. Verify the endpoint URL is correct
3. Click **Initialize** to connect to Agno and fetch available agents/teams
4. Check the "Endpoint Status" badge turns green
5. **The first available agent/team will be automatically selected** with its database ID

### 2. Configure Agent/Team (Optional)

If you want to change the auto-selected agent/team:

1. In the Configuration Panel, select **Mode** (Agent or Team)
2. Choose a different agent or team from the dropdown
3. Click **Apply Config**

### 3. Start Chatting

1. Navigate to **Chat (Root)** or **Chat (Composed)** in the sidebar
2. Type your message in the input box at the bottom
3. Press **Enter** or click the **Send** button
4. Watch as the agent responds in real-time with streaming updates

### 4. Manage Sessions

1. Click **New Chat** in the Sessions sidebar to start a fresh conversation
2. Click **Refresh** to load all available sessions
3. Click on any session to load its message history

### 5. Explore Advanced Features

- **Tool Calls**: Expand accordion items to see tool execution details
- **Reasoning Steps**: View the agent's thought process (if available)
- **References**: See RAG context sources
- **Media**: Images, videos, and audio are displayed inline
- **Audio Recording**: Record and send audio messages or transcribe speech to text
- **Debug Panel**: Monitor state changes and events in real-time

## Project Structure

```
examples/react-chat/
├── src/
│   ├── pages/
│   │   ├── ChatRootPage.tsx         # Hooks-based chat (build from scratch)
│   │   ├── ChatComposedPage.tsx     # Compound component chat (AgnoChat)
│   │   ├── HomePage.tsx             # Landing page
│   │   ├── SessionsPage.tsx         # Session management
│   │   ├── MemoryPage.tsx           # Memory management
│   │   └── ...                      # Other pages
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatInterface.tsx    # Main chat container (Root approach)
│   │   │   ├── MessageList.tsx      # Scrollable message display
│   │   │   ├── MessageItem.tsx      # Individual message with features
│   │   │   ├── PromptInput.tsx      # Text input with send button
│   │   │   └── StreamingIndicator.tsx
│   │   ├── config/
│   │   │   └── ConfigPanel.tsx      # Configuration UI
│   │   ├── sessions/
│   │   │   └── SessionSidebar.tsx   # Session list and management
│   │   ├── debug/
│   │   │   └── StateInspector.tsx   # Debug/monitoring panel
│   │   ├── generative-ui/          # Custom renderers (charts, card grids)
│   │   └── ui/                      # shadcn components
│   ├── tools/                       # Example generative UI tool handlers
│   ├── lib/
│   │   └── utils.ts                 # Utility functions
│   ├── styles/
│   │   └── globals.css              # Tailwind styles
│   ├── App.tsx                      # Router and route definitions
│   └── main.tsx                     # Entry point
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── README.md
```

## Building for Production

```bash
# From examples/react-chat directory
pnpm build

# Preview the production build
pnpm preview
```

The optimized build will be in the `dist/` directory.

## Troubleshooting

### Endpoint Connection Issues

- Ensure your Agno instance is running
- Check the endpoint URL in settings matches your Agno server
- Verify network connectivity: `curl http://localhost:7777/v1/status`

### No Agents/Teams Available

- Click **Initialize** in the Configuration Panel
- Check the Agno server logs for errors
- Verify your Agno instance has agents or teams configured

### Streaming Not Working

- Check the browser console for errors
- Verify the selected agent/team ID is valid
- Ensure the Agno endpoint supports streaming responses

### Session Loading Fails

- Ensure you have an active agent/team configured
- Check that the session ID exists on the Agno server
- Verify authentication token (if required)

## Development

### Running with Library Development Mode

To develop the library and example simultaneously:

```bash
# Terminal 1: Watch library changes (from repo root)
pnpm dev

# Terminal 2: Run example with hot reload
cd examples/react-chat
pnpm dev
```

Changes to the library packages will automatically rebuild and hot-reload in the example.

### Adding Components

shadcn components are configured in `components.json`. To add more:

```bash
pnpm dlx shadcn@latest add [component-name]
```

## License

MIT

## Related

- [Agno Documentation](https://docs.agno.ai)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [@rodrigocoliveira/agno-client](../../packages/core)
- [@rodrigocoliveira/agno-react](../../packages/react)
- [@rodrigocoliveira/agno-types](../../packages/types)
