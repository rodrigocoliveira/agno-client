import type {
  TraceSummary,
  TraceDetail,
  TraceNode,
  TraceSessionStats,
  TracesListResponse,
  TraceSessionStatsResponse,
  ListTracesOptions,
  GetTraceOptions,
  GetTraceSessionStatsOptions,
  PaginationInfo,
} from '@rodrigocoliveira/agno-types';

/**
 * Response wrapper for paginated trace results
 */
export interface PaginatedTracesResult {
  traces: TraceSummary[];
  pagination: PaginationInfo;
}

/**
 * Response wrapper for paginated trace session stats results
 */
export interface PaginatedTraceSessionStatsResult {
  stats: TraceSessionStats[];
  pagination: PaginationInfo;
}

/**
 * Manages trace operations
 */
export class TracesManager {
  /**
   * Fetch traces with optional filters
   * GET /traces
   */
  async fetchTraces(
    endpoint: string,
    options: ListTracesOptions,
    headers: Record<string, string>,
    params?: URLSearchParams
  ): Promise<PaginatedTracesResult> {
    const url = new URL(`${endpoint}/traces`);

    // Apply filter options to URL
    if (options.run_id) url.searchParams.set('run_id', options.run_id);
    if (options.session_id) url.searchParams.set('session_id', options.session_id);
    if (options.user_id) url.searchParams.set('user_id', options.user_id);
    if (options.agent_id) url.searchParams.set('agent_id', options.agent_id);
    if (options.team_id) url.searchParams.set('team_id', options.team_id);
    if (options.workflow_id) url.searchParams.set('workflow_id', options.workflow_id);
    if (options.status) url.searchParams.set('status', options.status);
    if (options.start_time) url.searchParams.set('start_time', options.start_time);
    if (options.end_time) url.searchParams.set('end_time', options.end_time);
    if (options.page !== undefined) url.searchParams.set('page', String(options.page));
    if (options.limit !== undefined) url.searchParams.set('limit', String(options.limit));
    if (options.db_id) url.searchParams.set('db_id', options.db_id);

    // Merge additional params if provided
    if (params) {
      params.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
    }

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          traces: [],
          pagination: {
            page: 1,
            limit: options.limit || 20,
            total_pages: 0,
            total_count: 0,
            search_time_ms: 0,
          },
        };
      }
      throw new Error(`Failed to fetch traces: ${response.statusText}`);
    }

    const data: TracesListResponse = await response.json();
    return {
      traces: data.data ?? [],
      pagination: data.meta,
    };
  }

  /**
   * Get trace detail or specific span
   * GET /traces/{trace_id}
   */
  async getTraceDetail(
    endpoint: string,
    traceId: string,
    options: GetTraceOptions,
    headers: Record<string, string>,
    params?: URLSearchParams
  ): Promise<TraceDetail | TraceNode> {
    const url = new URL(`${endpoint}/traces/${encodeURIComponent(traceId)}`);

    // Apply options to URL
    if (options.span_id) url.searchParams.set('span_id', options.span_id);
    if (options.run_id) url.searchParams.set('run_id', options.run_id);
    if (options.db_id) url.searchParams.set('db_id', options.db_id);

    // Merge additional params if provided
    if (params) {
      params.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
    }

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      throw new Error(`Failed to get trace detail: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get trace session statistics
   * GET /trace_session_stats
   */
  async getTraceSessionStats(
    endpoint: string,
    options: GetTraceSessionStatsOptions,
    headers: Record<string, string>,
    params?: URLSearchParams
  ): Promise<PaginatedTraceSessionStatsResult> {
    const url = new URL(`${endpoint}/trace_session_stats`);

    // Apply filter options to URL
    if (options.user_id) url.searchParams.set('user_id', options.user_id);
    if (options.agent_id) url.searchParams.set('agent_id', options.agent_id);
    if (options.team_id) url.searchParams.set('team_id', options.team_id);
    if (options.workflow_id) url.searchParams.set('workflow_id', options.workflow_id);
    if (options.start_time) url.searchParams.set('start_time', options.start_time);
    if (options.end_time) url.searchParams.set('end_time', options.end_time);
    if (options.page !== undefined) url.searchParams.set('page', String(options.page));
    if (options.limit !== undefined) url.searchParams.set('limit', String(options.limit));
    if (options.db_id) url.searchParams.set('db_id', options.db_id);

    // Merge additional params if provided
    if (params) {
      params.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
    }

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          stats: [],
          pagination: {
            page: 1,
            limit: options.limit || 20,
            total_pages: 0,
            total_count: 0,
            search_time_ms: 0,
          },
        };
      }
      throw new Error(`Failed to fetch trace session stats: ${response.statusText}`);
    }

    const data: TraceSessionStatsResponse = await response.json();
    return {
      stats: data.data ?? [],
      pagination: data.meta,
    };
  }
}
