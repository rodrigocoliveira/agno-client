import { useState, useEffect, useCallback } from 'react';
import type {
  UserMemory,
  MemoriesListResponse,
  ListMemoriesParams,
  CreateMemoryRequest,
  UpdateMemoryRequest,
  UserMemoryStatsResponse,
  UserMemoryStatsParams,
} from '@rodrigocoliveira/agno-types';
import { useAgnoClient } from '../context/AgnoContext';

/**
 * Hook for memory management
 */
export function useAgnoMemory() {
  const client = useAgnoClient();
  const [memories, setMemories] = useState<UserMemory[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Listen to memory events
  useEffect(() => {
    const handleMemoryCreated = (memory: UserMemory) => {
      setMemories((prev) => [memory, ...prev]);
    };

    const handleMemoryUpdated = (memory: UserMemory) => {
      setMemories((prev) =>
        prev.map((m) => (m.memory_id === memory.memory_id ? memory : m))
      );
    };

    const handleMemoryDeleted = ({ memoryId }: { memoryId: string }) => {
      setMemories((prev) => prev.filter((m) => m.memory_id !== memoryId));
    };

    const handleMemoriesDeleted = ({ memoryIds }: { memoryIds: string[] }) => {
      const deletedIds = new Set(memoryIds);
      setMemories((prev) => prev.filter((m) => !deletedIds.has(m.memory_id)));
    };

    const handleStateChange = () => {
      const state = client.getState();
      setMemories(state.memories);
      setTopics(state.memoryTopics);
    };

    client.on('memory:created', handleMemoryCreated);
    client.on('memory:updated', handleMemoryUpdated);
    client.on('memory:deleted', handleMemoryDeleted);
    client.on('memories:deleted', handleMemoriesDeleted);
    client.on('state:change', handleStateChange);

    // Initialize
    const state = client.getState();
    setMemories(state.memories);
    setTopics(state.memoryTopics);

    return () => {
      client.off('memory:created', handleMemoryCreated);
      client.off('memory:updated', handleMemoryUpdated);
      client.off('memory:deleted', handleMemoryDeleted);
      client.off('memories:deleted', handleMemoriesDeleted);
      client.off('state:change', handleStateChange);
    };
  }, [client]);

  /**
   * Fetch memories with optional filtering and pagination
   */
  const fetchMemories = useCallback(
    async (
      queryParams?: ListMemoriesParams,
      options?: { params?: Record<string, string> }
    ): Promise<MemoriesListResponse> => {
      setIsLoading(true);
      setError(undefined);
      try {
        const response = await client.fetchMemories(queryParams, options);
        setMemories(response.data);
        return response;
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
   * Get a specific memory by ID
   */
  const getMemoryById = useCallback(
    async (
      memoryId: string,
      options?: { params?: Record<string, string>; table?: string }
    ): Promise<UserMemory> => {
      setIsLoading(true);
      setError(undefined);
      try {
        return await client.getMemoryById(memoryId, options);
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
   * Get all available memory topics
   */
  const getMemoryTopics = useCallback(
    async (
      options?: { params?: Record<string, string>; table?: string }
    ): Promise<string[]> => {
      setIsLoading(true);
      setError(undefined);
      try {
        const result = await client.getMemoryTopics(options);
        setTopics(result);
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
   * Get user memory statistics
   */
  const getUserMemoryStats = useCallback(
    async (
      queryParams?: UserMemoryStatsParams,
      options?: { params?: Record<string, string> }
    ): Promise<UserMemoryStatsResponse> => {
      setIsLoading(true);
      setError(undefined);
      try {
        return await client.getUserMemoryStats(queryParams, options);
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
   * Create a new memory
   */
  const createMemory = useCallback(
    async (
      request: CreateMemoryRequest,
      options?: { params?: Record<string, string>; table?: string }
    ): Promise<UserMemory> => {
      setIsLoading(true);
      setError(undefined);
      try {
        return await client.createMemory(request, options);
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
   * Update an existing memory
   */
  const updateMemory = useCallback(
    async (
      memoryId: string,
      request: UpdateMemoryRequest,
      options?: { params?: Record<string, string>; table?: string }
    ): Promise<UserMemory> => {
      setIsLoading(true);
      setError(undefined);
      try {
        return await client.updateMemory(memoryId, request, options);
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
   * Delete a single memory
   */
  const deleteMemory = useCallback(
    async (
      memoryId: string,
      options?: { params?: Record<string, string>; table?: string }
    ): Promise<void> => {
      setIsLoading(true);
      setError(undefined);
      try {
        await client.deleteMemory(memoryId, options);
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
   * Delete multiple memories
   */
  const deleteMultipleMemories = useCallback(
    async (
      memoryIds: string[],
      options?: { params?: Record<string, string>; table?: string; userId?: string }
    ): Promise<void> => {
      setIsLoading(true);
      setError(undefined);
      try {
        await client.deleteMultipleMemories(memoryIds, options);
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
    memories,
    topics,
    isLoading,
    error,
    fetchMemories,
    getMemoryById,
    getMemoryTopics,
    getUserMemoryStats,
    createMemory,
    updateMemory,
    deleteMemory,
    deleteMultipleMemories,
  };
}
