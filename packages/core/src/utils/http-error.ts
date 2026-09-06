/**
 * Build an `Error` for a non-OK HTTP response, using the backend's own `detail`/`message`
 * when the body is JSON (`application/json`, `application/problem+json`, ...). The status
 * code is attached as `.status` for 401 token-refresh and 429/409 job-queue detection.
 */
export async function httpError(response: Response, fallback: string): Promise<Error & { status: number }> {
  let message = fallback;
  if (response.headers.get('content-type')?.includes('json')) {
    try {
      const data = await response.json();
      if (typeof data?.detail === 'string') message = data.detail;
      else if (typeof data?.message === 'string') message = data.message;
    } catch {
      // keep the fallback
    }
  }
  return Object.assign(new Error(message), { status: response.status });
}
