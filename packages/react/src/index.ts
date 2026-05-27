/**
 * @rodrigocoliveira/agno-react
 * React hooks for Agno client
 */

// Context and Provider
export { AgnoProvider, useAgnoClient } from './context/AgnoContext';
export type { AgnoProviderProps } from './context/AgnoContext';
export { ToolHandlerProvider, useToolHandlers } from './context/ToolHandlerContext';
export type { ToolHandlerProviderProps, ToolHandlerContextValue } from './context/ToolHandlerContext';

// Generative UI Helpers
export {
  createBarChart,
  createLineChart,
  createPieChart,
  createAreaChart,
  createCardGrid,
  createCard,
  createTable,
  createColumn,
  createMarkdown,
  createArtifact,
  createSmartChart,
  createToolResult,
  resultWithBarChart,
  resultWithSmartChart,
  resultWithCardGrid,
  resultWithTable,
} from './utils/ui-helpers';
export type {
  ChartHelperOptions,
  CardGridHelperOptions,
  TableHelperOptions,
} from './utils/ui-helpers';

// Hooks
export { useAgnoChat } from './hooks/useAgnoChat';
export { useAgnoSession } from './hooks/useAgnoSession';
export { useAgnoActions } from './hooks/useAgnoActions';
export { useAgnoToolExecution } from './hooks/useAgnoToolExecution';
export type { ToolHandler, ToolExecutionEvent } from './hooks/useAgnoToolExecution';

// Tool rendering (v2.0)
export { byToolName } from './ui/composed/agno-chat/render-tool';
export type { RenderTool, ToolRenderArgs, ToolEntry } from './ui/composed/agno-chat/render-tool';
export { ToolDebugCard } from './ui/composed/agno-chat/tool-building-blocks';
export type { ToolDebugCardProps } from './ui/composed/agno-chat/tool-building-blocks';

// Message slot composition (v2.0)
export {
  AgnoMessage,
  AgnoMessageReasoning,
  AgnoMessageMedia,
  AgnoMessageTools,
  AgnoMessageContent,
  AgnoMessageReferences,
  AgnoMessageFooter,
  AgnoMessageContext,
  useAgnoMessageContext,
} from './ui/composed/agno-message';
export type {
  AgnoMessageProps,
  AgnoMessageToolsProps,
  AgnoMessageFooterProps,
  AgnoMessageContextValue,
} from './ui/composed/agno-message';
export { useAgnoCustomEvents } from './hooks/useAgnoCustomEvents';
export { useAgnoMemory } from './hooks/useAgnoMemory';
export { useAgnoSessionState } from './hooks/useAgnoSessionState';
export { useAgnoKnowledge } from './hooks/useAgnoKnowledge';
export { useAgnoMetrics } from './hooks/useAgnoMetrics';
export { useAgnoEvals } from './hooks/useAgnoEvals';
export { useAgnoTraces } from './hooks/useAgnoTraces';
export { useAgnoComponents } from './hooks/useAgnoComponents';
export type {
  PaginatedTracesResult,
  PaginatedTraceSessionStatsResult,
} from './hooks/useAgnoTraces';

// Re-export types from dependencies
export type {
  AgnoClientConfig,
  ChatMessage,
  ToolCall,
  SessionEntry,
  AgentDetails,
  TeamDetails,
  ClientState,
  RunEvent,
  // Generative UI types
  UIComponentSpec,
  ChartComponentSpec,
  CardGridComponentSpec,
  TableComponentSpec,
  MarkdownComponentSpec,
  CustomComponentSpec,
  ArtifactComponentSpec,
  ToolHandlerResult,
  GenerativeUIData,
  ChartSeries,
  CardData,
  TableColumn,
  CustomEventData,
  // Memory types
  UserMemory,
  MemoriesListResponse,
  ListMemoriesParams,
  CreateMemoryRequest,
  UpdateMemoryRequest,
  DeleteMultipleMemoriesRequest,
  UserMemoryStats,
  UserMemoryStatsResponse,
  UserMemoryStatsParams,
  // Knowledge API types
  ContentStatus,
  ReaderSchema,
  ChunkerSchema,
  VectorDbSchema,
  KnowledgeConfigResponse,
  ContentResponse,
  ContentStatusResponse,
  ContentListResponse,
  ContentListOptions,
  VectorSearchRequest,
  VectorSearchResult,
  VectorSearchResponse,
  ContentUploadRequest,
  ContentUpdateRequest,
  // Metrics API types
  TokenMetrics,
  ModelMetrics,
  DayAggregatedMetrics,
  MetricsResponse,
  MetricsOptions,
  RefreshMetricsOptions,
  // Evaluation types
  EvalType,
  EvalComponentType,
  ScoringStrategy,
  SortOrder,
  EvalSchema,
  ListEvalRunsParams,
  EvalRunsListResponse,
  ExecuteEvalRequest,
  UpdateEvalRunRequest,
  DeleteEvalRunsRequest,
  // Traces types
  TraceStatus,
  TraceSummary,
  TraceNode,
  TraceDetail,
  TraceSessionStats,
  TracesListResponse,
  TraceSessionStatsResponse,
  ListTracesOptions,
  GetTraceOptions,
  GetTraceSessionStatsOptions,
  PaginationInfo,
  // Components API types (Studio DB-stored agents/teams/workflows)
  ComponentType,
  ListComponentsParams,
  ComponentCreate,
  ComponentUpdate,
  ComponentResponse,
  ConfigCreate,
  ConfigUpdate,
  ComponentConfigResponse,
  ComponentsListResponse,
} from '@rodrigocoliveira/agno-types';
