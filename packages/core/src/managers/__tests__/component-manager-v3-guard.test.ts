import { afterEach, describe, expect, test } from 'bun:test';
import { ComponentManager } from '../component-manager';

/**
 * Regression tests for Agno v3's component write-guard (compare-and-set) and
 * restore support — verified against `agno==3.0.6` source
 * (`os/routers/components/components.py`, `os/schema.py`):
 *  - `POST /components/{id}/restore` is a new endpoint.
 *  - `DELETE /components/{id}` and `.../set-current` accept an optional
 *    `{ guard }` JSON body (`ComponentGuard { latest_version?, current_version? }`).
 *  - A 409 conflict's JSON `detail` should surface as the thrown error message,
 *    not the generic `statusText`.
 */

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('ComponentManager — Agno v3 restore + guard', () => {
  test('restoreComponent POSTs to /components/{id}/restore with no body', async () => {
    let capturedUrl = '';
    let capturedInit: RequestInit | undefined;
    global.fetch = (async (url: string, init?: RequestInit) => {
      capturedUrl = url;
      capturedInit = init;
      return jsonResponse({ component_id: 'c1', component_type: 'agent', created_at: 0 });
    }) as typeof fetch;

    const manager = new ComponentManager();
    const result = await manager.restoreComponent('http://x', 'c1', {});

    expect(capturedUrl).toBe('http://x/components/c1/restore');
    expect(capturedInit?.method).toBe('POST');
    expect(capturedInit?.body).toBeUndefined();
    expect(result.component_id).toBe('c1');
  });

  test('deleteComponent sends no body when no guard is given (bodyless DELETE keeps working)', async () => {
    let capturedInit: RequestInit | undefined;
    global.fetch = (async (_url: string, init?: RequestInit) => {
      capturedInit = init;
      return new Response(null, { status: 204 });
    }) as typeof fetch;

    const manager = new ComponentManager();
    await manager.deleteComponent('http://x', 'c1', {});

    expect(capturedInit?.method).toBe('DELETE');
    expect(capturedInit?.body).toBeUndefined();
  });

  test('deleteComponent sends { guard } as JSON body when a guard is given', async () => {
    let capturedInit: RequestInit | undefined;
    global.fetch = (async (_url: string, init?: RequestInit) => {
      capturedInit = init;
      return new Response(null, { status: 204 });
    }) as typeof fetch;

    const manager = new ComponentManager();
    await manager.deleteComponent('http://x', 'c1', {}, undefined, { current_version: 3 });

    expect(JSON.parse(capturedInit?.body as string)).toEqual({ guard: { current_version: 3 } });
    expect((capturedInit?.headers as Record<string, string>)['Content-Type']).toBe('application/json');
  });

  test('deleteComponent surfaces the 409 conflict detail instead of a generic message', async () => {
    global.fetch = (async () => jsonResponse({ detail: 'expected current_version 3, got 4' }, 409)) as typeof fetch;

    const manager = new ComponentManager();
    await expect(
      manager.deleteComponent('http://x', 'c1', {}, undefined, { current_version: 3 })
    ).rejects.toThrow('expected current_version 3, got 4');
  });

  test('setCurrentConfig sends { guard } as JSON body when a guard is given, none otherwise', async () => {
    let capturedInit: RequestInit | undefined;
    global.fetch = (async (_url: string, init?: RequestInit) => {
      capturedInit = init;
      return jsonResponse({ component_id: 'c1', version: 2, stage: 'published', config: {}, created_at: 0 });
    }) as typeof fetch;

    const manager = new ComponentManager();
    await manager.setCurrentConfig('http://x', 'c1', 2, {});
    expect(capturedInit?.body).toBeUndefined();

    await manager.setCurrentConfig('http://x', 'c1', 2, {}, undefined, { current_version: 1 });
    expect(JSON.parse(capturedInit?.body as string)).toEqual({ guard: { current_version: 1 } });
  });
});
