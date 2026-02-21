# Generative UI Design Document for Agno Client

> **Status:** Implementation Ready
> **Author:** Claude + Human collaboration
> **Date:** 2026-01-26

---

## Table of Contents

1. [Goal](#goal)
2. [How Agno HITL Works](#how-agno-hitl-works)
3. [The Problem](#the-problem)
4. [The Solution](#the-solution)
5. [Architecture](#architecture)
6. [Implementation Details](#implementation-details)
7. [Usage Examples](#usage-examples)
8. [File Changes Summary](#file-changes-summary)
9. [Verification & Testing](#verification--testing)

---

## Goal

Create a **plug-and-play Generative UI system** where:

1. **Easy component registration** - Register custom React components with minimal boilerplate
2. **Handler-based rendering** - Tool handlers decide what UI to render from `tool_args`
3. **Automatic wiring** - The library handles intent flow back to the agent
4. **Reusable across projects** - Same pattern works for any React + Agno project

---

## How Agno HITL Works

The Agno framework uses **Human-in-the-Loop (HITL)** via tools with `external_execution=True`.

### The Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AGNO HITL FLOW                                       │
└─────────────────────────────────────────────────────────────────────────────┘

  1. PYTHON BACKEND
  ──────────────────

  from agno.tools import tool

  @tool(external_execution=True)
  def show_products(products: list[dict], category: str) -> dict:
      """Display products for user to select."""
      pass  # This function body is NOT executed on backend
            # The tool_args are sent to the frontend instead


  2. AGENT CALLS THE TOOL
  ────────────────────────

  class ShopAgent(Agent):
      tools = [show_products]

      def run(self, message: str):
          products = self.search_products(message)

          # This call PAUSES the run and sends tool_args to frontend
          result = show_products(
              products=products,
              category="electronics"
          )

          # Execution continues here AFTER frontend returns a result
          return RunResponse(content=f"You selected: {result['selected']}")


  3. BACKEND EMITS RunPaused EVENT
  ─────────────────────────────────

  {
    "event": "RunPaused",
    "run_id": "run-abc123",
    "tools_awaiting_external_execution": [
      {
        "tool_call_id": "call-xyz789",
        "tool_name": "show_products",
        "tool_args": {
          "products": [
            {"id": "1", "name": "Headphones", "price": 99.99},
            {"id": "2", "name": "Keyboard", "price": 149.99}
          ],
          "category": "electronics"
        }
      }
    ]
  }


  4. FRONTEND RECEIVES & RENDERS UI
  ──────────────────────────────────

  // Tool handler decides what to render
  useAgnoToolExecution({
    show_products: async (args) => {
      // args = { products: [...], category: "electronics" }

      // Return data for agent + UI spec for rendering
      return {
        data: { selected: null },  // Will be updated by user interaction
        ui: {
          type: 'custom',
          component: 'ProductGrid',  // Registered React component
          props: {
            products: args.products,
            category: args.category
          }
        }
      };
    }
  });


  5. USER INTERACTS WITH UI
  ──────────────────────────

  ProductGrid component renders
       │
       ▼
  User clicks "Select" on a product
       │
       ▼
  Component calls: onIntent('select', { productId: '1' })
       │
       ▼
  Intent triggers continueRun() with result


  6. FRONTEND SENDS RESULT BACK
  ──────────────────────────────

  POST /agents/{agent_id}/runs/{run_id}/continue
  Body: {
    "tools": [{
      "tool_call_id": "call-xyz789",
      "result": "{\"intent\":\"select\",\"data\":{\"productId\":\"1\"}}"
    }]
  }


  7. AGENT CONTINUES PROCESSING
  ──────────────────────────────

  # Back in the agent's run() method:
  result = show_products(...)  # Now returns: {"intent": "select", "data": {"productId": "1"}}

  if result["intent"] == "select":
      product_id = result["data"]["productId"]
      # Continue with the user's selection...
```

### Key Points

1. **tool_args is the only data channel** - UI specs don't come from the backend
2. **Tool handlers decide rendering** - Frontend handler interprets tool_args and returns UI
3. **continueRun() sends results** - User interactions flow back via the HITL mechanism
4. **Run pauses until frontend responds** - The agent waits for user input

---

## The Problem

### Current State

The library has `useAgnoToolExecution` which works well, but:

1. **Custom components use runtime keys**:
   ```typescript
   // Current: renderKey is generated at runtime
   ui: {
     type: 'custom',
     render: () => <ProductGrid {...props} />  // Function stored in memory
   }
   ```
   - Not reusable across tools
   - Function references can't be serialized
   - Components defined inline in handlers

2. **No standard registration pattern**:
   ```typescript
   // Each project invents its own pattern
   // Some use direct render functions
   // Some register components manually
   // No consistency
   ```

3. **Intent handling is manual**:
   ```typescript
   // How do intents flow back? Each project figures it out differently
   // No standard onIntent callback
   // No automatic continueRun() integration
   ```

---

## The Solution

### Named Custom Components

Register components once, reference them by name in handlers:

```typescript
// 1. Register components at app startup
<AgnoProvider
  config={{ endpoint: 'http://localhost:7777', agentId: 'shop-agent' }}
  components={{
    ProductGrid,
    ProductCard,
    ShoppingCart,
    CheckoutForm,
  }}
>
  <App />
</AgnoProvider>

// 2. Reference by name in tool handlers
useAgnoToolExecution({
  show_products: (args) => ({
    data: args,
    ui: {
      type: 'custom',
      component: 'ProductGrid',  // Looked up from registry
      props: args
    }
  })
});

// 3. Component receives onIntent automatically
function ProductGrid({ products, onIntent }) {
  return (
    <div>
      {products.map(p => (
        <button key={p.id} onClick={() => onIntent('select', { productId: p.id })}>
          {p.name} - ${p.price}
        </button>
      ))}
    </div>
  );
}
```

### What Changes

| Before | After |
|--------|-------|
| `render: () => <Component />` | `component: 'ComponentName'` |
| Functions in handlers | Names referencing registry |
| Manual intent handling | `onIntent` injected automatically |
| No standard pattern | `AgnoProvider` + `registerComponent()` |

---

## Architecture

### Component Registration Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       COMPONENT REGISTRATION                                 │
└─────────────────────────────────────────────────────────────────────────────┘

  App Startup
       │
       ▼
  <AgnoProvider components={{ ProductGrid, ShoppingCart, ... }}>
       │
       ▼
  registerComponents() called internally
       │
       ▼
  ┌─────────────────────────────────────────┐
  │         Component Registry              │
  │  ─────────────────────────────────────  │
  │  "custom:ProductGrid"   ──► ProductGrid │
  │  "custom:ShoppingCart"  ──► ShoppingCart│
  │  "custom:CheckoutForm"  ──► CheckoutForm│
  │  "chart:BarChart"       ──► BarChart    │
  └─────────────────────────────────────────┘
```

### Rendering Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         RENDERING FLOW                                       │
└─────────────────────────────────────────────────────────────────────────────┘

  Tool handler returns UI spec
       │
       ▼
  { type: 'custom', component: 'ProductGrid', props: {...} }
       │
       ▼
  useAgnoToolExecution processes result
       │
       ▼
  Extracts ui_component from result
       │
       ▼
  Adds to message for rendering
       │
       ▼
  GenerativeUIRenderer receives spec
       │
       ├── spec.type === 'custom' && spec.component?
       │         │
       │         ▼
       │    Registry lookup: "custom:ProductGrid"
       │         │
       │         ▼
       │    Found! Render with injected onIntent
       │         │
       │         ▼
       │    <ProductGrid {...props} onIntent={handleIntent} />
       │
       └── spec.renderKey? (legacy)
                 │
                 ▼
            Use runtime registry (existing behavior)
```

### Intent Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          INTENT FLOW                                         │
└─────────────────────────────────────────────────────────────────────────────┘

  User clicks button in ProductGrid
       │
       ▼
  Component calls: onIntent('select', { productId: '1' })
       │
       ▼
  GenerativeUIRenderer's handleIntent is called
       │
       ▼
  Creates UIIntent object:
  {
    specId: "spec-123",
    toolCallId: "call-xyz789",
    name: "select",
    payload: { productId: "1" },
    timestamp: 1706000000000
  }
       │
       ▼
  onIntent callback passed to GenerativeUIRenderer
       │
       ▼
  Parent component (Chat) uses useUIIntent hook
       │
       ▼
  emitIntent() checks: Is run paused with this toolCallId?
       │
       ├── YES: client.continueRun([{ tool_call_id, result }])
       │              │
       │              ▼
       │         POST /agents/{id}/runs/{runId}/continue
       │              │
       │              ▼
       │         Agent receives result and continues
       │
       └── NO: (This shouldn't happen in HITL flow)
```

---

## Implementation Details

### Phase 1: Update Type System

**File:** `packages/types/src/ui.ts`

```typescript
/**
 * Custom component specification
 */
export interface CustomComponentSpec extends BaseUIComponentSpec {
  type: 'custom';

  /**
   * Named component to render (NEW - preferred)
   * Must be registered via registerComponent() or AgnoProvider's components prop
   *
   * @example
   * { type: 'custom', component: 'ProductGrid', props: {...} }
   */
  component?: string;

  /**
   * Runtime render key (LEGACY - for backward compatibility)
   * Generated by registerCustomRender() when using inline render functions
   */
  renderKey?: string;

  /**
   * Props passed to the component
   */
  props?: Record<string, any>;

  /**
   * Unique ID for this UI instance (for intent tracking)
   */
  id?: string;
}

/**
 * Props injected into custom components by GenerativeUIRenderer
 */
export interface CustomComponentProps {
  /**
   * Callback to emit an intent back to the agent
   */
  onIntent?: (name: string, payload: Record<string, any>) => void;

  /**
   * Associated tool call ID (for HITL flows)
   */
  toolCallId?: string;

  /**
   * UI spec ID
   */
  specId?: string;

  /**
   * Any additional props from the UI spec
   */
  [key: string]: any;
}

/**
 * Intent emitted by a UI component
 */
export interface UIIntent {
  specId?: string;
  toolCallId?: string;
  name: string;
  payload: Record<string, any>;
  timestamp: number;
}
```

### Phase 2: Registration Helpers

**File:** `packages/react/src/utils/component-registry.ts`

```typescript
/**
 * Register a custom component by name
 */
export function registerComponent(name: string, renderer: ComponentRenderer): void {
  getComponentRegistry().register(`custom:${name}`, renderer);
}

/**
 * Register multiple custom components at once
 */
export function registerComponents(components: Record<string, ComponentRenderer>): void {
  const registry = getComponentRegistry();
  Object.entries(components).forEach(([name, renderer]) => {
    registry.register(`custom:${name}`, renderer);
  });
}

/**
 * Check if a custom component is registered
 */
export function hasCustomComponent(name: string): boolean {
  return getComponentRegistry().has(`custom:${name}`);
}
```

### Phase 3: AgnoProvider Enhancement

**File:** `packages/react/src/context/AgnoContext.tsx`

```typescript
export interface AgnoProviderProps {
  config: AgnoClientConfig;
  children: React.ReactNode;

  /**
   * Custom components to register for Generative UI
   */
  components?: Record<string, ComponentRenderer>;
}

export function AgnoProvider({ config, children, components }: AgnoProviderProps) {
  const client = useMemo(() => new AgnoClient(config), []);

  // Register custom components on mount
  useEffect(() => {
    if (components) {
      registerComponents(components);
    }
  }, [components]);

  // ... rest unchanged
}
```

### Phase 4: GenerativeUIRenderer Update

**File:** `packages/react/src/components/GenerativeUIRenderer.tsx`

```typescript
export interface GenerativeUIRendererProps {
  spec: UIComponentSpec;
  className?: string;
  onError?: (error: Error) => void;
  toolCallId?: string;
  onIntent?: (intent: UIIntent) => void;
}

export function GenerativeUIRenderer({
  spec,
  className,
  onError,
  toolCallId,
  onIntent,
}: GenerativeUIRendererProps): React.ReactElement {
  const registry = getComponentRegistry();

  if (spec.type === 'custom') {
    const customSpec = spec as CustomComponentSpec;

    // Create intent handler
    const handleIntent = (intentName: string, payload: Record<string, any>) => {
      onIntent?.({
        specId: customSpec.id,
        toolCallId,
        name: intentName,
        payload,
        timestamp: Date.now(),
      });
    };

    // Named component lookup (NEW)
    if (customSpec.component) {
      const registryKey = `custom:${customSpec.component}`;

      if (registry.has(registryKey)) {
        const CustomRenderer = registry.get(registryKey)!;
        return (
          <UIErrorBoundary onError={onError}>
            <div className={className}>
              <CustomRenderer
                {...customSpec.props}
                onIntent={handleIntent}
                toolCallId={toolCallId}
                specId={customSpec.id}
              />
            </div>
          </UIErrorBoundary>
        );
      }

      // Component not registered - show error
      return (
        <div className="p-4 border border-yellow-300 rounded-md bg-yellow-50">
          <p className="font-semibold">Component not registered: "{customSpec.component}"</p>
          <p className="text-sm mt-1">
            Add it to AgnoProvider: components={`{{ ${customSpec.component} }}`}
          </p>
        </div>
      );
    }

    // Legacy renderKey support (existing behavior)
    if (customSpec.renderKey) {
      const renderFn = getCustomRender(customSpec.renderKey);
      if (renderFn) {
        return (
          <UIErrorBoundary onError={onError}>
            <div className={className}>{renderFn(customSpec.props || {})}</div>
          </UIErrorBoundary>
        );
      }
    }

    // Fallback
    return (
      <div className="p-4 border border-yellow-300 rounded-md bg-yellow-50">
        <p>Custom component not available</p>
      </div>
    );
  }

  // ... rest unchanged (chart, table, etc.)
}
```

### Phase 5: Intent Hook

**New File:** `packages/react/src/hooks/useUIIntent.ts`

```typescript
export function useUIIntent() {
  const client = useAgnoClient();

  const emitIntent = useCallback(async (intent: UIIntent) => {
    const state = client.getState();

    // For HITL flows, continue the paused run
    if (intent.toolCallId && state.isPaused) {
      await client.continueRun([{
        tool_call_id: intent.toolCallId,
        tool_name: 'ui_intent',
        tool_args: {},
        result: JSON.stringify({
          intent: intent.name,
          data: intent.payload,
        }),
        role: 'tool',
        content: null,
        tool_call_error: false,
        metrics: {},
        created_at: Date.now(),
      }]);
    }
  }, [client]);

  return { emitIntent };
}
```

### Phase 6: Exports

**File:** `packages/react/src/index.ts`

```typescript
// Add exports
export { registerComponent, registerComponents, hasCustomComponent } from './utils/component-registry';
export { useUIIntent } from './hooks/useUIIntent';
export type { CustomComponentProps, UIIntent } from '@rodrigocoliveira/agno-types';
```

---

## Usage Examples

### 1. App Setup

```tsx
// App.tsx
import { AgnoProvider } from '@rodrigocoliveira/agno-react';
import { ProductGrid } from './components/ProductGrid';
import { ShoppingCart } from './components/ShoppingCart';
import { Chat } from './Chat';

function App() {
  return (
    <AgnoProvider
      config={{
        endpoint: 'http://localhost:7777',
        mode: 'agent',
        agentId: 'shop-assistant',
      }}
      components={{
        ProductGrid,
        ShoppingCart,
      }}
    >
      <Chat />
    </AgnoProvider>
  );
}
```

### 2. Custom Component

```tsx
// components/ProductGrid.tsx
import type { CustomComponentProps } from '@rodrigocoliveira/agno-react';

interface Product {
  id: string;
  name: string;
  price: number;
}

interface ProductGridProps extends CustomComponentProps {
  products: Product[];
  category: string;
}

export function ProductGrid({ products, category, onIntent }: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <h2 className="col-span-2 font-bold">{category}</h2>

      {products.map((product) => (
        <div key={product.id} className="border rounded p-4">
          <h3>{product.name}</h3>
          <p>${product.price}</p>

          <button
            onClick={() => onIntent?.('select', { productId: product.id })}
            className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
          >
            Select
          </button>
        </div>
      ))}

      <button
        onClick={() => onIntent?.('cancel', {})}
        className="col-span-2 border px-4 py-2 rounded"
      >
        Cancel
      </button>
    </div>
  );
}
```

### 3. Tool Handler

```tsx
// Chat.tsx
import {
  useAgnoChat,
  useAgnoToolExecution,
  useUIIntent,
  GenerativeUIRenderer,
} from '@rodrigocoliveira/agno-react';

function Chat() {
  const { messages, isStreaming } = useAgnoChat();
  const { emitIntent } = useUIIntent();

  // Define tool handlers
  const { isPaused, pendingTools } = useAgnoToolExecution({
    show_products: (args) => ({
      data: { selected: null },
      ui: {
        type: 'custom',
        component: 'ProductGrid',
        props: args,
      },
    }),

    show_cart: (args) => ({
      data: args,
      ui: {
        type: 'custom',
        component: 'ShoppingCart',
        props: args,
      },
    }),
  });

  return (
    <div>
      {messages.map((message) => (
        <div key={message.id}>
          <p>{message.content}</p>

          {/* Render tool call UI */}
          {message.tool_calls?.map((toolCall) =>
            toolCall.ui_component ? (
              <GenerativeUIRenderer
                key={toolCall.tool_call_id}
                spec={toolCall.ui_component}
                toolCallId={toolCall.tool_call_id}
                onIntent={emitIntent}
              />
            ) : null
          )}
        </div>
      ))}

      {isPaused && <p>Waiting for your selection...</p>}
    </div>
  );
}
```

### 4. Python Backend

```python
# agent.py
from agno import Agent
from agno.tools import tool

@tool(external_execution=True)
def show_products(products: list[dict], category: str) -> dict:
    """
    Display products for user selection.

    The frontend will render a ProductGrid component with these products.
    User's selection will be returned as: {"intent": "select", "data": {"productId": "..."}}
    """
    pass


@tool(external_execution=True)
def show_cart(items: list[dict], total: float) -> dict:
    """
    Display shopping cart for checkout.

    The frontend will render a ShoppingCart component.
    User can proceed or modify: {"intent": "checkout" | "modify", "data": {...}}
    """
    pass


class ShopAgent(Agent):
    tools = [show_products, show_cart]

    def run(self, message: str):
        # Search for products
        products = self.search_products(message)

        # Show products to user (pauses here)
        result = show_products(products=products, category="electronics")

        if result.get("intent") == "select":
            product_id = result["data"]["productId"]
            self.add_to_cart(product_id)

            # Show cart
            cart = self.get_cart()
            cart_result = show_cart(items=cart["items"], total=cart["total"])

            if cart_result.get("intent") == "checkout":
                # Process checkout...
                pass

        elif result.get("intent") == "cancel":
            return RunResponse(content="No problem! Let me know if you need anything else.")
```

---

## File Changes Summary

| File | Type | Description |
|------|------|-------------|
| `packages/types/src/ui.ts` | Modify | Add `component` field, `CustomComponentProps`, `UIIntent` |
| `packages/types/src/index.ts` | Modify | Export new types |
| `packages/react/src/utils/component-registry.ts` | Modify | Add `registerComponent()`, `registerComponents()` |
| `packages/react/src/context/AgnoContext.tsx` | Modify | Add `components` prop |
| `packages/react/src/components/GenerativeUIRenderer.tsx` | Modify | Handle named components, add `onIntent` |
| `packages/react/src/hooks/useUIIntent.ts` | **NEW** | Intent emission hook |
| `packages/react/src/index.ts` | Modify | Export new functions and types |

---

## Verification & Testing

### 1. Build Test

```bash
bun run build  # All packages compile
```

### 2. Type Check

```bash
bun run typecheck  # No type errors
```

### 3. Integration Test

1. Create a test component:
```tsx
function TestSelector({ options, onIntent }) {
  return (
    <div>
      {options.map(opt => (
        <button key={opt} onClick={() => onIntent('select', { value: opt })}>
          {opt}
        </button>
      ))}
    </div>
  );
}
```

2. Register it:
```tsx
<AgnoProvider config={...} components={{ TestSelector }}>
```

3. Create handler:
```tsx
useAgnoToolExecution({
  select_option: (args) => ({
    data: { selected: null },
    ui: { type: 'custom', component: 'TestSelector', props: args }
  })
})
```

4. Python calls `select_option(options=['A', 'B', 'C'])`

5. Verify:
   - TestSelector renders with options
   - Clicking sends intent
   - Agent receives `{"intent": "select", "data": {"value": "A"}}`

---

## Future Considerations

Not in scope for this implementation:

1. **Bundled components** - Pre-built chart/table renderers
2. **Form builder** - Dynamic form rendering from schema
3. **Theme system** - Customizable component styling
4. **Auto-continue** - Automatic intent handling without manual `emitIntent`

---

*This design focuses on the handler-based pattern used by Agno's HITL mechanism.*
