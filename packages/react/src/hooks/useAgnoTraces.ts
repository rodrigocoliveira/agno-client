import { useState, useEffect, useCallback } from 'react';
import type {
  TraceSummary,
  TraceDetail,
  TraceNode,
  TraceSessionStats,
  ListTracesOptions,
  GetTraceOptions,
  GetTraceSessionStatsOptions,
} from '@rodrigocoliveira/agno-types';
import type {
  PaginatedTracesResult,
  PaginatedTraceSessionStatsResult,
} from '@rodrigocoliveira/agno-client';
import { useAgnoClient } from '../context/AgnoContext';

// Re-export for convenience
export type { PaginatedTracesResult, PaginatedTraceSessionStatsResult };

/**
 * Hook for traces management
 *
 * Provides methods to:
 * - List traces with filters (fetchTraces)
 * - Get trace detail or specific span (getTraceDetail)
 * - Get trace session statistics (fetchTraceSessionStats)
 *
 * @example
 * ```tsx
 * const { traces, fetchTraces, isLoading, error } = useAgnoTraces();
 *
 * // Fetch traces for a specific session
 * useEffect(() => {
 *   fetchTraces({ session_id: 'my-session-id' });
 * }, []);
 *
 * // Fetch traces with pagination
 * const result = await fetchTraces({ page: 1, limit: 10 });
 * console.log(result.pagination.total_count);
 * ```
 */
export function useAgnoTraces() {
  const client = useAgnoClient();
  const [traces, setTraces] = useState<TraceSummary[]>([]);
  const [traceSessionStats, setTraceSessionStats] = useState<TraceSessionStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Listen to state changes from client
  useEffect(() => {
    const handleStateChange = () => {
      const state = client.getState();
      setTraces(state.traces);
      setTraceSessionStats(state.traceSessionStats);
    };

    client.on('state:change', handleStateChange);

    // Initialize from current state
    const state = client.getState();
    setTraces(state.traces);
    setTraceSessionStats(state.traceSessionStats);

    return () => {
      client.off('state:change', handleStateChange);
    };
  }, [client]);

  /**
   * Fetch traces with optional filters
   *
   * @param options - Filter and pagination options
   * @param requestOptions - Optional per-request headers and params
   * @returns Traces result with pagination info
   */
  const fetchTraces = useCallback(
    async (
      options: ListTracesOptions = {},
      requestOptions?: { headers?: Record<string, string>; params?: Record<string, string> }
    ): Promise<PaginatedTracesResult> => {
      setIsLoading(true);
      setError(undefined);
      try {
        const result = await client.fetchTraces(options, requestOptions);
        setTraces(result.traces);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  /**
   * Get trace detail or a specific span
   *
   * @param traceId - The trace ID to fetch
   * @param options - Options including optional span_id, run_id, db_id
   * @param requestOptions - Optional per-request headers and params
   * @returns TraceDetail (full trace) or TraceNode (specific span)
   */
  const getTraceDetail = useCallback(
    async (
      traceId: string,
      options: GetTraceOptions = {},
      requestOptions?: { headers?: Record<string, string>; params?: Record<string, string> }
    ): Promise<TraceDetail | TraceNode> => {
      setIsLoading(true);
      setError(undefined);
      try {
        return await client.getTraceDetail(traceId, options, requestOptions);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  /**
   * Fetch trace session statistics
   *
   * @param options - Filter and pagination options
   * @param requestOptions - Optional per-request headers and params
   * @returns Trace session stats result with pagination info
   */
  const fetchTraceSessionStats = useCallback(
    async (
      options: GetTraceSessionStatsOptions = {},
      requestOptions?: { headers?: Record<string, string>; params?: Record<string, string> }
    ): Promise<PaginatedTraceSessionStatsResult> => {
      setIsLoading(true);
      setError(undefined);
      try {
        const result = await client.fetchTraceSessionStats(options, requestOptions);
        setTraceSessionStats(result.stats);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  return {
    /** Current list of traces (from last fetchTraces call) */
    traces,
    /** Current trace session statistics (from last fetchTraceSessionStats call) */
    traceSessionStats,
    /** Fetch traces with optional filters and pagination */
    fetchTraces,
    /** Get trace detail or specific span */
    getTraceDetail,
    /** Fetch trace session statistics */
    fetchTraceSessionStats,
    /** Loading state */
    isLoading,
    /** Error message if last operation failed */
    error,
  };
}
