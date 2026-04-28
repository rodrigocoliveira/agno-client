import { useState, useEffect, useCallback } from 'react';
import type {
  ComponentResponse,
  ComponentCreate,
  ComponentUpdate,
  ComponentConfigResponse,
  ConfigCreate,
  ConfigUpdate,
  ComponentsListResponse,
  ListComponentsParams,
} from '@rodrigocoliveira/agno-types';
import { useAgnoClient } from '../context/AgnoContext';

/**
 * Hook for AgentOS Studio components (DB-stored agents/teams/workflows).
 *
 * Covers both component CRUD and config versioning. Components live in the
 * AgentOS database and represent agents/teams/workflows that can be created,
 * edited, and published without code changes.
 *
 * Note: the Agno `/components` endpoint has no native filter by `user_id`.
 * For per-user scoping, either store `user_id` in `metadata` and filter
 * client-side, or extend your backend and pass `params: { user_id }` through.
 */
export function useAgnoComponents() {
  const client = useAgnoClient();
  const [components, setComponents] = useState<ComponentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    const handleComponentCreated = (component: ComponentResponse) => {
      setComponents((prev) => [component, ...prev]);
    };

    const handleComponentUpdated = (component: ComponentResponse) => {
      setComponents((prev) =>
        prev.map((c) => (c.component_id === component.component_id ? component : c))
      );
    };

    const handleComponentDeleted = ({ componentId }: { componentId: string }) => {
      setComponents((prev) => prev.filter((c) => c.component_id !== componentId));
    };

    const handleStateChange = () => {
      setComponents(client.getState().components);
    };

    client.on('component:created', handleComponentCreated);
    client.on('component:updated', handleComponentUpdated);
    client.on('component:deleted', handleComponentDeleted);
    client.on('state:change', handleStateChange);

    setComponents(client.getState().components);

    return () => {
      client.off('component:created', handleComponentCreated);
      client.off('component:updated', handleComponentUpdated);
      client.off('component:deleted', handleComponentDeleted);
      client.off('state:change', handleStateChange);
    };
  }, [client]);

  const fetchComponents = useCallback(
    async (
      queryParams?: ListComponentsParams,
      options?: { params?: Record<string, string> }
    ): Promise<ComponentsListResponse> => {
      setIsLoading(true);
      setError(undefined);
      try {
        const response = await client.fetchComponents(queryParams, options);
        setComponents(response.data);
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

  const getComponentById = useCallback(
    async (
      componentId: string,
      options?: { params?: Record<string, string> }
    ): Promise<ComponentResponse> => {
      setIsLoading(true);
      setError(undefined);
      try {
        return await client.getComponentById(componentId, options);
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

  const createComponent = useCallback(
    async (
      request: ComponentCreate,
      options?: { params?: Record<string, string> }
    ): Promise<ComponentResponse> => {
      setIsLoading(true);
      setError(undefined);
      try {
        return await client.createComponent(request, options);
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

  const updateComponent = useCallback(
    async (
      componentId: string,
      request: ComponentUpdate,
      options?: { params?: Record<string, string> }
    ): Promise<ComponentResponse> => {
      setIsLoading(true);
      setError(undefined);
      try {
        return await client.updateComponent(componentId, request, options);
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

  const deleteComponent = useCallback(
    async (
      componentId: string,
      options?: { params?: Record<string, string> }
    ): Promise<void> => {
      setIsLoading(true);
      setError(undefined);
      try {
        await client.deleteComponent(componentId, options);
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

  const fetchComponentConfigs = useCallback(
    async (
      componentId: string,
      options?: { params?: Record<string, string> }
    ): Promise<ComponentConfigResponse[]> => {
      setIsLoading(true);
      setError(undefined);
      try {
        return await client.fetchComponentConfigs(componentId, options);
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

  const createComponentConfig = useCallback(
    async (
      componentId: string,
      request: ConfigCreate,
      options?: { params?: Record<string, string> }
    ): Promise<ComponentConfigResponse> => {
      setIsLoading(true);
      setError(undefined);
      try {
        return await client.createComponentConfig(componentId, request, options);
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

  const getCurrentComponentConfig = useCallback(
    async (
      componentId: string,
      options?: { params?: Record<string, string> }
    ): Promise<ComponentConfigResponse> => {
      setIsLoading(true);
      setError(undefined);
      try {
        return await client.getCurrentComponentConfig(componentId, options);
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

  const getComponentConfigByVersion = useCallback(
    async (
      componentId: string,
      version: number,
      options?: { params?: Record<string, string> }
    ): Promise<ComponentConfigResponse> => {
      setIsLoading(true);
      setError(undefined);
      try {
        return await client.getComponentConfigByVersion(componentId, version, options);
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

  const updateComponentConfig = useCallback(
    async (
      componentId: string,
      version: number,
      request: ConfigUpdate,
      options?: { params?: Record<string, string> }
    ): Promise<ComponentConfigResponse> => {
      setIsLoading(true);
      setError(undefined);
      try {
        return await client.updateComponentConfig(componentId, version, request, options);
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

  const deleteComponentConfig = useCallback(
    async (
      componentId: string,
      version: number,
      options?: { params?: Record<string, string> }
    ): Promise<void> => {
      setIsLoading(true);
      setError(undefined);
      try {
        await client.deleteComponentConfig(componentId, version, options);
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

  const setCurrentComponentConfig = useCallback(
    async (
      componentId: string,
      version: number,
      options?: { params?: Record<string, string> }
    ): Promise<ComponentConfigResponse> => {
      setIsLoading(true);
      setError(undefined);
      try {
        return await client.setCurrentComponentConfig(componentId, version, options);
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
    components,
    isLoading,
    error,
    fetchComponents,
    getComponentById,
    createComponent,
    updateComponent,
    deleteComponent,
    fetchComponentConfigs,
    createComponentConfig,
    getCurrentComponentConfig,
    getComponentConfigByVersion,
    updateComponentConfig,
    deleteComponentConfig,
    setCurrentComponentConfig,
  };
}
