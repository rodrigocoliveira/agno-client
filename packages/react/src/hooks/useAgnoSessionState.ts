import { useCallback, useEffect, useState } from 'react';
import { useAgnoClient } from '../context/AgnoContext';

/**
 * Hook for reactive access to the backend-managed `session_state` dict.
 *
 * The cache is populated automatically by the client:
 * - On `loadSession()` via a parallel `getSessionById()` call
 * - On agent `RunCompleted` chunks that carry `session_state`
 * - On any CustomEvent with a `session_state` field (opt-out via config)
 * - On team runs, via a post-stream REST refresh (workaround through Agno 2.6.0)
 *
 * @example
 * ```tsx
 * type MyState = { counter: number; lastAction?: string };
 *
 * function Panel() {
 *   const { sessionState, setSessionState, mergeSessionState } =
 *     useAgnoSessionState<MyState>();
 *   return <div>count: {sessionState?.counter ?? 0}</div>;
 * }
 * ```
 */
export function useAgnoSessionState<
  T extends Record<string, unknown> = Record<string, unknown>
>(): {
  sessionState: T | null;
  isRefreshing: boolean;
  setSessionState: (next: T | ((prev: T | null) => T)) => Promise<void>;
  mergeSessionState: (partial: Partial<T>) => Promise<void>;
  refreshSessionState: () => Promise<T | null>;
} {
  const client = useAgnoClient();
  const [sessionState, setLocalSessionState] = useState<T | null>(() =>
    client.getSessionState<T>()
  );
  const [isRefreshing, setIsRefreshing] = useState<boolean>(
    () => client.getState().isSessionStateRefreshing ?? false
  );

  useEffect(() => {
    const handleStateChange = (state: T | null) => {
      setLocalSessionState(state);
    };
    const handleRefreshStart = () => setIsRefreshing(true);
    const handleRefreshEnd = () => setIsRefreshing(false);

    client.on('session-state:change', handleStateChange);
    client.on('session-state:refresh:start', handleRefreshStart);
    client.on('session-state:refresh:end', handleRefreshEnd);

    // Sync initial value in case the client already has one when we subscribe.
    setLocalSessionState(client.getSessionState<T>());
    setIsRefreshing(client.getState().isSessionStateRefreshing ?? false);

    return () => {
      client.off('session-state:change', handleStateChange);
      client.off('session-state:refresh:start', handleRefreshStart);
      client.off('session-state:refresh:end', handleRefreshEnd);
    };
  }, [client]);

  const setSessionState = useCallback(
    async (next: T | ((prev: T | null) => T)): Promise<void> => {
      const resolved =
        typeof next === 'function'
          ? (next as (prev: T | null) => T)(client.getSessionState<T>())
          : next;
      await client.setSessionState(resolved);
    },
    [client]
  );

  const mergeSessionState = useCallback(
    async (partial: Partial<T>): Promise<void> => {
      const current = (client.getSessionState<T>() ?? ({} as T)) as T;
      const merged = { ...current, ...partial } as T;
      await client.setSessionState(merged);
    },
    [client]
  );

  const refreshSessionState = useCallback(async (): Promise<T | null> => {
    const result = await client.refreshSessionState();
    return (result as T | null) ?? null;
  }, [client]);

  return {
    sessionState,
    isRefreshing,
    setSessionState,
    mergeSessionState,
    refreshSessionState,
  };
}
