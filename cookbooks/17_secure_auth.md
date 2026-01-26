# Secure Authentication with Dynamic Tokens

This cookbook covers best practices for securing authentication tokens in browser-based applications.

## The Problem

When using the Agno client in a browser, the `Authorization: Bearer <token>` header is visible in the browser's DevTools Network tab. If a malicious script or browser extension captures this token, it could be used to make unauthorized API calls.

## The Solution: Short-Lived Tokens + Auto-Refresh

The recommended approach is:

1. **Use short-lived tokens** (5-15 minutes expiry)
2. **Configure `onTokenExpired` callback** for automatic refresh
3. **Backend generates tokens** per user (not a shared secret)

This minimizes the risk: even if a token is captured, it expires quickly.

## How It Works

```
User sends message → Token expired? → onTokenExpired() called
                                    → You refresh the token
                                    → Library retries the request
                                    → Success! User doesn't see the error
```

## Configuration

### Basic Setup

```typescript
import { AgnoProvider } from '@rodrigocoliveira/agno-react';

function App() {
  return (
    <AgnoProvider
      config={{
        endpoint: 'http://localhost:7777',
        authToken: initialToken,  // Initial token from your backend
        agentId: 'your-agent-id',
        mode: 'agent',

        // Called when a request receives 401 Unauthorized
        onTokenExpired: async () => {
          // Fetch a new token from your backend
          const response = await fetch('/api/refresh-token');
          const { token } = await response.json();
          return token;  // Return the new token
        },
      }}
    >
      <ChatComponent />
    </AgnoProvider>
  );
}
```

### With Laravel Inertia

If you're using Laravel with Inertia.js, you can leverage Inertia's partial reloads:

```typescript
import { router, usePage } from '@inertiajs/react';
import { AgnoProvider, useAgnoActions } from '@rodrigocoliveira/agno-react';

function ChatPage() {
  const { agnoToken } = usePage().props;

  return (
    <AgnoProvider
      config={{
        endpoint: import.meta.env.VITE_AGNO_ENDPOINT,
        authToken: agnoToken,
        agentId: 'your-agent-id',
        mode: 'agent',

        onTokenExpired: async () => {
          // Inertia fetches fresh token from Laravel
          await router.reload({ only: ['agnoToken'] });
          // Return the new token from updated props
          return usePage().props.agnoToken as string;
        },
      }}
    >
      <ChatContent />
    </AgnoProvider>
  );
}

// Optional: Sync token when Inertia updates props proactively
function ChatContent() {
  const { agnoToken } = usePage().props;
  const { updateConfig } = useAgnoActions();

  useEffect(() => {
    updateConfig({ authToken: agnoToken as string });
  }, [agnoToken, updateConfig]);

  return <YourChatUI />;
}
```

## Backend Examples

### Laravel: Generating Short-Lived JWTs

```php
// app/Http/Middleware/HandleInertiaRequests.php
use Firebase\JWT\JWT;

public function share(Request $request): array
{
    return array_merge(parent::share($request), [
        'agnoToken' => fn () => $this->generateAgnoToken($request->user()),
    ]);
}

private function generateAgnoToken(?User $user): ?string
{
    if (!$user) {
        return null;
    }

    return JWT::encode([
        'sub' => $user->id,
        'name' => $user->name,
        'email' => $user->email,
        'exp' => now()->addMinutes(15)->timestamp,  // 15 minute expiry
        'iat' => now()->timestamp,
    ], config('services.agno.jwt_secret'), 'HS256');
}
```

```php
// config/services.php
'agno' => [
    'endpoint' => env('AGNO_ENDPOINT', 'http://localhost:7777'),
    'jwt_secret' => env('AGNO_JWT_SECRET'),
],
```

### Express/Node.js: Token Refresh Endpoint

```typescript
import jwt from 'jsonwebtoken';
import express from 'express';

const app = express();

// Requires authentication middleware
app.get('/api/refresh-token', authMiddleware, (req, res) => {
  const token = jwt.sign(
    {
      sub: req.user.id,
      name: req.user.name,
      email: req.user.email,
    },
    process.env.AGNO_JWT_SECRET,
    { expiresIn: '15m' }
  );

  res.json({ token });
});
```

## Callback Behavior

The `onTokenExpired` callback:

1. Is called **after** a request fails with `401 Unauthorized`
2. Should return the new token as a string
3. If it returns `null` or `undefined`, the original error is propagated
4. If it throws an error, the original 401 error is propagated
5. After returning a new token, the **failed request is automatically retried**

## Supported Methods

All API methods support automatic token refresh:

| Method | Description |
|--------|-------------|
| `sendMessage()` | Streaming chat messages |
| `continueRun()` | HITL tool execution |
| `loadSession()` | Load session history |
| `fetchSessions()` | List all sessions |
| `deleteSession()` | Delete a session |
| `fetchAgents()` | List available agents |
| `fetchTeams()` | List available teams |

## Best Practices

### 1. Keep Tokens Short-Lived

```php
// Good: 15 minute expiry
'exp' => now()->addMinutes(15)->timestamp,

// Avoid: Long-lived tokens
'exp' => now()->addDays(30)->timestamp,  // Too long!
```

### 2. Include User Context in Token

```php
JWT::encode([
    'sub' => $user->id,      // User identifier
    'name' => $user->name,   // For display
    'roles' => $user->roles, // For authorization
    // ...
], $secret, 'HS256');
```

### 3. Validate on Backend

Your Agno backend should validate the JWT:
- Check signature using shared secret
- Verify `exp` hasn't passed
- Validate user has permission for the requested agent/team

### 4. Handle Refresh Failures Gracefully

```typescript
onTokenExpired: async () => {
  try {
    const response = await fetch('/api/refresh-token');
    if (!response.ok) {
      // Session expired, redirect to login
      window.location.href = '/login';
      return null;
    }
    const { token } = await response.json();
    return token;
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Could show a "Session expired" modal here
    return null;
  }
},
```

## Security Considerations

| Risk | Mitigation |
|------|------------|
| Token visible in Network tab | Use short expiry (15min) |
| XSS attack steals token | Sanitize inputs, use CSP headers |
| Token replay attack | Short expiry + include `iat` claim |
| Man-in-the-middle | Always use HTTPS in production |

## Alternative: Backend Proxy

For maximum security, you can proxy all requests through your backend:

```
Browser → Your Backend → Agno
         (adds token)
```

This keeps the token entirely server-side. See the Vite proxy example in `16_production_tips.md`.

## Troubleshooting

### Token Not Refreshing

1. Check that `onTokenExpired` is defined in your config
2. Verify the callback returns a string (not an object)
3. Check browser console for errors in your refresh logic

### Infinite Refresh Loop

If refresh keeps failing, the library will propagate the error (not loop). Check:
1. Your refresh endpoint is returning valid tokens
2. The new token has a future `exp` timestamp
3. Your backend accepts the new token

### Request Still Fails After Refresh

The retry uses the new token from `onTokenExpired`. If it still fails:
1. Log the new token and verify it's valid
2. Check that your backend validates the token correctly
3. Ensure the `exp` claim is in the future
