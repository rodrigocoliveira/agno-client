import { useState, useCallback } from 'react';
import type {
  MetricsResponse,
  DayAggregatedMetrics,
  MetricsOptions,
  RefreshMetricsOptions,
} from '@rodrigocoliveira/agno-types';
import { useAgnoClient } from '../context/AgnoContext';

/**
 * Hook for metrics management
 *
 * Provides methods to fetch and refresh AgentOS metrics.
 *
 * @example
 * ```tsx
 * function MetricsDashboard() {
 *   const {
 *     metrics,
 *     fetchMetrics,
 *     refreshMetrics,
 *     isLoading,
 *     isRefreshing,
 *     error,
 *   } = useAgnoMetrics();
 *
 *   useEffect(() => {
 *     fetchMetrics({
 *       startingDate: '2024-01-01',
 *       endingDate: '2024-01-31',
 *     });
 *   }, [fetchMetrics]);
 *
 *   if (isLoading) return <div>Loading metrics...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *
 *   return (
 *     <div>
 *       {metrics?.metrics.map((day) => (
 *         <div key={day.id}>
 *           <h3>{day.date}</h3>
 *           <p>Agent Runs: {day.agent_runs_count}</p>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAgnoMetrics() {
  const client = useAgnoClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [metrics, setMetrics] = useState<MetricsResponse | undefined>();

  /**
   * Fetch aggregated metrics from the endpoint
   *
   * @param options - Options including date range, dbId, table, and custom params
   * @returns MetricsResponse containing daily aggregated metrics
   */
  const fetchMetrics = useCallback(
    async (options?: MetricsOptions): Promise<MetricsResponse> => {
      setIsLoading(true);
      setError(undefined);
      try {
        const result = await client.fetchMetrics(options);
        setMetrics(result);
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
   * Refresh/recalculate metrics on the backend
   *
   * @param options - Options including dbId, table, and custom params
   * @returns Array of refreshed DayAggregatedMetrics
   */
  const refreshMetrics = useCallback(
    async (options?: RefreshMetricsOptions): Promise<DayAggregatedMetrics[]> => {
      setIsRefreshing(true);
      setError(undefined);
      try {
        const result = await client.refreshMetrics(options);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        throw err;
      } finally {
        setIsRefreshing(false);
      }
    },
    [client]
  );

  /**
   * Clear cached metrics and error state
   */
  const clearMetrics = useCallback(() => {
    setMetrics(undefined);
    setError(undefined);
  }, []);

  return {
    // Data
    metrics,

    // Actions
    fetchMetrics,
    refreshMetrics,
    clearMetrics,

    // State
    isLoading,
    isRefreshing,
    error,
  };
}
