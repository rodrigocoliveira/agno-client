import type {
  EvalSchema,
  EvalRunsListResponse,
  ListEvalRunsParams,
  ExecuteEvalRequest,
  UpdateEvalRunRequest,
  DeleteEvalRunsRequest,
} from '@rodrigocoliveira/agno-types';

/**
 * Manages evaluation operations
 */
export class EvalManager {
  /**
   * List evaluation runs with optional filtering and pagination
   */
  async listEvalRuns(
    endpoint: string,
    listParams: ListEvalRunsParams,
    headers: Record<string, string>,
    additionalParams?: URLSearchParams
  ): Promise<EvalRunsListResponse> {
    const url = new URL(`${endpoint}/eval-runs`);

    // Add list parameters as query params
    if (listParams.agent_id) url.searchParams.set('agent_id', listParams.agent_id);
    if (listParams.team_id) url.searchParams.set('team_id', listParams.team_id);
    if (listParams.workflow_id) url.searchParams.set('workflow_id', listParams.workflow_id);
    if (listParams.model_id) url.searchParams.set('model_id', listParams.model_id);
    if (listParams.type) url.searchParams.set('type', listParams.type);
    if (listParams.limit !== undefined) url.searchParams.set('limit', String(listParams.limit));
    if (listParams.page !== undefined) url.searchParams.set('page', String(listParams.page));
    if (listParams.sort_by) url.searchParams.set('sort_by', listParams.sort_by);
    if (listParams.sort_order) url.searchParams.set('sort_order', listParams.sort_order);
    if (listParams.db_id) url.searchParams.set('db_id', listParams.db_id);
    if (listParams.table) url.searchParams.set('table', listParams.table);
    if (listParams.eval_types) url.searchParams.set('eval_types', listParams.eval_types);

    // Merge additional params if provided
    if (additionalParams) {
      additionalParams.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
    }

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      if (response.status === 404) {
        return { data: [], meta: { page: 1, limit: 20, total_pages: 0, total_count: 0, search_time_ms: 0 } };
      }
      throw new Error(`Failed to list evaluation runs: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get a specific evaluation run by ID
   */
  async getEvalRun(
    endpoint: string,
    evalRunId: string,
    dbId?: string,
    table?: string,
    headers?: Record<string, string>,
    additionalParams?: URLSearchParams
  ): Promise<EvalSchema> {
    const url = new URL(`${endpoint}/eval-runs/${encodeURIComponent(evalRunId)}`);

    if (dbId) url.searchParams.set('db_id', dbId);
    if (table) url.searchParams.set('table', table);

    // Merge additional params if provided
    if (additionalParams) {
      additionalParams.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
    }

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      throw new Error(`Failed to get evaluation run: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Execute a new evaluation
   */
  async executeEval(
    endpoint: string,
    request: ExecuteEvalRequest,
    dbId?: string,
    table?: string,
    headers?: Record<string, string>,
    additionalParams?: URLSearchParams
  ): Promise<EvalSchema> {
    const url = new URL(`${endpoint}/eval-runs`);

    if (dbId) url.searchParams.set('db_id', dbId);
    if (table) url.searchParams.set('table', table);

    // Merge additional params if provided
    if (additionalParams) {
      additionalParams.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Failed to execute evaluation: ${response.statusText}. ${errorBody}`);
    }

    return await response.json();
  }

  /**
   * Update an evaluation run (rename)
   */
  async updateEvalRun(
    endpoint: string,
    evalRunId: string,
    request: UpdateEvalRunRequest,
    dbId?: string,
    table?: string,
    headers?: Record<string, string>,
    additionalParams?: URLSearchParams
  ): Promise<EvalSchema> {
    const url = new URL(`${endpoint}/eval-runs/${encodeURIComponent(evalRunId)}`);

    if (dbId) url.searchParams.set('db_id', dbId);
    if (table) url.searchParams.set('table', table);

    // Merge additional params if provided
    if (additionalParams) {
      additionalParams.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      method: 'PATCH',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to update evaluation run: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Delete multiple evaluation runs
   */
  async deleteEvalRuns(
    endpoint: string,
    request: DeleteEvalRunsRequest,
    dbId?: string,
    table?: string,
    headers?: Record<string, string>,
    additionalParams?: URLSearchParams
  ): Promise<void> {
    const url = new URL(`${endpoint}/eval-runs`);

    if (dbId) url.searchParams.set('db_id', dbId);
    if (table) url.searchParams.set('table', table);

    // Merge additional params if provided
    if (additionalParams) {
      additionalParams.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete evaluation runs: ${response.statusText}`);
    }
  }
}
