# Composed Chat API Simplification Plan

## Problem Summary

The composed `AgnoChat` compound component has **redundant props at multiple layers**, making it confusing for users to know which props to set and where. The same prop can often be set in 3+ different places with unclear precedence.

---

## Issue 1: Prop Duplication Across Layers

The same props exist on multiple components, creating "which one do I use?" confusion:

| Prop | `AgnoChatInterface` | `AgnoChat.Messages` | `AgnoChat.Input` | `chatInputProps` | `messageItemProps` |
|---|---|---|---|---|---|
| `userAvatar` | yes | yes | — | — | yes (nested) |
| `assistantAvatar` | yes | yes | — | — | yes (nested) |
| `placeholder` | yes | — | yes | yes (nested) | — |
| `showAudioRecorder` | yes | — | yes | yes (nested) | — |
| `showAttachments` | yes | — | yes | yes (nested) | — |
| `fileUpload` | yes | — | yes | yes (nested) | — |
| `suggestedPrompts` | yes | yes | — | — | — |

**Example of the confusion** — setting `placeholder` today:
```tsx
// All 3 of these set the placeholder - which wins?
<AgnoChatInterface placeholder="Option A" />
<AgnoChat.Input placeholder="Option B" />
<AgnoChat.Input chatInputProps={{ placeholder: "Option C" }} />

// Actual precedence (from input.tsx line 77):
// placeholder ?? chatInputProps?.placeholder ?? 'Message your agent...'
```

---

## Issue 2: `chatInputProps` and `messageItemProps` Bags are Confusing

These "dump all sub-component props here" bags create **two ways to configure the same thing**:

```tsx
// Way 1: Direct prop
<AgnoChat.Input showAudioRecorder={true} />

// Way 2: Via chatInputProps bag
<AgnoChat.Input chatInputProps={{ showAudioRecorder: true }} />
```

Users must understand the internal component hierarchy (`AgnoChatInputProps`, `AgnoMessageItemProps`) to use these bags. This leaks implementation details.

---

## Issue 3: Audio Props Explosion (7 flat props)

Audio recording requires understanding and setting up to **7 separate props**:

```tsx
<AgnoChat.Input
  showAudioRecorder={true}           // 1
  audioMode="transcribe"             // 2
  transcriptionEndpoint="http://..."  // 3
  transcriptionHeaders={{ ... }}      // 4
  parseTranscriptionResponse={fn}     // 5
  onRequestPermission={fn}            // 6
  audioRecorderLabels={{ ... }}        // 7
/>
```

These are all related to one feature but spread flat across the component interface.

---

## Issue 4: `AgnoChatInterface` vs `AgnoChat` — Which to Use?

Users face a fork in the road:
- `AgnoChatInterface` — monolithic, 18+ props, internally just assembles `AgnoChat` compound pieces
- `AgnoChat` compound — flexible, but still has prop redundancy

`AgnoChatInterface` doesn't add meaningful value over the compound pattern. It's just a prop-forwarding wrapper (see `AgnoChatInterface.tsx` lines 55-113 — it just passes everything through).

---

## Issue 5: `classNames` Object vs Direct `className`

`AgnoChatInterface` uses `classNames: { root, messagesArea, inputArea, toolStatusBar, errorBar, dropZone }` which requires users to know the internal component tree. With the compound pattern, users just pass `className` directly to each sub-component — much more intuitive.

---

## Proposed Changes

### Change 1: Group Audio Props into a Config Object

**Before:**
```tsx
<AgnoChat.Input
  showAudioRecorder={true}
  audioMode="transcribe"
  transcriptionEndpoint="http://..."
  transcriptionHeaders={{ ... }}
  parseTranscriptionResponse={fn}
  onRequestPermission={fn}
  audioRecorderLabels={{ ... }}
/>
```

**After:**
```tsx
<AgnoChat.Input
  audio={{
    enabled: true,
    mode: 'transcribe',
    endpoint: "http://...",
    headers: { ... },
    parseResponse: fn,
    requestPermission: fn,
    labels: { ... },
  }}
/>
```

- Single `audio?: AudioConfig | boolean` prop (pass `true` for send-mode defaults)
- All audio concerns in one place
- `boolean` shorthand: `audio={true}` = enabled with send mode

**Files to change:**
- `packages/react/src/ui/types.ts` — add `AudioConfig` type
- `packages/react/src/ui/composed/AgnoChatInput.tsx` — accept `audio` prop, deprecate old flat props
- `packages/react/src/ui/composed/agno-chat/input.tsx` — accept `audio` prop, deprecate old flat props
- `packages/react/src/ui/composed/AgnoChatInterface.tsx` — accept `audio` prop

### Change 2: Remove `chatInputProps` and `messageItemProps` Bags

These bags exist because the compound sub-components don't expose all the props users might need. The fix is:

**For `AgnoChat.Input`:**
- Remove `chatInputProps` bag entirely
- All commonly needed `AgnoChatInput` props are already directly on `AgnoChatInputAreaProps` — keep those
- For edge cases, users can use the render-prop children pattern

**For `AgnoChat.Messages`:**
- Remove `messageItemProps` bag
- Promote the most commonly used message customizations to direct props on `AgnoChat.Messages`:
  - `showReasoning?: boolean`
  - `showToolCalls?: boolean`
  - `showReferences?: boolean`
  - `showTimestamp?: boolean`
  - `showGenerativeUI?: boolean`
  - `renderActions?: (message: ChatMessage) => ReactNode`
  - `renderToolCall?: (tool: ToolCall, index: number) => ReactNode`
- For deeper customization, users use `renderMessage`

**Before:**
```tsx
<AgnoChat.Messages
  messageItemProps={{
    classNames: { assistantContainer: 'pl-3' },
    showToolCalls: false,
    showReasoning: false,
    renderActions: (msg) => <CopyButton />,
  }}
/>
```

**After:**
```tsx
<AgnoChat.Messages
  showToolCalls={false}
  showReasoning={false}
  renderActions={(msg) => <CopyButton />}
/>
```

**Files to change:**
- `packages/react/src/ui/composed/agno-chat/messages.tsx` — promote common props, remove `messageItemProps`
- `packages/react/src/ui/composed/agno-chat/input.tsx` — remove `chatInputProps`

### Change 3: Move Avatars to `AgnoChat` Root Context

Instead of drilling avatars through every layer, put them in context:

**Before (avatars drilled through 3 layers):**
```tsx
<AgnoChat>
  <AgnoChat.Messages
    userAvatar={<UserIcon />}
    assistantAvatar={<BotIcon />}
  />
</AgnoChat>
```

**After (avatars set once at root):**
```tsx
<AgnoChat
  avatars={{ user: <UserIcon />, assistant: <BotIcon /> }}
>
  <AgnoChat.Messages />
</AgnoChat>
```

- Add `avatars?: { user?: ReactNode; assistant?: ReactNode }` to `AgnoChatRootProps`
- Store in `AgnoChatContext`
- Sub-components read from context, with local props as override
- Keeps backward compatibility: `AgnoChat.Messages` still accepts `userAvatar`/`assistantAvatar` as overrides

**Files to change:**
- `packages/react/src/ui/composed/agno-chat/context.ts` — add avatars to context
- `packages/react/src/ui/composed/agno-chat/agno-chat.tsx` — accept `avatars` prop
- `packages/react/src/ui/composed/agno-chat/messages.tsx` — read from context, allow local override

### Change 4: Deprecate `AgnoChatInterface`

Mark `AgnoChatInterface` as `@deprecated` with a migration note pointing to `AgnoChat`. It doesn't add value over the compound pattern — it's just a prop-forwarding wrapper that creates another layer of confusion.

Users who want a one-liner can use `AgnoChat` with sensible defaults:
```tsx
// Zero config — works out of the box
<AgnoChat>
  <AgnoChat.Messages />
  <AgnoChat.Input />
</AgnoChat>
```

**Files to change:**
- `packages/react/src/ui/composed/AgnoChatInterface.tsx` — add `@deprecated` JSDoc

### Change 5: Group File Upload into Simpler Prop Name

Minor ergonomic improvement:

**Before:**
```tsx
<AgnoChat.Input fileUpload={{ accept: 'image/*', maxFiles: 5 }} />
```

**After (alias):**
```tsx
<AgnoChat.Input files={{ accept: 'image/*', maxFiles: 5 }} />
```

Keep `fileUpload` as deprecated alias for backward compatibility.

---

## Final API Shape After Changes

### Basic (zero config):
```tsx
<AgnoChat>
  <AgnoChat.Messages />
  <AgnoChat.Input />
</AgnoChat>
```

### Customized:
```tsx
<AgnoChat
  toolHandlers={handlers}
  avatars={{ user: <UserIcon />, assistant: <BotIcon /> }}
>
  <AgnoChat.Messages
    suggestedPrompts={prompts}
    showReasoning={false}
    showToolCalls={false}
    renderActions={(msg) => <ActionBar message={msg} />}
  >
    <AgnoChat.EmptyState>
      <MyCustomEmptyState />
    </AgnoChat.EmptyState>
  </AgnoChat.Messages>

  <AgnoChat.ToolStatus />
  <AgnoChat.ErrorBar />

  <AgnoChat.Input
    placeholder="Ask me anything..."
    files={{ accept: 'image/*', maxFiles: 5 }}
    audio={{ enabled: true, mode: 'transcribe', endpoint: '...' }}
  />
</AgnoChat>
```

### Full custom (render props):
```tsx
<AgnoChat toolHandlers={handlers}>
  <AgnoChat.Messages renderMessage={(msg, i) => <MyMessage key={i} message={msg} />} />
  <AgnoChat.Input>
    {({ onSend, disabled }) => <MyInput onSend={onSend} disabled={disabled} />}
  </AgnoChat.Input>
</AgnoChat>
```

---

## Migration / Backward Compatibility Strategy

1. **Keep old props** but mark them `@deprecated` in JSDoc — TypeScript will show strikethrough
2. **Runtime**: old props still work, new props take precedence
3. **Console warnings**: optionally log `console.warn` in dev mode when deprecated props are used
4. **Remove deprecated props** in next major version

---

## Implementation Order

1. Add `AudioConfig` type and `audio` prop to input components
2. Add `avatars` to `AgnoChat` root context
3. Promote `messageItemProps` fields to direct `AgnoChat.Messages` props
4. Remove `chatInputProps` and `messageItemProps` bags (with deprecation)
5. Deprecate `AgnoChatInterface`
6. Update example pages to use the simplified API
7. Build and verify
