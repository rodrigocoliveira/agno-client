# @rodrigocoliveira/agno-react

React hooks and pre-built UI components for Agno client with full TypeScript support.

## Installation

```bash
npm install @rodrigocoliveira/agno-react
```

This package includes `@rodrigocoliveira/agno-client` and `@rodrigocoliveira/agno-types` as dependencies.

## Features

- **Easy Integration** — Drop-in React hooks for Agno agents
- **Context Provider** — Manages client lifecycle automatically
- **Real-time Updates** — React state synced with streaming updates
- **Pre-built UI Components** — Compound components and primitives via `/ui` sub-path
- **Audio Recording & Transcription** — Record audio to send or transcribe to text
- **Frontend Tool Execution (HITL)** — Execute agent tools in the browser
- **Type-Safe** — Full TypeScript support
- **Familiar API** — Matches the original Agno React hooks design

## Quick Start

### 1. Wrap Your App with AgnoProvider

```tsx
import { AgnoProvider } from '@rodrigocoliveira/agno-react';

function App() {
  return (
    <AgnoProvider
      config={{
        endpoint: 'http://localhost:7777',
        mode: 'agent',
        agentId: 'your-agent-id',
        userId: 'user-123',
        headers: { 'X-API-Version': 'v2' },
        params: { locale: 'en-US' }
      }}
    >
      <YourComponents />
    </AgnoProvider>
  );
}
```

### 2. Use Hooks in Your Components

```tsx
import { useAgnoChat, useAgnoActions } from '@rodrigocoliveira/agno-react';

function ChatComponent() {
  const { messages, sendMessage, isStreaming, error } = useAgnoChat();
  const { initialize } = useAgnoActions();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleSend = async () => {
    await sendMessage('Hello, agent!');
  };

  return (
    <div>
      {messages.map((msg, i) => (
        <div key={i}>
          <strong>{msg.role}:</strong> {msg.content}
        </div>
      ))}
      {error && <div>Error: {error}</div>}
      <button onClick={handleSend} disabled={isStreaming}>
        {isStreaming ? 'Sending...' : 'Send'}
      </button>
    </div>
  );
}
```

### 3. Or Use Pre-built UI Components

For a full-featured chat interface with minimal code, use the compound components from the `/ui` sub-path:

```tsx
import { AgnoChat } from '@rodrigocoliveira/agno-react/ui';

function ChatPage() {
  return (
    <AgnoChat>
      <AgnoChat.Messages>
        <AgnoChat.EmptyState>
          <h3>Welcome!</h3>
          <p>Start a conversation with the agent.</p>
          <AgnoChat.SuggestedPrompts
            prompts={[
              { text: 'What can you help me with?' },
              { text: 'Show me a code example' },
            ]}
          />
        </AgnoChat.EmptyState>
      </AgnoChat.Messages>
      <AgnoChat.ToolStatus />
      <AgnoChat.ErrorBar />
      <AgnoChat.Input placeholder="Ask me anything..." />
    </AgnoChat>
  );
}
```

## API Reference

### AgnoProvider

Provider component that creates and manages an `AgnoClient` instance.

```tsx
<AgnoProvider config={config}>
  {children}
</AgnoProvider>
```

**Props:**
- `config` (AgnoClientConfig) — Client configuration
- `children` (ReactNode) — Child components

### useAgnoClient()

Access the underlying `AgnoClient` instance.

```tsx
const client = useAgnoClient();

// Use client methods directly
await client.sendMessage('Hello!');
```

### useAgnoChat()

Main hook for chat interactions.

```tsx
const {
  messages,        // ChatMessage[] - Current messages
  sendMessage,     // (message, options?) => Promise<void>
  clearMessages,   // () => void
  isStreaming,     // boolean - Is currently streaming
  error,           // string | undefined - Current error
  state,           // ClientState - Full client state
} = useAgnoChat();
```

**Methods:**

#### `sendMessage(message, options?)`

```tsx
// Send a text message
await sendMessage('Hello!');

// Send with FormData (for file uploads)
const formData = new FormData();
formData.append('message', 'Hello!');
formData.append('file', file);
await sendMessage(formData);

// Send with custom headers
await sendMessage('Hello!', {
  headers: { 'X-Custom': 'value' }
});

// Send with query parameters
await sendMessage('Hello!', {
  params: { temperature: '0.7', max_tokens: '500' }
});
```

#### `clearMessages()`

```tsx
clearMessages(); // Clears all messages and resets session
```

### useAgnoSession()

Hook for session management.

```tsx
const {
  sessions,          // SessionEntry[] - Available sessions
  currentSessionId,  // string | undefined - Current session ID
  loadSession,       // (sessionId, options?) => Promise<ChatMessage[]>
  fetchSessions,     // (options?) => Promise<SessionEntry[]>
  isLoading,         // boolean - Is loading session
  error,             // string | undefined - Current error
} = useAgnoSession();
```

### useAgnoActions()

Hook for common actions and initialization.

```tsx
const {
  initialize,       // (options?) => Promise<{ agents, teams }>
  checkStatus,      // (options?) => Promise<boolean>
  fetchAgents,      // (options?) => Promise<AgentDetails[]>
  fetchTeams,       // (options?) => Promise<TeamDetails[]>
  updateConfig,     // (updates) => void
  isInitializing,   // boolean
  error,            // string | undefined
} = useAgnoActions();
```

### useAgnoToolExecution()

Hook for frontend tool execution (Human-in-the-Loop).

```tsx
const toolHandlers = {
  show_alert: async (args) => {
    alert(args.content);
    return { success: true };
  },
};

// Auto-execute tools immediately
useAgnoToolExecution(toolHandlers);

// Or require manual confirmation
useAgnoToolExecution(toolHandlers, false);
```

### useAgnoMemory()

Hook for memory management.

```tsx
const {
  memories,
  topics,
  isLoading,
  fetchMemories,
  createMemory,
  updateMemory,
  deleteMemory,
} = useAgnoMemory();
```

### useAgnoCustomEvents()

Hook for listening to custom events yielded by the backend.

```tsx
useAgnoCustomEvents((event) => {
  console.log('Custom event:', event);
});
```

---

## Pre-built UI Components (`/ui` sub-path)

The library ships with a complete set of pre-built UI components accessible via `@rodrigocoliveira/agno-react/ui`. These components provide a production-ready chat interface with full customization support.

### Peer Dependencies

UI components rely on optional peer dependencies. Install only what you need:

```bash
# Core UI dependencies
npm install @radix-ui/react-slot class-variance-authority clsx tailwind-merge lucide-react

# For markdown rendering
npm install shiki streamdown

# For auto-scroll behavior
npm install use-stick-to-bottom

# For additional primitives (as needed)
npm install @radix-ui/react-accordion @radix-ui/react-avatar @radix-ui/react-collapsible \
  @radix-ui/react-tooltip @radix-ui/react-dropdown-menu @radix-ui/react-hover-card \
  @radix-ui/react-select cmdk
```

### Import Path

All UI components are imported from the `/ui` sub-path:

```tsx
import { AgnoChat, AgnoChatInterface, AgnoChatInput, Button, Response } from '@rodrigocoliveira/agno-react/ui';
```

---

### AgnoChat (Compound Component)

The primary way to build a full-featured chat interface. Uses a compound component pattern — compose only the pieces you need.

```tsx
import { AgnoChat } from '@rodrigocoliveira/agno-react/ui';
import type { ToolHandler } from '@rodrigocoliveira/agno-react';

const toolHandlers: Record<string, ToolHandler> = {
  show_alert: async (args) => {
    alert(args.content);
    return { success: true };
  },
};

function ChatPage() {
  return (
    <AgnoChat toolHandlers={toolHandlers} autoExecuteTools={true}>
      <AgnoChat.Messages
        userAvatar={<img src="/user.png" className="h-8 w-8 rounded-full" />}
        assistantAvatar={<img src="/bot.png" className="h-8 w-8 rounded-full" />}
        messageItemProps={{
          showToolCalls: false,
          showReasoning: false,
          renderActions: (message) => (
            <button onClick={() => navigator.clipboard.writeText(message.content || '')}>
              Copy
            </button>
          ),
        }}
      >
        <AgnoChat.EmptyState>
          <h3>Welcome!</h3>
          <p>How can I help you today?</p>
          <AgnoChat.SuggestedPrompts
            prompts={[
              { icon: <span>⚡</span>, text: 'What can you help me with?' },
              { icon: <span>💡</span>, text: 'Show me a code example' },
            ]}
          />
        </AgnoChat.EmptyState>
      </AgnoChat.Messages>

      <AgnoChat.ToolStatus className="bg-violet-500/5 border-violet-500/20" />
      <AgnoChat.ErrorBar className="bg-red-500/5" />
      <AgnoChat.Input
        placeholder="Ask me anything..."
        showAudioRecorder={true}
        audioMode="transcribe"
        transcriptionEndpoint="http://localhost:8000/transcribe"
      />
    </AgnoChat>
  );
}
```

**Sub-components:**

| Component | Description |
|-----------|-------------|
| `AgnoChat` | Root wrapper. Accepts `toolHandlers` and `autoExecuteTools` props. |
| `AgnoChat.Messages` | Message list with auto-scroll. Accepts `userAvatar`, `assistantAvatar`, `messageItemProps`. |
| `AgnoChat.EmptyState` | Shown when there are no messages. Place inside `Messages`. |
| `AgnoChat.SuggestedPrompts` | Clickable prompt suggestions. Place inside `EmptyState`. |
| `AgnoChat.ToolStatus` | Status bar shown when tools are executing. |
| `AgnoChat.ErrorBar` | Error display bar. |
| `AgnoChat.Input` | Chat input with file uploads and optional audio recorder. |

---

### AgnoChatInterface

A single-component shortcut that renders a complete chat interface. Less flexible than `AgnoChat` but requires zero composition.

```tsx
import { AgnoChatInterface } from '@rodrigocoliveira/agno-react/ui';

function ChatPage() {
  return (
    <AgnoChatInterface
      placeholder="Type a message..."
      suggestedPrompts={[
        { text: 'What can you help me with?' },
        { text: 'Explain how you work' },
      ]}
      toolHandlers={toolHandlers}
      showAudioRecorder={true}
      userAvatar={<img src="/user.png" />}
      assistantAvatar={<img src="/bot.png" />}
      emptyState={<div>Start a conversation!</div>}
      classNames={{
        root: 'h-full',
        messagesArea: 'px-4',
        inputArea: 'border-t',
      }}
    />
  );
}
```

**Key props:** `className`, `classNames`, `renderMessage`, `renderInput`, `emptyState`, `headerSlot`, `inputToolbarSlot`, `suggestedPrompts`, `toolHandlers`, `autoExecuteTools`, `placeholder`, `userAvatar`, `assistantAvatar`, `fileUpload`, `showAudioRecorder`, `messageItemProps`, `chatInputProps`.

---

### AgnoChatInput

Standalone chat input component with file uploads, audio recording, and transcription support.

```tsx
import { AgnoChatInput } from '@rodrigocoliveira/agno-react/ui';

<AgnoChatInput
  onSend={(message) => { /* handle message */ }}
  placeholder="Type a message..."
  showAudioRecorder={true}
  showAttachments={true}
  audioMode="transcribe"
  transcriptionEndpoint="http://localhost:8000/transcribe"
  parseTranscriptionResponse={(data) => data.text}
  onRequestPermission={async () => {
    // WebView: request mic permission from native bridge
    return await NativeBridge.requestMicPermission();
  }}
  fileUpload={{
    accept: 'image/*,.pdf',
    multiple: true,
    maxFiles: 5,
    maxFileSize: 10 * 1024 * 1024,
  }}
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onSend` | `(message: string \| FormData) => void` | required | Called when the user sends a message |
| `disabled` | `boolean` | `false` | Disable the input |
| `placeholder` | `string` | — | Input placeholder text |
| `showAudioRecorder` | `boolean` | `false` | Show the audio recorder button |
| `showAttachments` | `boolean` | `true` | Show the file attachment button |
| `audioMode` | `'send' \| 'transcribe'` | `'send'` | Audio recording behavior |
| `transcriptionEndpoint` | `string` | — | URL to POST audio for transcription (required when `audioMode='transcribe'`) |
| `transcriptionHeaders` | `Record<string, string>` | — | Extra headers for transcription requests |
| `parseTranscriptionResponse` | `(data: unknown) => string` | — | Custom parser for transcription API response |
| `onRequestPermission` | `() => Promise<boolean>` | — | WebView mic permission bridge callback |
| `fileUpload` | `FileUploadConfig` | — | File upload configuration |
| `status` | `ChatStatus` | — | Input status (`'idle'`, `'submitted'`, `'streaming'`, `'error'`) |
| `extraTools` | `ReactNode` | — | Additional toolbar buttons |

---

### Audio Recorder & Transcription

The library includes an `AudioRecorder` component that supports two modes:

#### Send mode (default)

Records audio, encodes to WAV, and sends the blob directly as a file attachment:

```tsx
<AgnoChatInput
  onSend={handleSend}
  showAudioRecorder={true}
  audioMode="send"
/>
```

The audio blob is wrapped in a `FormData` with `message="Audio message"` and the WAV file.

#### Transcribe mode

Records audio, sends it to a transcription endpoint, and inserts the resulting text into the input:

```tsx
<AgnoChatInput
  onSend={handleSend}
  showAudioRecorder={true}
  audioMode="transcribe"
  transcriptionEndpoint="http://localhost:8000/transcribe"
  parseTranscriptionResponse={(data) => data.text}
/>
```

The component POSTs the WAV file to the endpoint and expects a JSON response. The default parser checks `data.text`, `data.transcript`, and `data.transcription` fields. Provide `parseTranscriptionResponse` to handle custom response shapes.

#### WebView Permission Bridging

For WebView environments where microphone access requires a native bridge:

```tsx
<AgnoChatInput
  onSend={handleSend}
  showAudioRecorder={true}
  onRequestPermission={async () => {
    // Ask the native app for mic permission before getUserMedia
    return await NativeBridge.requestMicPermission();
  }}
/>
```

The `onRequestPermission` callback is called before the browser's `getUserMedia`. Return `true` to proceed or `false` to cancel.

---

### Primitive Components

Thin wrappers over Radix UI primitives with Tailwind styling via `class-variance-authority`:

| Component | Description |
|-----------|-------------|
| `Button` | Button with variants (`default`, `outline`, `ghost`, `destructive`, etc.) |
| `Badge` | Status badge with variants |
| `Avatar`, `AvatarImage`, `AvatarFallback` | User/assistant avatar |
| `InputGroup`, `InputGroupAddon`, `InputGroupButton`, `InputGroupInput`, `InputGroupTextarea` | Composable input groups |
| `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` | Expandable sections |
| `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider` | Hover tooltips |
| `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent` | Collapsible accordion |
| `DropdownMenu` + sub-parts | Dropdown menu |
| `HoverCard`, `HoverCardTrigger`, `HoverCardContent` | Hover card |
| `Select` + sub-parts | Select dropdown |
| `Command`, `CommandInput`, `CommandList`, `CommandItem`, ... | Command palette (cmdk) |

---

### Base Components

Higher-level components for building chat interfaces:

| Component | Description |
|-----------|-------------|
| `Message`, `MessageContent`, `MessageAvatar` | Low-level message layout shell |
| `Conversation`, `ConversationContent`, `ConversationEmptyState`, `ConversationScrollButton` | Scrollable conversation container with auto-scroll |
| `Response` | Markdown renderer with syntax highlighting (shiki + streamdown) |
| `Tool`, `ToolHeader`, `ToolContent`, `ToolInput`, `ToolOutput` | Collapsible tool call display |
| `CodeBlock`, `CodeBlockCopyButton` | Syntax-highlighted code block with copy button |
| `Artifact`, `ArtifactHeader`, `ArtifactContent`, ... | Artifact panel layout |
| `StreamingIndicator` | Animated typing/loading indicator |
| `AudioRecorder` | Audio recording with WAV encoding via AudioWorklet |
| `PromptInput` + sub-parts | Fully composable input system with attachments, speech, model select |

---

## Complete Example

```tsx
import { useState, useEffect } from 'react';
import {
  AgnoProvider,
  useAgnoChat,
  useAgnoSession,
  useAgnoActions,
} from '@rodrigocoliveira/agno-react';

function App() {
  return (
    <AgnoProvider
      config={{
        endpoint: 'http://localhost:7777',
        mode: 'agent',
        agentId: 'my-agent',
      }}
    >
      <ChatApp />
    </AgnoProvider>
  );
}

function ChatApp() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, isStreaming, error, clearMessages } = useAgnoChat();
  const { sessions, loadSession, fetchSessions } = useAgnoSession();
  const { initialize, state } = useAgnoActions();

  useEffect(() => {
    initialize().then(() => fetchSessions());
  }, [initialize, fetchSessions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    await sendMessage(input);
    setInput('');
  };

  return (
    <div>
      <aside>
        <h2>Sessions</h2>
        <button onClick={() => clearMessages()}>New Chat</button>
        <ul>
          {sessions.map((session) => (
            <li key={session.session_id}>
              <button onClick={() => loadSession(session.session_id)}>
                {session.session_name}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <main>
        <div className="messages">
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.role}`}>
              <strong>{msg.role}:</strong>
              <p>{msg.content}</p>
              {msg.tool_calls && (
                <details>
                  <summary>Tool Calls</summary>
                  <pre>{JSON.stringify(msg.tool_calls, null, 2)}</pre>
                </details>
              )}
            </div>
          ))}
          {error && <div className="error">Error: {error}</div>}
        </div>

        <form onSubmit={handleSubmit}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={isStreaming}
          />
          <button type="submit" disabled={isStreaming}>
            {isStreaming ? 'Sending...' : 'Send'}
          </button>
        </form>
      </main>
    </div>
  );
}

export default App;
```

## TypeScript

All hooks and components are fully typed. Import types as needed:

```typescript
import type {
  AgnoClientConfig,
  ChatMessage,
  SessionEntry,
  AgentDetails,
  TeamDetails,
} from '@rodrigocoliveira/agno-react';
```

## Publishing

To publish this package to npm:

```bash
# Login to npm (first time only)
npm login

# Build the package
bun run build

# Publish (use --access public for scoped packages)
npm publish --access public
```

**Publish order:** This package depends on both `@rodrigocoliveira/agno-types` and `@rodrigocoliveira/agno-client`, so publish them first:
1. `@rodrigocoliveira/agno-types`
2. `@rodrigocoliveira/agno-client`
3. `@rodrigocoliveira/agno-react` (this package)

## License

MIT
