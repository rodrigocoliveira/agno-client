import { useState, useCallback } from 'react';
import type {
  EvalSchema,
  EvalRunsListResponse,
  ListEvalRunsParams,
  ExecuteEvalRequest,
  UpdateEvalRunRequest,
} from '@rodrigocoliveira/agno-types';
import { useAgnoClient } from '../context/AgnoContext';

/**
 * Hook for evaluation management
 */
export function useAgnoEvals() {
  const client = useAgnoClient();
  const [evalRuns, setEvalRuns] = useState<EvalSchema[]>([]);
  const [pagination, setPagination] = useState<EvalRunsListResponse['meta'] | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  /**
   * List evaluation runs with optional filtering and pagination
   */
  const listEvalRuns = useCallback(
    async (
      listParams: ListEvalRunsParams = {},
      options?: { params?: Record<string, string> }
    ): Promise<EvalRunsListResponse> => {
      setIsLoading(true);
      setError(undefined);
      try {
        const response = await client.listEvalRuns(listParams, options);
        setEvalRuns(response.data);
        setPagination(response.meta);
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
   * Get a specific evaluation run by ID
   */
  const getEvalRun = useCallback(
    async (
      evalRunId: string,
      options?: { dbId?: string; table?: string; params?: Record<string, string> }
    ): Promise<EvalSchema> => {
      setIsLoading(true);
      setError(undefined);
      try {
        return await client.getEvalRun(evalRunId, options);
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
   * Execute a new evaluation
   */
  const executeEval = useCallback(
    async (
      request: ExecuteEvalRequest,
      options?: { dbId?: string; table?: string; params?: Record<string, string> }
    ): Promise<EvalSchema> => {
      setIsLoading(true);
      setError(undefined);
      try {
        const result = await client.executeEval(request, options);
        // Add the new eval run to the list
        setEvalRuns((prev) => [result, ...prev]);
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
   * Update an evaluation run (rename)
   */
  const updateEvalRun = useCallback(
    async (
      evalRunId: string,
      request: UpdateEvalRunRequest,
      options?: { dbId?: string; table?: string; params?: Record<string, string> }
    ): Promise<EvalSchema> => {
      setIsLoading(true);
      setError(undefined);
      try {
        const result = await client.updateEvalRun(evalRunId, request, options);
        // Update the eval run in the list
        setEvalRuns((prev) =>
          prev.map((evalRun) => (evalRun.id === evalRunId ? result : evalRun))
        );
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
   * Delete multiple evaluation runs
   */
  const deleteEvalRuns = useCallback(
    async (
      evalRunIds: string[],
      options?: { dbId?: string; table?: string; params?: Record<string, string> }
    ): Promise<void> => {
      setIsLoading(true);
      setError(undefined);
      try {
        await client.deleteEvalRuns(evalRunIds, options);
        // Remove deleted eval runs from the list
        const deletedSet = new Set(evalRunIds);
        setEvalRuns((prev) => prev.filter((evalRun) => !deletedSet.has(evalRun.id)));
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
   * Rename an evaluation run (convenience method)
   */
  const renameEvalRun = useCallback(
    async (
      evalRunId: string,
      newName: string,
      options?: { dbId?: string; table?: string; params?: Record<string, string> }
    ): Promise<EvalSchema> => {
      return updateEvalRun(evalRunId, { name: newName }, options);
    },
    [updateEvalRun]
  );

  return {
    // State
    evalRuns,
    pagination,
    isLoading,
    error,

    // Methods
    listEvalRuns,
    getEvalRun,
    executeEval,
    updateEvalRun,
    deleteEvalRuns,
    renameEvalRun,
  };
}
