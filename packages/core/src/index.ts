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
} from '@rodrigocoliveira/agno-types';

export { RunEvent } from '@rodrigocoliveira/agno-types';
