/**
 * @rodrigocoliveira/agno-client
 * Core client library for Agno agents with streaming support
 */

// Main client
export { AgnoClient } from './client';

// Utilities
export { Logger } from './utils/logger';

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
  // Metrics API types
  TokenMetrics,
  ModelMetrics,
  DayAggregatedMetrics,
  MetricsResponse,
  MetricsOptions,
  RefreshMetricsOptions,
} from '@rodrigocoliveira/agno-types';

export { RunEvent } from '@rodrigocoliveira/agno-types';
