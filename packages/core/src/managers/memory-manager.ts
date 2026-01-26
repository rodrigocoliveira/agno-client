import type {
  UserMemory,
  MemoriesListResponse,
  ListMemoriesParams,
  CreateMemoryRequest,
  UpdateMemoryRequest,
  DeleteMultipleMemoriesRequest,
  UserMemoryStatsResponse,
  UserMemoryStatsParams,
} from '@rodrigocoliveira/agno-types';

/**
 * Manages memory operations
 */
export class MemoryManager {
  /**
   * Fetch memories with filtering and pagination
   */
  async fetchMemories(
    endpoint: string,
    dbId: string,
    headers: Record<string, string>,
    queryParams?: ListMemoriesParams,
    params?: URLSearchParams
  ): Promise<MemoriesListResponse> {
    const url = new URL(`${endpoint}/memories`);

    // Add query parameters from ListMemoriesParams
    if (queryParams) {
      if (queryParams.user_id) url.searchParams.set('user_id', queryParams.user_id);
      if (queryParams.agent_id) url.searchParams.set('agent_id', queryParams.agent_id);
      if (queryParams.team_id) url.searchParams.set('team_id', queryParams.team_id);
      if (queryParams.search_content) url.searchParams.set('search_content', queryParams.search_content);
      if (queryParams.limit !== undefined) url.searchParams.set('limit', String(queryParams.limit));
      if (queryParams.page !== undefined) url.searchParams.set('page', String(queryParams.page));
      if (queryParams.sort_by) url.searchParams.set('sort_by', queryParams.sort_by);
      if (queryParams.sort_order) url.searchParams.set('sort_order', queryParams.sort_order);
      if (queryParams.db_id) url.searchParams.set('db_id', queryParams.db_id);
      if (queryParams.table) url.searchParams.set('table', queryParams.table);
      if (queryParams.topics && queryParams.topics.length > 0) {
        url.searchParams.set('topics', queryParams.topics.join(','));
      }
    }

    // Use dbId from config if not provided in queryParams
    if (!queryParams?.db_id && dbId) {
      url.searchParams.set('db_id', dbId);
    }

    // Merge additional params if provided
    if (params) {
      params.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
    }

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      if (response.status === 404) {
        return { data: [], meta: { page: 0, limit: 20, total_pages: 0, total_count: 0, search_time_ms: 0 } };
      }
      throw new Error(`Failed to fetch memories: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get a specific memory by ID
   */
  async getMemoryById(
    endpoint: string,
    memoryId: string,
    dbId: string,
    headers: Record<string, string>,
    userId?: string,
    table?: string,
    params?: URLSearchParams
  ): Promise<UserMemory> {
    const url = new URL(`${endpoint}/memories/${memoryId}`);

    if (userId) url.searchParams.set('user_id', userId);
    if (dbId) url.searchParams.set('db_id', dbId);
    if (table) url.searchParams.set('table', table);

    // Merge additional params if provided
    if (params) {
      params.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
    }

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      throw new Error(`Failed to get memory: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get all available memory topics
   */
  async getMemoryTopics(
    endpoint: string,
    dbId: string,
    headers: Record<string, string>,
    table?: string,
    params?: URLSearchParams
  ): Promise<string[]> {
    const url = new URL(`${endpoint}/memory_topics`);

    if (dbId) url.searchParams.set('db_id', dbId);
    if (table) url.searchParams.set('table', table);

    // Merge additional params if provided
    if (params) {
      params.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
    }

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      if (response.status === 404) {
        return [];
      }
      throw new Error(`Failed to get memory topics: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get user memory statistics
   */
  async getUserMemoryStats(
    endpoint: string,
    dbId: string,
    headers: Record<string, string>,
    queryParams?: UserMemoryStatsParams,
    params?: URLSearchParams
  ): Promise<UserMemoryStatsResponse> {
    const url = new URL(`${endpoint}/user_memory_stats`);

    if (queryParams) {
      if (queryParams.limit !== undefined) url.searchParams.set('limit', String(queryParams.limit));
      if (queryParams.page !== undefined) url.searchParams.set('page', String(queryParams.page));
      if (queryParams.db_id) url.searchParams.set('db_id', queryParams.db_id);
      if (queryParams.table) url.searchParams.set('table', queryParams.table);
    }

    // Use dbId from config if not provided in queryParams
    if (!queryParams?.db_id && dbId) {
      url.searchParams.set('db_id', dbId);
    }

    // Merge additional params if provided
    if (params) {
      params.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
    }

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      if (response.status === 404) {
        return { data: [], meta: { page: 0, limit: 20, total_pages: 0, total_count: 0, search_time_ms: 0 } };
      }
      throw new Error(`Failed to get user memory stats: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Create a new memory
   */
  async createMemory(
    endpoint: string,
    request: CreateMemoryRequest,
    dbId: string,
    headers: Record<string, string>,
    table?: string,
    params?: URLSearchParams
  ): Promise<UserMemory> {
    const url = new URL(`${endpoint}/memories`);

    if (dbId) url.searchParams.set('db_id', dbId);
    if (table) url.searchParams.set('table', table);

    // Merge additional params if provided
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
      throw new Error(`Failed to create memory: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Update an existing memory
   */
  async updateMemory(
    endpoint: string,
    memoryId: string,
    request: UpdateMemoryRequest,
    dbId: string,
    headers: Record<string, string>,
    table?: string,
    params?: URLSearchParams
  ): Promise<UserMemory> {
    const url = new URL(`${endpoint}/memories/${memoryId}`);

    if (dbId) url.searchParams.set('db_id', dbId);
    if (table) url.searchParams.set('table', table);

    // Merge additional params if provided
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
      throw new Error(`Failed to update memory: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Delete a single memory
   */
  async deleteMemory(
    endpoint: string,
    memoryId: string,
    dbId: string,
    headers: Record<string, string>,
    userId?: string,
    table?: string,
    params?: URLSearchParams
  ): Promise<void> {
    const url = new URL(`${endpoint}/memories/${memoryId}`);

    if (userId) url.searchParams.set('user_id', userId);
    if (dbId) url.searchParams.set('db_id', dbId);
    if (table) url.searchParams.set('table', table);

    // Merge additional params if provided
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
      throw new Error(`Failed to delete memory: ${response.statusText}`);
    }
  }

  /**
   * Delete multiple memories
   */
  async deleteMultipleMemories(
    endpoint: string,
    request: DeleteMultipleMemoriesRequest,
    dbId: string,
    headers: Record<string, string>,
    table?: string,
    params?: URLSearchParams
  ): Promise<void> {
    const url = new URL(`${endpoint}/memories`);

    if (dbId) url.searchParams.set('db_id', dbId);
    if (table) url.searchParams.set('table', table);

    // Merge additional params if provided
    if (params) {
      params.forEach((value, key) => {
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
      throw new Error(`Failed to delete memories: ${response.statusText}`);
    }
  }
}
