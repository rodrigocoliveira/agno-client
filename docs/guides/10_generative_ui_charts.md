# 10. Generative UI: Charts

> **Prerequisites**: [08. Tool Execution Basics](./08_tool_execution_basics.md)
> **Packages**: `@rodrigocoliveira/agno-react`

## Overview

Generative UI allows tool handlers to return rich UI components instead of just data. This cookbook focuses on creating charts (bar, line, pie, area) that render directly in the chat interface.

## Chart Helper Functions

The library provides helper functions to create chart specifications:

```typescript
import {
  createBarChart,
  createLineChart,
  createPieChart,
  createAreaChart,
  createSmartChart,
  createToolResult,
  resultWithBarChart,
  resultWithSmartChart,
} from '@rodrigocoliveira/agno-react';
```

## ToolHandlerResult Format

Tool handlers can return:

1. **Plain data** - Just the result (backward compatible)
2. **ToolHandlerResult** - `{ data, ui }` with both data and UI spec
3. **UIComponentSpec** - Just a UI spec (data becomes the spec)

```typescript
// Format 1: Plain data
return { sales: 1000, growth: 5.2 };

// Format 2: Data + UI (recommended)
return {
  data: { sales: 1000, growth: 5.2 },
  ui: createBarChart(chartData, 'month', [{ key: 'sales' }]),
};

// Format 3: Just UI
return createBarChart(chartData, 'month', [{ key: 'sales' }]);
```

## Bar Charts

```tsx
import { useAgnoToolExecution, createBarChart, createToolResult } from '@rodrigocoliveira/agno-react';

function App() {
  const handlers = {
    show_sales_data: async (args) => {
      const data = [
        { month: 'Jan', sales: 4000, returns: 240 },
        { month: 'Feb', sales: 3000, returns: 139 },
        { month: 'Mar', sales: 2000, returns: 980 },
        { month: 'Apr', sales: 2780, returns: 390 },
        { month: 'May', sales: 1890, returns: 480 },
        { month: 'Jun', sales: 2390, returns: 380 },
      ];

      const chart = createBarChart(
        data,
        'month', // X-axis key
        [
          { key: 'sales', label: 'Sales', color: '#8884d8' },
          { key: 'returns', label: 'Returns', color: '#82ca9d' },
        ],
        {
          title: 'Monthly Sales Report',
          description: 'Sales and returns by month',
          showLegend: true,
          showGrid: true,
          height: 400,
        }
      );

      return createToolResult(data, chart);
    },
  };

  useAgnoToolExecution(handlers);
  return <Chat />;
}
```

## Line Charts

```tsx
import { useAgnoToolExecution, createLineChart, createToolResult } from '@rodrigocoliveira/agno-react';

function App() {
  const handlers = {
    show_trend_analysis: async (args) => {
      const data = [
        { date: '2024-01', users: 1000, sessions: 2400 },
        { date: '2024-02', users: 1500, sessions: 3600 },
        { date: '2024-03', users: 2000, sessions: 4800 },
        { date: '2024-04', users: 2500, sessions: 5200 },
        { date: '2024-05', users: 3200, sessions: 6100 },
      ];

      const chart = createLineChart(
        data,
        'date',
        [
          { key: 'users', label: 'Active Users', color: '#0088FE' },
          { key: 'sessions', label: 'Sessions', color: '#00C49F' },
        ],
        {
          title: 'User Growth Trend',
          layout: 'artifact', // Opens in modal/side panel
        }
      );

      return createToolResult(data, chart);
    },
  };

  useAgnoToolExecution(handlers);
  return <Chat />;
}
```

## Pie Charts

```tsx
import { useAgnoToolExecution, createPieChart, createToolResult } from '@rodrigocoliveira/agno-react';

function App() {
  const handlers = {
    show_market_share: async (args) => {
      const data = [
        { name: 'Chrome', value: 65 },
        { name: 'Safari', value: 19 },
        { name: 'Firefox', value: 8 },
        { name: 'Edge', value: 5 },
        { name: 'Other', value: 3 },
      ];

      const chart = createPieChart(
        data,
        'value',  // Data key
        'name',   // Name key
        {
          title: 'Browser Market Share',
          showLabel: true,
          showLegend: true,
          height: 400,
        }
      );

      return createToolResult(data, chart);
    },
  };

  useAgnoToolExecution(handlers);
  return <Chat />;
}
```

## Area Charts

```tsx
import { useAgnoToolExecution, createAreaChart, createToolResult } from '@rodrigocoliveira/agno-react';

function App() {
  const handlers = {
    show_revenue_breakdown: async (args) => {
      const data = [
        { month: 'Jan', product: 4000, services: 2400, support: 800 },
        { month: 'Feb', product: 3000, services: 1398, support: 900 },
        { month: 'Mar', product: 2000, services: 9800, support: 1200 },
        { month: 'Apr', product: 2780, services: 3908, support: 1100 },
        { month: 'May', product: 1890, services: 4800, support: 950 },
      ];

      const chart = createAreaChart(
        data,
        'month',
        [
          { key: 'product', label: 'Product Sales', color: '#8884d8' },
          { key: 'services', label: 'Services', color: '#82ca9d' },
          { key: 'support', label: 'Support', color: '#ffc658' },
        ],
        {
          title: 'Revenue Breakdown',
          showGrid: true,
        }
      );

      return createToolResult(data, chart);
    },
  };

  useAgnoToolExecution(handlers);
  return <Chat />;
}
```

## Smart Charts (Auto-Detection)

`createSmartChart` automatically chooses the best chart type based on data:

```tsx
import { useAgnoToolExecution, createSmartChart, resultWithSmartChart } from '@rodrigocoliveira/agno-react';

function App() {
  const handlers = {
    visualize_data: async (args) => {
      // Fetch or generate data
      const data = await fetchData(args.query);

      // Smart chart auto-detects best visualization
      // - Pie chart for single value with categories
      // - Line chart for time-series data
      // - Bar chart for comparisons
      return resultWithSmartChart(data, {
        title: `Results for: ${args.query}`,
      });
    },

    show_analytics: async (args) => {
      const data = [
        { category: 'A', count: 100 },
        { category: 'B', count: 200 },
        { category: 'C', count: 150 },
      ];

      // With preferredType, you can override auto-detection
      const chart = createSmartChart(data, {
        title: 'Category Distribution',
        preferredType: 'bar', // Force bar chart
      });

      return { data, ui: chart };
    },
  };

  useAgnoToolExecution(handlers);
  return <Chat />;
}
```

## Quick Helpers

Shorthand functions for common patterns:

```tsx
import {
  useAgnoToolExecution,
  resultWithBarChart,
  resultWithSmartChart,
} from '@rodrigocoliveira/agno-react';

function App() {
  const handlers = {
    quick_bar_chart: async (args) => {
      const data = await fetchSalesData();

      // One-liner for bar chart
      return resultWithBarChart(
        data,
        'month',
        [{ key: 'sales' }, { key: 'target' }],
        { title: 'Sales vs Target' }
      );
    },

    quick_smart_chart: async (args) => {
      const data = await fetchAnalytics(args.metric);

      // One-liner for smart chart
      return resultWithSmartChart(data, {
        title: args.metric,
        layout: 'artifact',
      });
    },
  };

  useAgnoToolExecution(handlers);
  return <Chat />;
}
```

## Chart Options Reference

```typescript
interface ChartHelperOptions {
  title?: string;        // Chart title
  description?: string;  // Description below title
  layout?: 'inline' | 'artifact'; // Display mode
  showLegend?: boolean;  // Show legend (default: true)
  showGrid?: boolean;    // Show grid lines (default: true)
  height?: number | string; // Chart height
  width?: number | string;  // Chart width
}
```

## Rendering Charts in Messages

> **2.0.1 update:** The previous registry-based auto-renderer (`GenerativeUIRenderer`, `ComponentRegistry`, `ToolGenerativeUI`) had a bundling bug and was removed. The library now ships plain React chart components, and you wire them up explicitly via the `renderTool` API.

Inside `<AgnoChat>` from `@rodrigocoliveira/agno-react/ui`, dispatch
`tool.ui_component` onto one of the chart components via `renderTool`:

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
  show_sales_data:       renderUI,
  show_trend_analysis:   renderUI,
  show_market_share:     renderUI,
  show_revenue_breakdown: renderUI,
});

<AgnoChat renderTool={renderTool} />
```

If you're rendering messages yourself with the hooks API (no `<AgnoChat>`), call
the same `renderUI` helper from wherever you walk `message.tool_calls`:

```tsx
import { BarChart, LineChart /* … */ } from '@rodrigocoliveira/agno-react/ui';
import type { ToolCall } from '@rodrigocoliveira/agno-types';

function ToolCallDisplay({ toolCall }: { toolCall: ToolCall }) {
  const ui = (toolCall as any).ui_component;
  const output = toolCall.result ?? toolCall.content;
  return (
    <div className="tool-result">
      {ui ? renderUI(toolCall) : null}
      {!ui && output ? <pre>{output as string}</pre> : null}
    </div>
  );
}
```

**Peer dependency:** the chart components require `recharts ^2.0.0 || ^3.0.0`. If you only use `CardGrid`, you don't need recharts. The underlying shadcn-style primitives (`ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, `ChartLegendContent`, `ChartStyle`) are also exported from `/ui` if you want to assemble custom chart layouts.

## Complete Example

```tsx
import { AgnoProvider, useAgnoToolExecution, byToolName, type RenderTool } from '@rodrigocoliveira/agno-react';
import { AgnoChat, BarChart, LineChart, AreaChart, PieChart, CardGrid } from '@rodrigocoliveira/agno-react/ui';
import { createBarChart, createLineChart, createToolResult } from '@rodrigocoliveira/agno-react';
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

function AnalyticsChat() {
  const toolHandlers = {
    get_revenue_chart: async (args: Record<string, any>) => {
      const data = await fetchRevenue(args.period);
      return createToolResult(
        data,
        createLineChart(data, 'date', [{ key: 'revenue', color: '#10b981' }], {
          title: `Revenue - ${args.period}`,
        })
      );
    },
    get_comparison_chart: async (args: Record<string, any>) => {
      const data = await fetchComparison(args.metrics);
      return createToolResult(
        data,
        createBarChart(data, 'category', args.metrics.map((m: string) => ({ key: m })), {
          title: 'Metric Comparison',
          showLegend: true,
        })
      );
    },
  };

  const renderTool: RenderTool = byToolName({
    get_revenue_chart:    renderUI,
    get_comparison_chart: renderUI,
  });

  return (
    <AgnoChat toolHandlers={toolHandlers} renderTool={renderTool}>
      <AgnoChat.Messages />
      <AgnoChat.Input />
    </AgnoChat>
  );
}

function App() {
  return (
    <AgnoProvider config={{ endpoint: 'http://localhost:7777', mode: 'agent', agentId: 'analytics-agent' }}>
      <AnalyticsChat />
    </AgnoProvider>
  );
}
```

## Key Points

- Use `createToolResult(data, ui)` (or `resultWithBarChart` / `resultWithSmartChart`) in tool handlers to package data + a UI spec.
- The library no longer auto-renders `tool.ui_component`; you dispatch it via `renderTool` onto the components you want.
- `BarChart`, `LineChart`, `AreaChart`, `PieChart`, `CardGrid` are exported from `@rodrigocoliveira/agno-react/ui` and accept the spec's `props` shape directly.
- `byToolName({ tool_name: handler })` is the easiest way to attach the same `renderUI` to several generative tools.
- `recharts` is an optional peer dep (`^2.0.0 || ^3.0.0`) — only required if you import the chart components.
- `createSmartChart` still works — it picks a component name (`'BarChart'` vs `'LineChart'`) based on the data shape; your switch dispatches on that name.
- The shadcn-style primitives (`ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, etc.) are also exported if you want to build custom chart layouts.

## Next Steps

Continue to [11. Generative UI: Components](./11_generative_ui_components.md) for cards, tables, and custom components.
