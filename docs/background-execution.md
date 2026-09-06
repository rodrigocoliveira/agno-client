# Background Execution + Resume

`agno-client` supports server-backed background runs so streaming responses
survive page reloads. The server is the source of truth — there's no
client-side state persistence to set up.

## When to use it

Turn it on per-call (or globally via config) when:

- The user might reload the page mid-response (long-form generation, slow tool calls).
- The route is embedded somewhere mid-flight navigation is expected.
- The run produces durable side effects you don't want to lose if the browser disconnects.

For short, fast responses, the foreground streaming default is fine.

## How to enable it

### Per-call

```ts
await client.sendMessage('Generate a report', { background: true });
```

### Globally

```ts
const client = new AgnoClient({
  endpoint: 'http://localhost:7777',
  agentId: 'support-bot',
  background: true,
});
```

Per-call options always override the config default.

## What happens on reload

1. The user reloads (or navigates away and back).
2. The consumer calls `loadSession(sessionId)`.
3. The lib fetches `/sessions/{id}/runs`. If any run has `status === "RUNNING"`,
   the lib fires `resumeRun({ runId, sessionId })` fire-and-forget.
4. `resumeRun` opens `POST /agents/{id}/runs/{runId}/resume` (SSE).
5. The server replays buffered events (`catch_up` / `replay` meta first, then real run events).
   If the run is still active, streaming continues live after catch-up.
6. The agent message in the UI fills in continuously — no banner, no extra click needed.

## Events you can observe

If you want to surface a "reconnecting…" indicator or handle failures, listen on the `AgnoClient`:

| Event | Payload | When |
|---|---|---|
| `run:resume:start` | `{ runId, sessionId }` | A `resumeRun` call has started |
| `run:resume:meta` | `{ type: 'catch_up' \| 'replay' \| 'subscribed', runId }` | Server meta event before / between replay batches |
| `run:resume:end` | `{ runId }` | Resume stream completed normally |
| `run:resume:error` | `{ runId, message }` | `/resume` returned an error (run not found, buffer expired, network) |

## Manual resume

If you ever need to resume by hand (e.g., a custom retry flow):

```ts
await client.resumeRun({ runId, sessionId });
```

This is the same call auto-resume uses. The behavior depends on what's
currently streaming:

- If a stream is already in flight for the **same** `runId`, the call is a no-op.
- If a **different** run is currently streaming, `resumeRun` throws an
  `Error('Already streaming a different run')`. Catch this if you call
  `resumeRun` outside of the auto-resume path.

## Teams

Teams support `/resume` too. Auto-resume works in both `mode: 'agent'` and `mode: 'team'`.
(HITL `/continue` now works for teams as well, as of Agno v3 — see `docs/frontend-tools.md`.)

## What this does NOT do

- It does **not** persist run state in `localStorage`. The server already buffers events.
- It does **not** show a default reconnect UI. Listen to `run:resume:*` events if you want one.
- It does **not** track `event_index` client-side. Full-replay is sufficient.
