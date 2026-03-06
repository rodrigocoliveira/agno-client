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

/**
 * Manages component and config operations
 */
export class ComponentManager {
  /**
   * Fetch components with filtering and pagination
   */
  async fetchComponents(
    endpoint: string,
    headers: Record<string, string>,
    queryParams?: ListComponentsParams,
    params?: URLSearchParams
  ): Promise<ComponentsListResponse> {
    const url = new URL(`${endpoint}/components`);

    if (queryParams) {
      if (queryParams.component_type) url.searchParams.set('component_type', queryParams.component_type);
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
      throw new Error(`Failed to fetch components: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Create a new component
   */
  async createComponent(
    endpoint: string,
    request: ComponentCreate,
    headers: Record<string, string>,
    params?: URLSearchParams
  ): Promise<ComponentResponse> {
    const url = new URL(`${endpoint}/components`);

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
      throw new Error(`Failed to create component: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get a specific component by ID
   */
  async getComponentById(
    endpoint: string,
    componentId: string,
    headers: Record<string, string>,
    params?: URLSearchParams
  ): Promise<ComponentResponse> {
    const url = new URL(`${endpoint}/components/${encodeURIComponent(componentId)}`);

    if (params) {
      params.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
    }

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      throw new Error(`Failed to get component: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Update an existing component
   */
  async updateComponent(
    endpoint: string,
    componentId: string,
    request: ComponentUpdate,
    headers: Record<string, string>,
    params?: URLSearchParams
  ): Promise<ComponentResponse> {
    const url = new URL(`${endpoint}/components/${encodeURIComponent(componentId)}`);

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
      throw new Error(`Failed to update component: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Delete a component
   */
  async deleteComponent(
    endpoint: string,
    componentId: string,
    headers: Record<string, string>,
    params?: URLSearchParams
  ): Promise<void> {
    const url = new URL(`${endpoint}/components/${encodeURIComponent(componentId)}`);

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
      throw new Error(`Failed to delete component: ${response.statusText}`);
    }
  }

  /**
   * Fetch all config versions for a component
   */
  async fetchComponentConfigs(
    endpoint: string,
    componentId: string,
    headers: Record<string, string>,
    params?: URLSearchParams
  ): Promise<ComponentConfigResponse[]> {
    const url = new URL(`${endpoint}/components/${encodeURIComponent(componentId)}/configs`);

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
      throw new Error(`Failed to fetch component configs: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Create a new config version for a component
   */
  async createComponentConfig(
    endpoint: string,
    componentId: string,
    request: ConfigCreate,
    headers: Record<string, string>,
    params?: URLSearchParams
  ): Promise<ComponentConfigResponse> {
    const url = new URL(`${endpoint}/components/${encodeURIComponent(componentId)}/configs`);

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
      throw new Error(`Failed to create component config: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get the current active config for a component
   */
  async getCurrentConfig(
    endpoint: string,
    componentId: string,
    headers: Record<string, string>,
    params?: URLSearchParams
  ): Promise<ComponentConfigResponse> {
    const url = new URL(`${endpoint}/components/${encodeURIComponent(componentId)}/configs/current`);

    if (params) {
      params.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
    }

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      throw new Error(`Failed to get current config: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get a specific config version
   */
  async getConfigByVersion(
    endpoint: string,
    componentId: string,
    version: number,
    headers: Record<string, string>,
    params?: URLSearchParams
  ): Promise<ComponentConfigResponse> {
    const url = new URL(`${endpoint}/components/${encodeURIComponent(componentId)}/configs/${version}`);

    if (params) {
      params.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
    }

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      throw new Error(`Failed to get config version: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Update a draft config version
   */
  async updateConfig(
    endpoint: string,
    componentId: string,
    version: number,
    request: ConfigUpdate,
    headers: Record<string, string>,
    params?: URLSearchParams
  ): Promise<ComponentConfigResponse> {
    const url = new URL(`${endpoint}/components/${encodeURIComponent(componentId)}/configs/${version}`);

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
      throw new Error(`Failed to update config: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Delete a draft config version
   */
  async deleteConfig(
    endpoint: string,
    componentId: string,
    version: number,
    headers: Record<string, string>,
    params?: URLSearchParams
  ): Promise<void> {
    const url = new URL(`${endpoint}/components/${encodeURIComponent(componentId)}/configs/${version}`);

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
      throw new Error(`Failed to delete config: ${response.statusText}`);
    }
  }

  /**
   * Set a config version as the current active config
   */
  async setCurrentConfig(
    endpoint: string,
    componentId: string,
    version: number,
    headers: Record<string, string>,
    params?: URLSearchParams
  ): Promise<ComponentConfigResponse> {
    const url = new URL(`${endpoint}/components/${encodeURIComponent(componentId)}/configs/${version}/set-current`);

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
      throw new Error(`Failed to set current config: ${response.statusText}`);
    }

    return await response.json();
  }
}
