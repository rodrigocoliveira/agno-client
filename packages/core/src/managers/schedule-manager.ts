import type {
  ScheduleResponse,
  ScheduleCreate,
  ScheduleUpdate,
  ScheduleStateResponse,
  ScheduleRunResponse,
  SchedulesListResponse,
  ScheduleRunsListResponse,
  ListSchedulesParams,
  ListScheduleRunsParams,
} from '@rodrigocoliveira/agno-types';

/**
 * Manages schedule operations
 */
export class ScheduleManager {
  /**
   * Fetch schedules with filtering and pagination
   */
  async fetchSchedules(
    endpoint: string,
    headers: Record<string, string>,
    queryParams?: ListSchedulesParams,
    params?: URLSearchParams
  ): Promise<SchedulesListResponse> {
    const url = new URL(`${endpoint}/schedules`);

    if (queryParams) {
      if (queryParams.enabled !== undefined) url.searchParams.set('enabled', String(queryParams.enabled));
      if (queryParams.limit !== undefined) url.searchParams.set('limit', String(queryParams.limit));
      if (queryParams.page !== undefined) url.searchParams.set('page', String(queryParams.page));
    }

    if (params) {
      params.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
    }

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      if (response.status === 404) {
        return { data: [], meta: { page: 1, limit: 100, total_pages: 0, total_count: 0, search_time_ms: 0 } };
      }
      throw new Error(`Failed to fetch schedules: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get a specific schedule by ID
   */
  async getScheduleById(
    endpoint: string,
    scheduleId: string,
    headers: Record<string, string>,
    params?: URLSearchParams
  ): Promise<ScheduleResponse> {
    const url = new URL(`${endpoint}/schedules/${encodeURIComponent(scheduleId)}`);

    if (params) {
      params.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
    }

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      throw new Error(`Failed to get schedule: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Create a new schedule
   */
  async createSchedule(
    endpoint: string,
    request: ScheduleCreate,
    headers: Record<string, string>,
    params?: URLSearchParams
  ): Promise<ScheduleResponse> {
    const url = new URL(`${endpoint}/schedules`);

    if (params) {
      params.forEach((value, key) => {
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
      throw new Error(`Failed to create schedule: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Update an existing schedule
   */
  async updateSchedule(
    endpoint: string,
    scheduleId: string,
    request: ScheduleUpdate,
    headers: Record<string, string>,
    params?: URLSearchParams
  ): Promise<ScheduleResponse> {
    const url = new URL(`${endpoint}/schedules/${encodeURIComponent(scheduleId)}`);

    if (params) {
      params.forEach((value, key) => {
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
      throw new Error(`Failed to update schedule: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Delete a schedule
   */
  async deleteSchedule(
    endpoint: string,
    scheduleId: string,
    headers: Record<string, string>,
    params?: URLSearchParams
  ): Promise<void> {
    const url = new URL(`${endpoint}/schedules/${encodeURIComponent(scheduleId)}`);

    if (params) {
      params.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to delete schedule: ${response.statusText}`);
    }
  }

  /**
   * Enable a schedule
   */
  async enableSchedule(
    endpoint: string,
    scheduleId: string,
    headers: Record<string, string>,
    params?: URLSearchParams
  ): Promise<ScheduleStateResponse> {
    const url = new URL(`${endpoint}/schedules/${encodeURIComponent(scheduleId)}/enable`);

    if (params) {
      params.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to enable schedule: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Disable a schedule
   */
  async disableSchedule(
    endpoint: string,
    scheduleId: string,
    headers: Record<string, string>,
    params?: URLSearchParams
  ): Promise<ScheduleStateResponse> {
    const url = new URL(`${endpoint}/schedules/${encodeURIComponent(scheduleId)}/disable`);

    if (params) {
      params.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to disable schedule: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Trigger a schedule to run immediately
   */
  async triggerSchedule(
    endpoint: string,
    scheduleId: string,
    headers: Record<string, string>,
    params?: URLSearchParams
  ): Promise<ScheduleRunResponse> {
    const url = new URL(`${endpoint}/schedules/${encodeURIComponent(scheduleId)}/trigger`);

    if (params) {
      params.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to trigger schedule: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Fetch runs for a specific schedule
   */
  async fetchScheduleRuns(
    endpoint: string,
    scheduleId: string,
    headers: Record<string, string>,
    queryParams?: ListScheduleRunsParams,
    params?: URLSearchParams
  ): Promise<ScheduleRunsListResponse> {
    const url = new URL(`${endpoint}/schedules/${encodeURIComponent(scheduleId)}/runs`);

    if (queryParams) {
      if (queryParams.limit !== undefined) url.searchParams.set('limit', String(queryParams.limit));
      if (queryParams.page !== undefined) url.searchParams.set('page', String(queryParams.page));
    }

    if (params) {
      params.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
    }

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      if (response.status === 404) {
        return { data: [], meta: { page: 1, limit: 100, total_pages: 0, total_count: 0, search_time_ms: 0 } };
      }
      throw new Error(`Failed to fetch schedule runs: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get a specific schedule run by ID
   */
  async getScheduleRunById(
    endpoint: string,
    scheduleId: string,
    runId: string,
    headers: Record<string, string>,
    params?: URLSearchParams
  ): Promise<ScheduleRunResponse> {
    const url = new URL(`${endpoint}/schedules/${encodeURIComponent(scheduleId)}/runs/${encodeURIComponent(runId)}`);

    if (params) {
      params.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
    }

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      throw new Error(`Failed to get schedule run: ${response.statusText}`);
    }

    return await response.json();
  }
}
