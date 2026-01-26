import type {
  KnowledgeConfigResponse,
  ContentResponse,
  ContentStatusResponse,
  ContentListResponse,
  ContentListOptions,
  VectorSearchRequest,
  VectorSearchResponse,
  ContentUpdateRequest,
} from '@rodrigocoliveira/agno-types';

/**
 * Manages knowledge operations
 */
export class KnowledgeManager {
  /**
   * Get knowledge configuration
   * GET /knowledge/config
   */
  async getConfig(
    endpoint: string,
    headers: Record<string, string>,
    dbId?: string,
    params?: URLSearchParams
  ): Promise<KnowledgeConfigResponse> {
    const url = new URL(`${endpoint}/knowledge/config`);
    if (dbId) {
      url.searchParams.set('db_id', dbId);
    }
    if (params) {
      params.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
    }

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      throw new Error(`Failed to fetch knowledge config: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * List all content
   * GET /knowledge/content
   */
  async listContent(
    endpoint: string,
    headers: Record<string, string>,
    options?: ContentListOptions,
    params?: URLSearchParams
  ): Promise<ContentListResponse> {
    const url = new URL(`${endpoint}/knowledge/content`);

    if (options?.limit !== undefined) {
      url.searchParams.set('limit', String(options.limit));
    }
    if (options?.page !== undefined) {
      url.searchParams.set('page', String(options.page));
    }
    if (options?.sort_by) {
      url.searchParams.set('sort_by', options.sort_by);
    }
    if (options?.sort_order) {
      url.searchParams.set('sort_order', options.sort_order);
    }
    if (options?.db_id) {
      url.searchParams.set('db_id', options.db_id);
    }
    if (params) {
      params.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
    }

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      throw new Error(`Failed to list content: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get content by ID
   * GET /knowledge/content/{content_id}
   */
  async getContent(
    endpoint: string,
    contentId: string,
    headers: Record<string, string>,
    dbId?: string,
    params?: URLSearchParams
  ): Promise<ContentResponse> {
    const url = new URL(
      `${endpoint}/knowledge/content/${encodeURIComponent(contentId)}`
    );
    if (dbId) {
      url.searchParams.set('db_id', dbId);
    }
    if (params) {
      params.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
    }

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      throw new Error(`Failed to get content: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get content status
   * GET /knowledge/content/{content_id}/status
   */
  async getContentStatus(
    endpoint: string,
    contentId: string,
    headers: Record<string, string>,
    dbId?: string,
    params?: URLSearchParams
  ): Promise<ContentStatusResponse> {
    const url = new URL(
      `${endpoint}/knowledge/content/${encodeURIComponent(contentId)}/status`
    );
    if (dbId) {
      url.searchParams.set('db_id', dbId);
    }
    if (params) {
      params.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
    }

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      throw new Error(`Failed to get content status: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Search knowledge base
   * POST /knowledge/search
   */
  async search(
    endpoint: string,
    request: VectorSearchRequest,
    headers: Record<string, string>,
    params?: URLSearchParams
  ): Promise<VectorSearchResponse> {
    const url = new URL(`${endpoint}/knowledge/search`);
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
      throw new Error(`Failed to search knowledge: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Upload content
   * POST /knowledge/content
   * Returns 202 Accepted - content is processed asynchronously
   */
  async uploadContent(
    endpoint: string,
    formData: FormData,
    headers: Record<string, string>,
    dbId?: string,
    params?: URLSearchParams
  ): Promise<ContentResponse> {
    const url = new URL(`${endpoint}/knowledge/content`);
    if (dbId) {
      url.searchParams.set('db_id', dbId);
    }
    if (params) {
      params.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
    }

    // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
    const { 'Content-Type': _, ...headersWithoutContentType } = headers;

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: headersWithoutContentType,
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload content: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Update content
   * PATCH /knowledge/content/{content_id}
   */
  async updateContent(
    endpoint: string,
    contentId: string,
    request: ContentUpdateRequest,
    headers: Record<string, string>,
    dbId?: string,
    params?: URLSearchParams
  ): Promise<ContentResponse> {
    const url = new URL(
      `${endpoint}/knowledge/content/${encodeURIComponent(contentId)}`
    );
    if (dbId) {
      url.searchParams.set('db_id', dbId);
    }
    if (params) {
      params.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
    }

    // Build URL-encoded form data
    const formBody = new URLSearchParams();
    if (request.name !== undefined && request.name !== null) {
      formBody.set('name', request.name);
    }
    if (request.description !== undefined && request.description !== null) {
      formBody.set('description', request.description);
    }
    if (request.metadata !== undefined && request.metadata !== null) {
      formBody.set('metadata', request.metadata);
    }
    if (request.reader_id !== undefined && request.reader_id !== null) {
      formBody.set('reader_id', request.reader_id);
    }

    const response = await fetch(url.toString(), {
      method: 'PATCH',
      headers: {
        ...headers,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody.toString(),
    });

    if (!response.ok) {
      throw new Error(`Failed to update content: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Delete all content
   * DELETE /knowledge/content
   */
  async deleteAllContent(
    endpoint: string,
    headers: Record<string, string>,
    dbId?: string,
    params?: URLSearchParams
  ): Promise<void> {
    const url = new URL(`${endpoint}/knowledge/content`);
    if (dbId) {
      url.searchParams.set('db_id', dbId);
    }
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
      throw new Error(`Failed to delete all content: ${response.statusText}`);
    }
  }

  /**
   * Delete content by ID
   * DELETE /knowledge/content/{content_id}
   */
  async deleteContent(
    endpoint: string,
    contentId: string,
    headers: Record<string, string>,
    dbId?: string,
    params?: URLSearchParams
  ): Promise<ContentResponse> {
    const url = new URL(
      `${endpoint}/knowledge/content/${encodeURIComponent(contentId)}`
    );
    if (dbId) {
      url.searchParams.set('db_id', dbId);
    }
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
      throw new Error(`Failed to delete content: ${response.statusText}`);
    }

    return await response.json();
  }
}
