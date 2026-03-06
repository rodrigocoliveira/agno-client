import type {
  ApprovalResponse,
  ApprovalResolve,
  ApprovalCountResponse,
  ApprovalStatusResponse,
  ApprovalsListResponse,
  ListApprovalsParams,
} from '@rodrigocoliveira/agno-types';

/**
 * Manages approval operations
 */
export class ApprovalManager {
  /**
   * Fetch approvals with filtering and pagination
   */
  async fetchApprovals(
    endpoint: string,
    headers: Record<string, string>,
    queryParams?: ListApprovalsParams,
    params?: URLSearchParams
  ): Promise<ApprovalsListResponse> {
    const url = new URL(`${endpoint}/approvals`);

    if (queryParams) {
      if (queryParams.status) url.searchParams.set('status', queryParams.status);
      if (queryParams.source_type) url.searchParams.set('source_type', queryParams.source_type);
      if (queryParams.approval_type) url.searchParams.set('approval_type', queryParams.approval_type);
      if (queryParams.pause_type) url.searchParams.set('pause_type', queryParams.pause_type);
      if (queryParams.agent_id) url.searchParams.set('agent_id', queryParams.agent_id);
      if (queryParams.team_id) url.searchParams.set('team_id', queryParams.team_id);
      if (queryParams.workflow_id) url.searchParams.set('workflow_id', queryParams.workflow_id);
      if (queryParams.user_id) url.searchParams.set('user_id', queryParams.user_id);
      if (queryParams.schedule_id) url.searchParams.set('schedule_id', queryParams.schedule_id);
      if (queryParams.run_id) url.searchParams.set('run_id', queryParams.run_id);
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
      throw new Error(`Failed to fetch approvals: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get approval count
   */
  async getApprovalCount(
    endpoint: string,
    headers: Record<string, string>,
    userId?: string,
    params?: URLSearchParams
  ): Promise<ApprovalCountResponse> {
    const url = new URL(`${endpoint}/approvals/count`);

    if (userId) url.searchParams.set('user_id', userId);

    if (params) {
      params.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
    }

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      throw new Error(`Failed to get approval count: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get approval status
   */
  async getApprovalStatus(
    endpoint: string,
    approvalId: string,
    headers: Record<string, string>,
    params?: URLSearchParams
  ): Promise<ApprovalStatusResponse> {
    const url = new URL(`${endpoint}/approvals/${encodeURIComponent(approvalId)}/status`);

    if (params) {
      params.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
    }

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      throw new Error(`Failed to get approval status: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get a specific approval by ID
   */
  async getApprovalById(
    endpoint: string,
    approvalId: string,
    headers: Record<string, string>,
    params?: URLSearchParams
  ): Promise<ApprovalResponse> {
    const url = new URL(`${endpoint}/approvals/${encodeURIComponent(approvalId)}`);

    if (params) {
      params.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
    }

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      throw new Error(`Failed to get approval: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Resolve an approval (approve or reject)
   */
  async resolveApproval(
    endpoint: string,
    approvalId: string,
    request: ApprovalResolve,
    headers: Record<string, string>,
    params?: URLSearchParams
  ): Promise<ApprovalResponse> {
    const url = new URL(`${endpoint}/approvals/${encodeURIComponent(approvalId)}/resolve`);

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
      throw new Error(`Failed to resolve approval: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Delete an approval
   */
  async deleteApproval(
    endpoint: string,
    approvalId: string,
    headers: Record<string, string>,
    params?: URLSearchParams
  ): Promise<void> {
    const url = new URL(`${endpoint}/approvals/${encodeURIComponent(approvalId)}`);

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
      throw new Error(`Failed to delete approval: ${response.statusText}`);
    }
  }
}
