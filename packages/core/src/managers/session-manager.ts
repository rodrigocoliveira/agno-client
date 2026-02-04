import type {
  SessionEntry,
  SessionsListResponse,
  ChatMessage,
  ImageData,
  AudioData,
  UserFileAttachment,
  RunSchema,
  TeamRunSchema,
  ToolCall,
  AgentSessionDetailSchema,
  TeamSessionDetailSchema,
  CreateSessionRequest,
  UpdateSessionRequest,
} from '@rodrigocoliveira/agno-types';

/**
 * Manages session operations
 */
export class SessionManager {
  /**
   * Fetch all sessions for an entity
   */
  async fetchSessions(
    endpoint: string,
    entityType: 'agent' | 'team',
    entityId: string,
    dbId: string,
    headers: Record<string, string>,
    params?: URLSearchParams
  ): Promise<SessionEntry[]> {
    const url = new URL(`${endpoint}/sessions`);
    url.searchParams.set('type', entityType);
    url.searchParams.set('component_id', entityId);
    url.searchParams.set('db_id', dbId);

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
      throw new Error(`Failed to fetch sessions: ${response.statusText}`);
    }

    const data: SessionsListResponse = await response.json();
    return data.data ?? [];
  }

  /**
   * Fetch a specific session's runs
   * Returns an array of RunSchema directly (not wrapped in { data, meta })
   */
  async fetchSession(
    endpoint: string,
    entityType: 'agent' | 'team',
    sessionId: string,
    dbId: string,
    headers: Record<string, string>,
    userId?: string,
    params?: URLSearchParams
  ): Promise<Array<RunSchema | TeamRunSchema>> {
    const url = new URL(`${endpoint}/sessions/${sessionId}/runs`);
    url.searchParams.set('type', entityType);
    if (dbId) {
      url.searchParams.set('db_id', dbId);
    }
    if (userId) {
      url.searchParams.set('user_id', userId);
    }

    // Merge additional params if provided
    if (params) {
      params.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
    }

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      throw new Error(`Failed to fetch session: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Delete a session
   */
  async deleteSession(
    endpoint: string,
    sessionId: string,
    dbId: string,
    headers: Record<string, string>,
    params?: URLSearchParams
  ): Promise<void> {
    const url = new URL(`${endpoint}/sessions/${sessionId}`);
    if (dbId) {
      url.searchParams.set('db_id', dbId);
    }

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
      throw new Error(`Failed to delete session: ${response.statusText}`);
    }
  }

  /**
   * Get a session by ID
   */
  async getSessionById(
    endpoint: string,
    entityType: 'agent' | 'team',
    sessionId: string,
    dbId: string,
    headers: Record<string, string>,
    userId?: string,
    params?: URLSearchParams
  ): Promise<AgentSessionDetailSchema | TeamSessionDetailSchema> {
    const url = new URL(`${endpoint}/sessions/${sessionId}`);
    url.searchParams.set('type', entityType);
    if (dbId) {
      url.searchParams.set('db_id', dbId);
    }
    if (userId) {
      url.searchParams.set('user_id', userId);
    }

    // Merge additional params if provided
    if (params) {
      params.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
    }

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      throw new Error(`Failed to get session: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get a run by ID
   */
  async getRunById(
    endpoint: string,
    entityType: 'agent' | 'team',
    sessionId: string,
    runId: string,
    dbId: string,
    headers: Record<string, string>,
    userId?: string,
    params?: URLSearchParams
  ): Promise<RunSchema | TeamRunSchema> {
    const url = new URL(`${endpoint}/sessions/${sessionId}/runs/${runId}`);
    url.searchParams.set('type', entityType);
    if (dbId) {
      url.searchParams.set('db_id', dbId);
    }
    if (userId) {
      url.searchParams.set('user_id', userId);
    }

    // Merge additional params if provided
    if (params) {
      params.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
    }

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      throw new Error(`Failed to get run: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Create a new session
   */
  async createSession(
    endpoint: string,
    entityType: 'agent' | 'team',
    request: CreateSessionRequest,
    dbId: string,
    headers: Record<string, string>,
    params?: URLSearchParams
  ): Promise<AgentSessionDetailSchema | TeamSessionDetailSchema> {
    const url = new URL(`${endpoint}/sessions`);
    url.searchParams.set('type', entityType);
    if (dbId) {
      url.searchParams.set('db_id', dbId);
    }

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
      throw new Error(`Failed to create session: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Update a session
   */
  async updateSession(
    endpoint: string,
    entityType: 'agent' | 'team',
    sessionId: string,
    request: UpdateSessionRequest,
    dbId: string,
    headers: Record<string, string>,
    userId?: string,
    params?: URLSearchParams
  ): Promise<AgentSessionDetailSchema | TeamSessionDetailSchema> {
    const url = new URL(`${endpoint}/sessions/${sessionId}`);
    url.searchParams.set('type', entityType);
    if (dbId) {
      url.searchParams.set('db_id', dbId);
    }
    if (userId) {
      url.searchParams.set('user_id', userId);
    }

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
      throw new Error(`Failed to update session: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Rename a session
   */
  async renameSession(
    endpoint: string,
    entityType: 'agent' | 'team',
    sessionId: string,
    newName: string,
    dbId: string,
    headers: Record<string, string>,
    params?: URLSearchParams
  ): Promise<AgentSessionDetailSchema | TeamSessionDetailSchema> {
    const url = new URL(`${endpoint}/sessions/${sessionId}/rename`);
    url.searchParams.set('type', entityType);
    if (dbId) {
      url.searchParams.set('db_id', dbId);
    }

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
      body: JSON.stringify({ session_name: newName }),
    });

    if (!response.ok) {
      throw new Error(`Failed to rename session: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Delete multiple sessions
   */
  async deleteMultipleSessions(
    endpoint: string,
    sessionIds: string[],
    sessionTypes: Array<'agent' | 'team'>,
    dbId: string,
    headers: Record<string, string>,
    params?: URLSearchParams
  ): Promise<void> {
    const url = new URL(`${endpoint}/sessions`);
    if (dbId) {
      url.searchParams.set('db_id', dbId);
    }

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
      body: JSON.stringify({
        session_ids: sessionIds,
        session_types: sessionTypes,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete sessions: ${response.statusText}`);
    }
  }

  /**
   * Convert session runs array to chat messages.
   * Filters out child runs (those with parent_run_id) to prevent
   * internal team member communications from appearing as user messages.
   */
  convertSessionToMessages(
    runs: Array<RunSchema | TeamRunSchema>
  ): ChatMessage[] {
    // Filter to only root-level runs (no parent = user-initiated)
    // Child runs have parent_run_id set and represent internal team member work
    const rootRuns = runs.filter(run => !run.parent_run_id);
    const messages = this.convertRunsToMessages(rootRuns);
    return messages;
  }

  /**
   * Convert RunSchema[] to ChatMessage[]
   * Each run represents a user input + agent response pair
   */
  private convertRunsToMessages(
    runs: Array<RunSchema | TeamRunSchema>
  ): ChatMessage[] {
    const messages: ChatMessage[] = [];

    for (const run of runs) {
      // Parse created_at timestamp
      const timestamp = run.created_at
        ? new Date(run.created_at).getTime() / 1000
        : Math.floor(Date.now() / 1000);

      // Add user message (from run_input)
      if (run.run_input) {
        // Extract user-uploaded media from input_media
        const userImages: ImageData[] = [];
        const userAudio: AudioData[] = [];
        const userFiles: UserFileAttachment[] = [];

        if (run.input_media && typeof run.input_media === 'object') {
          const media = run.input_media as Record<string, unknown>;

          // Parse images from input_media
          // API returns: { id, format, mime_type, content (base64) }
          if (Array.isArray(media.images)) {
            for (const img of media.images) {
              const imgObj = img as Record<string, unknown>;
              let url = imgObj.url as string | undefined;
              // Construct data URL from base64 content if no URL provided
              if (!url && imgObj.content) {
                const mimeType = (imgObj.mime_type as string) || `image/${imgObj.format || 'png'}`;
                url = `data:${mimeType};base64,${imgObj.content}`;
              }
              if (url) {
                userImages.push({
                  url,
                  revised_prompt: (imgObj.original_name as string) || 'Uploaded image',
                });
              }
            }
          }

          // Parse audio from input_media
          // API returns: { id, format, mime_type, content (base64) }
          if (Array.isArray(media.audio)) {
            for (const aud of media.audio) {
              const audObj = aud as Record<string, unknown>;
              let url = audObj.url as string | undefined;
              if (!url && audObj.content) {
                const mimeType = (audObj.mime_type as string) || `audio/${audObj.format || 'wav'}`;
                url = `data:${mimeType};base64,${audObj.content}`;
              }
              if (url) {
                userAudio.push({
                  url,
                  mime_type: (audObj.mime_type as string) || undefined,
                });
              }
            }
          }

          // Parse files from input_media
          if (Array.isArray(media.files)) {
            for (const file of media.files) {
              const fileObj = file as Record<string, unknown>;
              let url = fileObj.url as string | undefined;
              if (!url && fileObj.content) {
                const mimeType = (fileObj.mime_type as string) || (fileObj.content_type as string) || 'application/octet-stream';
                url = `data:${mimeType};base64,${fileObj.content}`;
              }
              userFiles.push({
                name: (fileObj.original_name as string) || (fileObj.name as string) || 'file',
                type: (fileObj.content_type as string) || (fileObj.mime_type as string) || '',
                url,
                size: (fileObj.size as number) || undefined,
              });
            }
          }
        }

        messages.push({
          role: 'user',
          content: run.run_input,
          created_at: timestamp,
          ...(userImages.length > 0 ? { images: userImages } : {}),
          ...(userAudio.length > 0 ? { audio: userAudio } : {}),
          ...(userFiles.length > 0 ? { files: userFiles } : {}),
        });
      }

      // Extract tool calls from tools array
      const toolCalls: ToolCall[] = [];

      if (run.tools && Array.isArray(run.tools)) {
        for (const tool of run.tools) {
          const toolObj = tool as Record<string, unknown>;
          const toolCall = {
            role: 'tool' as const,
            content: (toolObj.content as string) ?? '',
            tool_call_id: (toolObj.tool_call_id as string) ?? '',
            tool_name: (toolObj.tool_name as string) ?? '',
            tool_args: (toolObj.tool_args as Record<string, string>) ?? {},
            tool_call_error: (toolObj.tool_call_error as boolean) ?? false,
            metrics: (toolObj.metrics as { time: number }) ?? { time: 0 },
            created_at: timestamp,
          };

          toolCalls.push(toolCall);
        }
      }

      // Extract additional tool calls from reasoning_messages
      if (run.reasoning_messages && Array.isArray(run.reasoning_messages)) {
        for (const msg of run.reasoning_messages) {
          const reasoningMsg = msg as Record<string, unknown>;
          if (reasoningMsg.role === 'tool') {
            toolCalls.push({
              role: 'tool',
              content: (reasoningMsg.content as string) ?? '',
              tool_call_id: (reasoningMsg.tool_call_id as string) ?? '',
              tool_name: (reasoningMsg.tool_name as string) ?? '',
              tool_args: (reasoningMsg.tool_args as Record<string, string>) ?? {},
              tool_call_error: (reasoningMsg.tool_call_error as boolean) ?? false,
              metrics: (reasoningMsg.metrics as { time: number }) ?? { time: 0 },
              created_at: (reasoningMsg.created_at as number) ?? timestamp,
            });
          }
        }
      }

      // Convert content to string if it's an object
      let contentStr = '';
      if (typeof run.content === 'string') {
        contentStr = run.content;
      } else if (run.content && typeof run.content === 'object') {
        contentStr = JSON.stringify(run.content);
      }

      // Build extra_data if there's any reasoning/reference content
      // Cast to any to avoid type issues with generic Record<string, unknown> from API
      const extraData =
        run.reasoning_messages || run.reasoning_steps || run.references
          ? ({
              reasoning_messages: run.reasoning_messages,
              reasoning_steps: run.reasoning_steps,
              references: run.references,
            } as any)
          : undefined;

      // Add agent response message
      messages.push({
        role: 'agent',
        content: contentStr,
        tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
        extra_data: extraData,
        images: run.images as any,
        videos: run.videos as any,
        audio: run.audio as any,
        response_audio: run.response_audio as any,
        created_at: timestamp + 1, // Agent response is slightly after user message
      });
    }

    return messages;
  }
}
