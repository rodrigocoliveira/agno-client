/**
 * @rodrigocoliveira/agno-client
 * Core client library for Agno agents with streaming support
 */

// Main client
export { AgnoClient } from './client';

// Utilities
export { Logger } from './utils/logger';

// Traces manager types
export type {
  PaginatedTracesResult,
  PaginatedTraceSessionStatsResult,
} from './managers/traces-manager';

// Re-export types from @rodrigocoliveira/agno-types
export type {
  AgnoClientConfig,
  ChatMessage,
  ToolCall,
  RunResponse,
  RunResponseContent,
  SessionEntry,
  AgentDetails,
  TeamDetails,
  ClientState,
  MessageExtraData,
  ImageData,
  VideoData,
  AudioData,
  ResponseAudioData,
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
  // Schedules types
  ListSchedulesParams,
  ListScheduleRunsParams,
  ScheduleCreate,
  ScheduleUpdate,
  ScheduleResponse,
  ScheduleStateResponse,
  ScheduleRunStatus,
  ScheduleRunResponse,
  SchedulesListResponse,
  ScheduleRunsListResponse,
  // Approvals types
  ApprovalStatus,
  ApprovalSourceType,
  ApprovalPauseType,
  ApprovalRunStatus,
  ListApprovalsParams,
  ApprovalResponse,
  ApprovalResolve,
  ApprovalCountResponse,
  ApprovalStatusResponse,
  ApprovalsListResponse,
  // Components types
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

export { RunEvent } from '@rodrigocoliveira/agno-types';
