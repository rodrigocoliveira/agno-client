import { useState, useCallback } from 'react';
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
import { useAgnoClient } from '../context/AgnoContext';

/**
 * Hook for knowledge management
 */
export function useAgnoKnowledge() {
  const client = useAgnoClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [config, setConfig] = useState<KnowledgeConfigResponse | undefined>();
  const [content, setContent] = useState<ContentResponse[]>([]);

  /**
   * Get knowledge configuration
   */
  const getConfig = useCallback(
    async (
      options?: { dbId?: string; params?: Record<string, string> }
    ): Promise<KnowledgeConfigResponse> => {
      setIsLoading(true);
      setError(undefined);
      try {
        const result = await client.getKnowledgeConfig(options);
        setConfig(result);
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
   * List all content
   */
  const listContent = useCallback(
    async (
      listOptions?: ContentListOptions,
      options?: { params?: Record<string, string> }
    ): Promise<ContentListResponse> => {
      setIsLoading(true);
      setError(undefined);
      try {
        const result = await client.listKnowledgeContent(listOptions, options);
        setContent(result.data);
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
   * Get content by ID
   */
  const getContent = useCallback(
    async (
      contentId: string,
      options?: { dbId?: string; params?: Record<string, string> }
    ): Promise<ContentResponse> => {
      setIsLoading(true);
      setError(undefined);
      try {
        return await client.getKnowledgeContent(contentId, options);
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
   * Get content status
   */
  const getContentStatus = useCallback(
    async (
      contentId: string,
      options?: { dbId?: string; params?: Record<string, string> }
    ): Promise<ContentStatusResponse> => {
      setIsLoading(true);
      setError(undefined);
      try {
        return await client.getKnowledgeContentStatus(contentId, options);
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
   * Search knowledge base
   */
  const search = useCallback(
    async (
      request: VectorSearchRequest,
      options?: { params?: Record<string, string> }
    ): Promise<VectorSearchResponse> => {
      setIsLoading(true);
      setError(undefined);
      try {
        return await client.searchKnowledge(request, options);
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
   * Upload content
   */
  const uploadContent = useCallback(
    async (
      data:
        | FormData
        | {
            name?: string;
            description?: string;
            url?: string;
            metadata?: Record<string, unknown>;
            file?: File;
            text_content?: string;
            reader_id?: string;
            chunker?: string;
            chunk_size?: number;
            chunk_overlap?: number;
          },
      options?: { dbId?: string; params?: Record<string, string> }
    ): Promise<ContentResponse> => {
      setIsLoading(true);
      setError(undefined);
      try {
        const result = await client.uploadKnowledgeContent(data, options);
        // Add to local state
        setContent((prev) => [result, ...prev]);
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
   * Update content
   */
  const updateContent = useCallback(
    async (
      contentId: string,
      request: ContentUpdateRequest,
      options?: { dbId?: string; params?: Record<string, string> }
    ): Promise<ContentResponse> => {
      setIsLoading(true);
      setError(undefined);
      try {
        const result = await client.updateKnowledgeContent(
          contentId,
          request,
          options
        );
        // Update in local state
        setContent((prev) => prev.map((c) => (c.id === contentId ? result : c)));
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
   * Delete all content
   */
  const deleteAllContent = useCallback(
    async (
      options?: { dbId?: string; params?: Record<string, string> }
    ): Promise<void> => {
      setIsLoading(true);
      setError(undefined);
      try {
        await client.deleteAllKnowledgeContent(options);
        setContent([]);
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
   * Delete content by ID
   */
  const deleteContent = useCallback(
    async (
      contentId: string,
      options?: { dbId?: string; params?: Record<string, string> }
    ): Promise<ContentResponse> => {
      setIsLoading(true);
      setError(undefined);
      try {
        const result = await client.deleteKnowledgeContent(contentId, options);
        // Remove from local state
        setContent((prev) => prev.filter((c) => c.id !== contentId));
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
    // State
    config,
    content,
    isLoading,
    error,
    // Methods
    getConfig,
    listContent,
    getContent,
    getContentStatus,
    search,
    uploadContent,
    updateContent,
    deleteAllContent,
    deleteContent,
  };
}
