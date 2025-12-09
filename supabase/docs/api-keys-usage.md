# API Keys Usage Guide

This guide explains how to use the API key functionality added to the database.

## Overview

The API key system provides secure authentication for programmatic access to your application. Keys are:
- Securely hashed using SHA-256 before storage
- Never stored in plain text
- Only shown once upon creation
- Scoped with specific permissions
- Optionally time-limited with expiration dates

## Database Schema

### Table: `api_keys`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Foreign key to auth.users |
| `name` | text | Friendly name for the key |
| `key_hash` | text | SHA-256 hash of the API key |
| `key_prefix` | text | First 16 characters for display |
| `scopes` | jsonb | Array of permission scopes |
| `is_active` | boolean | Whether the key is active |
| `expires_at` | timestamp | Optional expiration date |
| `last_used_at` | timestamp | Last time key was used |
| `created_at` | timestamp | Creation timestamp |
| `updated_at` | timestamp | Last update timestamp |

## Functions

### 1. Generate API Key

Creates a new API key for a user.

```sql
SELECT generate_api_key(
    p_user_id := auth.uid(),
    p_name := 'My API Key',
    p_scopes := '["read", "write"]'::jsonb,
    p_expires_at := now() + interval '90 days'  -- Optional
);
```

**Returns:**
```json
{
  "id": "uuid-of-key",
  "api_key": "sk_live_abc123...",
  "key_prefix": "sk_live_abc12345",
  "name": "My API Key",
  "scopes": ["read", "write"],
  "expires_at": "2025-03-09T12:00:00Z",
  "warning": "Store this API key securely. It will not be shown again."
}
```

**⚠️ Important:** The `api_key` value is only returned once. Store it securely.

### 2. Validate API Key

Validates an API key and returns user information and scopes.

```sql
SELECT * FROM validate_api_key('sk_live_abc123...');
```

**Returns:**
| Column | Type | Description |
|--------|------|-------------|
| `user_id` | uuid | ID of the key owner |
| `api_key_id` | uuid | ID of the API key |
| `scopes` | jsonb | Permission scopes |
| `is_valid` | boolean | Whether key is valid and active |

### 3. Revoke API Key

Deactivates an API key.

```sql
SELECT revoke_api_key(
    p_api_key_id := 'uuid-of-key',
    p_user_id := auth.uid()
);
```

**Returns:** `true` if successful, `false` otherwise.

## Usage Examples

### Client-Side (TypeScript/JavaScript)

#### Creating an API Key

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createApiKey(name: string, scopes: string[], expiresInDays?: number) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { data, error } = await supabase.rpc('generate_api_key', {
    p_user_id: user.id,
    p_name: name,
    p_scopes: scopes,
    p_expires_at: expiresAt
  });

  if (error) throw error;

  // ⚠️ IMPORTANT: Save this API key now! It won't be shown again.
  console.warn(data.warning);

  return data;
}

// Example usage
const result = await createApiKey('Production API', ['read', 'write'], 90);
console.log('Your API key:', result.api_key);
// Store this securely!
```

#### Listing API Keys

```typescript
async function listApiKeys() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('api_keys')
    .select('id, name, key_prefix, scopes, is_active, expires_at, last_used_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data;
}
```

#### Revoking an API Key

```typescript
async function revokeApiKey(apiKeyId: string) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase.rpc('revoke_api_key', {
    p_api_key_id: apiKeyId,
    p_user_id: user.id
  });

  if (error) throw error;

  return data; // true if successful
}
```

### Server-Side (Edge Function / Backend)

#### Validating an API Key

```typescript
// In a Supabase Edge Function or backend API
import { createClient } from '@supabase/supabase-js';

async function authenticateRequest(apiKey: string) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data, error } = await supabase.rpc('validate_api_key', {
    p_api_key: apiKey
  });

  if (error || !data || data.length === 0) {
    throw new Error('Invalid API key');
  }

  const [result] = data;

  if (!result.is_valid) {
    throw new Error('API key is inactive or expired');
  }

  return {
    userId: result.user_id,
    apiKeyId: result.api_key_id,
    scopes: result.scopes
  };
}

// Example usage in an API endpoint
Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const apiKey = authHeader.substring(7); // Remove 'Bearer '

  try {
    const auth = await authenticateRequest(apiKey);

    // Check scopes
    if (!auth.scopes.includes('read')) {
      return new Response('Insufficient permissions', { status: 403 });
    }

    // Proceed with authenticated request
    return new Response(JSON.stringify({
      message: 'Success',
      userId: auth.userId
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(error.message, { status: 401 });
  }
});
```

## Security Best Practices

1. **Never log API keys** - Avoid logging keys in application logs or error messages
2. **Use HTTPS only** - Always transmit API keys over secure connections
3. **Rotate keys regularly** - Create new keys and revoke old ones periodically
4. **Use appropriate scopes** - Grant minimal necessary permissions
5. **Set expiration dates** - Use time-limited keys where appropriate
6. **Monitor usage** - Check `last_used_at` for suspicious activity
7. **Store securely** - Use environment variables or secure vaults, never commit to code

## Scope Examples

Define custom scopes based on your application needs:

```json
["read"]                           // Read-only access
["read", "write"]                  // Read and write access
["read", "write", "admin"]         // Full access
["agents:read", "agents:write"]    // Resource-specific scopes
["trades:read"]                    // Limited resource access
```

## Common Patterns

### Automatic Key Rotation

```typescript
async function rotateApiKey(oldKeyId: string, name: string) {
  // Create new key
  const newKey = await createApiKey(name, ['read', 'write'], 90);

  // Update your application to use the new key
  await updateApplicationConfig(newKey.api_key);

  // Revoke old key
  await revokeApiKey(oldKeyId);

  return newKey;
}
```

### Checking Key Status

```typescript
async function checkKeyHealth() {
  const keys = await listApiKeys();

  const now = new Date();

  return keys.map(key => ({
    ...key,
    status: !key.is_active ? 'revoked' :
            key.expires_at && new Date(key.expires_at) < now ? 'expired' :
            key.expires_at && new Date(key.expires_at) < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) ? 'expiring-soon' :
            'active'
  }));
}
```

## Troubleshooting

### Key validation fails
- Ensure the key is active (`is_active = true`)
- Check if the key has expired
- Verify the key string is complete and unmodified

### Permission denied errors
- Check RLS policies are enabled
- Verify user is authenticated
- Ensure user owns the key being accessed

### Key not found
- Verify the key wasn't deleted
- Check you're using the correct Supabase project
- Ensure the key hash matches (key must be exact)
