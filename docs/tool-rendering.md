# Tool Rendering

How to control how tool calls show up in the chat UI in `@rodrigocoliveira/agno-react`.

## TL;DR

One function, one prop:

```tsx
<AgnoChat
  debug={true /* or false in prod */}
  renderTool={(tool, { defaultRender, isDebug }) => {
    if (tool.tool_name === 'internal') return null;
    if (tool.tool_name === 'search_flights')
      return <FlightResults tool={tool} />;
    return defaultRender();
  }}
>
  <AgnoChat.Messages />
</AgnoChat>
```

`renderTool` runs for every tool call. Return `null` to hide, return `defaultRender()` to fall through to the library default, or return your own JSX.

## The default

If you don't pass `renderTool`, the library calls `defaultRender()` for every tool call. `defaultRender()` returns:

- `<ToolDebugCard tool={tool} />` — when `debug={true}` (developer-facing card with input + output).
- `null` — when `debug={false}` (production builds): tool calls render nothing by default.

There is no implicit "generative UI" auto-render. If your tool returns a chart spec via `tool.ui_component`, you decide where and how to render it inside your `renderTool` — see [Rendering generative UI](#rendering-generative-ui) below.

## The `debug` prop

`<AgnoChat debug>` controls whether `defaultRender()` includes the debug card.

- **Default**: auto-detected via `process.env.NODE_ENV !== 'production'` (on in dev builds, off in prod builds).
- **`debug={true}`**: forces the debug card on — useful to investigate bugs in production without changing the environment.
- **`debug={false}`**: hides the debug card even in dev — useful to preview the production experience.

Read it inside `renderTool` via `args.isDebug`:

```tsx
renderTool={(tool, { isDebug, defaultRender }) =>
  isDebug ? defaultRender() : <MyProdRender tool={tool} />
}
```

## Dispatch by tool name: `byToolName`

For the common case of "this tool renders like this, that tool like that", use the `byToolName` helper:

```tsx
import { byToolName } from '@rodrigocoliveira/agno-react';

<AgnoChat
  renderTool={byToolName({
    internal_log: false,                                     // hide
    search_flights: (tool) => <FlightResults tool={tool} />, // custom
    get_weather: (tool, { defaultRender }) => (              // hybrid
      <>{defaultRender()}<WeatherCard data={tool.result} /></>
    ),
  })}
>
  <AgnoChat.Messages />
</AgnoChat>
```

Unlisted tools fall through to `defaultRender()`. Pass a second argument to `byToolName` to set a different fallback.

## Building blocks

`<ToolDebugCard>` is exported so you can compose it yourself:

```tsx
import { ToolDebugCard } from '@rodrigocoliveira/agno-react';

renderTool={(tool) => (
  <div className="rounded-xl border p-3">
    <h4>{tool.tool_name}</h4>
    <ToolDebugCard tool={tool} />
  </div>
)}
```

## Rendering generative UI

A tool handler that returns `{ data, ui }` (via helpers like `createBarChart` / `resultWithBarChart`) puts the UI spec on `tool.ui_component`. The library doesn't render that field for you — you dispatch it inside `renderTool` onto whichever components you want to use. The library ships plain `BarChart`, `LineChart`, `AreaChart`, `PieChart`, and `CardGrid` components for the common cases.

```tsx
import { AgnoChat, BarChart, LineChart, AreaChart, PieChart, CardGrid } from '@rodrigocoliveira/agno-react/ui';
import { byToolName, type RenderTool } from '@rodrigocoliveira/agno-react';
import type { ToolCall } from '@rodrigocoliveira/agno-types';

function renderUI(tool: ToolCall) {
  const ui = (tool as any).ui_component;
  if (!ui) return null;
  let body;
  switch (ui.component ?? ui.type) {
    case 'BarChart':  body = <BarChart {...ui.props} />; break;
    case 'LineChart': body = <LineChart {...ui.props} />; break;
    case 'AreaChart': body = <AreaChart {...ui.props} />; break;
    case 'PieChart':  body = <PieChart {...ui.props} />; break;
    case 'card-grid': body = <CardGrid {...ui.props} />; break;
    default: return null;
  }
  return (
    <div className="w-full">
      {ui.title && <h3 className="font-semibold mb-2">{ui.title}</h3>}
      {ui.description && <p className="text-sm text-muted-foreground mb-4">{ui.description}</p>}
      {body}
    </div>
  );
}

const renderTool: RenderTool = byToolName({
  render_revenue_chart: renderUI,
  show_product_grid:    renderUI,
});

<AgnoChat renderTool={renderTool} />
```

The chart components require `recharts` as a peer dependency (`^2.0.0 || ^3.0.0`). If you need custom chart layouts, the underlying shadcn-style primitives are also exported: `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, `ChartLegendContent`, `ChartStyle`.

## Four common patterns

### 1. Debug everything in dev, nothing in prod (no code)

```tsx
<AgnoChat>{/* debug auto-detected from NODE_ENV */}
  <AgnoChat.Messages />
</AgnoChat>
```

### 2. Hide specific tools

```tsx
<AgnoChat
  renderTool={byToolName({
    internal_log: false,
    fetch_secret: false,
  })}
/>
```

### 3. Custom widget per tool, no debug card

```tsx
<AgnoChat
  debug={false}
  renderTool={byToolName({
    search_flights: (tool) => <FlightResults tool={tool} />,
    get_weather: (tool) => <WeatherCard tool={tool} />,
  })}
/>
```

### 4. Debug card + custom widget side by side

```tsx
<AgnoChat
  renderTool={byToolName({
    search_flights: (tool, { defaultRender }) => (
      <>
        {defaultRender()}
        <FlightResults tool={tool} />
      </>
    ),
  })}
/>
```

## HITL sessions: `skipToolsOnSessionLoad`

If a tool was a Human-in-the-Loop interaction and its result is already on the message (from a previous run), you don't want its handler to re-execute when the session loads — re-invoking it would replay side effects (open a modal, navigate, fire a mutation). Pass the tool names to `skipToolsOnSessionLoad` and the library will render the stored result from history instead:

```tsx
<AgnoChat
  toolHandlers={{ ask_user_question: askHandler }}
  skipToolsOnSessionLoad={['ask_user_question']}
  renderTool={byToolName({
    ask_user_question: (tool) => (
      <AnswerBubble answer={tool.result as string} />
    ),
  })}
/>
```

## Slot composition: `<AgnoMessage>`

Tool calls are one block inside the assistant message bubble, but the bubble itself has six blocks: reasoning, media, tools, content, references, footer. In v2.0 you can reorder them via `<AgnoMessage>` compound components.

Default order (v2.0): **Reasoning → Media → Tools → Content → References → Footer**. This puts the "work" (tool outputs, generated images) above the agent's textual response, which matches how most apps want it.

```tsx
import { AgnoMessage } from '@rodrigocoliveira/agno-react';

<AgnoChat.Messages
  renderMessage={(message) => (
    <AgnoMessage message={message}>
      <AgnoMessage.Content />          {/* text first */}
      <AgnoMessage.Tools />
      <AgnoMessage.Media />
      <AgnoMessage.References />
      <AgnoMessage.Footer />
    </AgnoMessage>
  )}
/>
```

Rules:
- **Omit a slot to hide it** — `<AgnoMessage>` without `<AgnoMessage.Reasoning />` is equivalent to `showReasoning={false}` in v1.x.
- **Order is yours** — slots render in the JSX order you wrote.
- **User messages have a fixed layout** — slots only apply to assistant messages. Children of `<AgnoMessage>` are ignored when `message.role === 'user'`.
- **State is shared** — image lightbox and file preview state lives in `<AgnoMessage>`, so reordering doesn't break the modals.
- **`renderMessage` is your entry point** — the prop on `<AgnoChat.Messages>` lets you wrap each message in your own composition.

Available slots:

| Slot | Renders |
| --- | --- |
| `<AgnoMessage.Reasoning />` | Reasoning steps accordion (`message.extra_data.reasoning_steps`) |
| `<AgnoMessage.Media />` | Images, videos, audio, files, response audio |
| `<AgnoMessage.Tools />` | Tool calls via `renderTool` pipeline. Accepts `renderTool` prop to override for this slot only. |
| `<AgnoMessage.Content />` | Markdown content (`message.content`) |
| `<AgnoMessage.References />` | Citation blocks (`message.extra_data.references`) |
| `<AgnoMessage.Footer showTimestamp={...} />` | Actions + timestamp + error indicator |

## Migrating from v1.x

| Old (v1.4)                                          | New (v2.0.1)                                                                  |
| --------------------------------------------------- | ----------------------------------------------------------------------------- |
| `showToolCalls={true}`                              | `<AgnoChat debug={true}>` (or rely on `NODE_ENV` auto-detect)                 |
| `showToolCalls={false}`                             | `<AgnoChat debug={false}>`                                                    |
| `showGenerativeUI={true}` (auto-render via registry) | Dispatch `tool.ui_component` yourself inside `renderTool` — see [Rendering generative UI](#rendering-generative-ui). |
| `showGenerativeUI={false}`                          | Default behavior in production. (No auto-render exists anymore.)              |
| `renderToolCall={(tool, idx) => X}`                 | `renderTool={(tool) => X}` (index is in the second arg if you need it)        |
| `toolResultRenderers={{ name: (args, content) => X }}` | `renderTool={byToolName({ name: (tool) => X })}` — `tool.tool_args`/`tool.result` give you the same data with more context |
| `<AgnoChat.Messages renderContent={...}>` | `renderMessage={(m) => <AgnoMessage message={m}>{/* your custom slots */}</AgnoMessage>}` |
| `<AgnoChat.Messages renderMedia={...}>` | Same — use `renderMessage` + slots; replace `<AgnoMessage.Media />` with your component |

## Migrating from v2.0.0

If you were on 2.0.0 and your tool used `tool.ui_component`, charts likely rendered as raw JSON (the registry singleton was duplicated across bundles — see CHANGELOG). To migrate:

1. Remove any call to `registerChartComponent` / `getComponentRegistry` / `registerGenerativeUIComponents`.
2. Replace `<GenerativeUIRenderer spec={uiSpec} />` and `<ToolGenerativeUI tool={tool} />` with explicit dispatch — see [Rendering generative UI](#rendering-generative-ui).
3. Import `BarChart` / `LineChart` / `AreaChart` / `PieChart` / `CardGrid` from `@rodrigocoliveira/agno-react/ui`.
4. Add `recharts` to your app (it's a peer dep now).
