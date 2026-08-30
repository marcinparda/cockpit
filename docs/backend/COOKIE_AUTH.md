# HTTP-Only Cookie Authentication

This document explains how to use the HTTP-only cookie-based authentication system alongside the Bearer token system.

## Overview

The API now supports two authentication methods:

1. **HTTP-only cookies** (recommended for web browsers)
2. **Bearer tokens** (recommended for API clients and mobile apps)

Both methods can be used simultaneously, with cookie authentication taking precedence when both are present.

## Configuration

### Environment Variables

```bash
# Cookie Settings
COOKIE_DOMAIN=localhost                 # Use .parda.me for production
COOKIE_SECURE=false                     # Set to true for production (HTTPS)
COOKIE_SAMESITE=strict                  # strict, lax, or none
ENVIRONMENT=development                 # development, production, test

# CORS Settings (updated to support subdomains)
CORS_ORIGINS=http://localhost:3000,http://localhost:4200,http://localhost:8000,https://*.parda.me
```

### Production Configuration

```bash
# Production settings
COOKIE_DOMAIN=.parda.me
COOKIE_SECURE=true
ENVIRONMENT=production
CORS_ORIGINS=https://*.parda.me,https://app.parda.me,https://admin.parda.me
```

## Authentication Flow

### 1. Login (Cookie-based)

**Request:**

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```http
HTTP/1.1 200 OK
Set-Cookie: access_token=<jwt_token>; HttpOnly; Secure; SameSite=Strict; Max-Age=1800; Domain=.parda.me
Set-Cookie: refresh_token=<jwt_refresh_token>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Domain=.parda.me
Content-Type: application/json

{
  "access_token": "<jwt_token>",
  "refresh_token": "<jwt_refresh_token>",
  "token_type": "bearer",
  "expires_in": 1800,
  "refresh_expires_in": 604800,
  "user_id": "<user_uuid>",
  "email": "user@example.com",
  "is_active": true,
  "password_changed": true
}
```

### 2. Authenticated Requests

#### Using Cookies (Automatic)

When cookies are set, they're automatically included in subsequent requests:

```http
GET /api/v1/auth/me
Cookie: access_token=<jwt_token>
```

#### Using Bearer Token (Backward Compatibility)

```http
GET /api/v1/auth/me
Authorization: Bearer <jwt_token>
```

### 3. Token Refresh

#### Using Cookie Refresh Token

```http
POST /api/v1/auth/refresh
Cookie: refresh_token=<jwt_refresh_token>
```

#### Using JSON Body (Backward Compatibility)

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "<jwt_refresh_token>"
}
```

**Response:**
Both methods return the same response and set new cookies if the refresh token came from a cookie:

```http
HTTP/1.1 200 OK
Set-Cookie: access_token=<new_jwt_token>; HttpOnly; Secure; SameSite=Strict; Max-Age=1800; Domain=.parda.me
Set-Cookie: refresh_token=<new_jwt_refresh_token>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Domain=.parda.me
Content-Type: application/json

{
  "access_token": "<new_jwt_token>",
  "refresh_token": "<new_jwt_refresh_token>",
  "token_type": "bearer",
  "expires_in": 1800,
  "refresh_expires_in": 604800
}
```

### 4. Logout

The logout endpoint clears both cookies and invalidates tokens:

#### Using Cookie Authentication

```http
POST /api/v1/auth/logout
Cookie: access_token=<jwt_token>; refresh_token=<jwt_refresh_token>
```

#### Using Bearer Token (Backward Compatibility)

```http
POST /api/v1/auth/logout
Authorization: Bearer <jwt_token>
```

**Response:**

```http
HTTP/1.1 200 OK
Set-Cookie: access_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Domain=.parda.me
Set-Cookie: refresh_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Domain=.parda.me
Content-Type: application/json

{
  "detail": "Successfully logged out"
}
```

## Frontend Integration

### JavaScript/TypeScript Example

```typescript
// Login
async function login(email: string, password: string) {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important: Include cookies
    body: JSON.stringify({ email, password }),
  });

  if (response.ok) {
    const data = await response.json();
    // Cookies are automatically set by the browser
    console.log('Login successful:', data);
  }
}

// Authenticated request
async function getCurrentUser() {
  const response = await fetch('/api/v1/auth/me', {
    credentials: 'include', // Important: Include cookies
  });

  if (response.ok) {
    return await response.json();
  }
}

// Logout
async function logout() {
  const response = await fetch('/api/v1/auth/logout', {
    method: 'POST',
    credentials: 'include', // Important: Include cookies
  });

  if (response.ok) {
    // Cookies are automatically cleared
    console.log('Logout successful');
  }
}
```

### React Hook Example

```typescript
import { useCallback, useEffect, useState } from 'react';

interface User {
  user_id: string;
  email: string;
  is_active: boolean;
  password_changed: boolean;
  created_at: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/auth/me', {
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        await fetchUser();
        return true;
      }
      return false;
    },
    [fetchUser]
  );

  const logout = useCallback(async () => {
    await fetch('/api/v1/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    setUser(null);
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return { user, loading, login, logout, refetch: fetchUser };
}
```

## Security Features

### Cookie Attributes

- **HttpOnly**: Prevents JavaScript access to tokens, protecting against XSS attacks
- **Secure**: Ensures cookies are only sent over HTTPS in production
- **SameSite=Strict**: Prevents CSRF attacks by restricting cross-site cookie sending
- **Domain**: Allows cookie sharing across subdomains (e.g., \*.parda.me)
- **Max-Age**: Sets appropriate expiration times (30 minutes for access, 7 days for refresh)

### Cross-Domain Support

The system supports cross-domain authentication within the same domain:

- Main app: `https://app.parda.me`
- Admin panel: `https://admin.parda.me`
- API: `https://api.parda.me`

All can share the same authentication cookies when `COOKIE_DOMAIN=.parda.me`.

## Backward Compatibility

All existing Bearer token functionality remains unchanged:

- Existing API clients continue to work without modification
- Mobile applications can still use Bearer tokens
- The same JWT tokens work for both authentication methods
- All endpoints support both authentication methods simultaneously

## Migration Guide

### For Web Applications

1. Update fetch requests to include `credentials: 'include'`
2. Remove manual token storage/management code
3. Let the browser handle cookie management automatically
4. Update CORS configuration if needed

### For API Clients

No changes required - continue using Bearer tokens as before.

### Environment Setup

1. Update environment variables for your deployment
2. Configure CORS origins to include your domains
3. Set appropriate cookie domain for your environment
4. Enable secure cookies for production

## Troubleshooting

### Common Issues

1. **Cookies not being set**: Ensure `credentials: 'include'` is set in fetch requests
2. **CORS issues**: Verify CORS origins include your frontend domain
3. **Secure cookie issues**: Check HTTPS configuration in production
4. **Cross-domain issues**: Verify cookie domain is set correctly (e.g., `.parda.me`)

### Development vs Production

| Setting       | Development        | Production          |
| ------------- | ------------------ | ------------------- |
| COOKIE_DOMAIN | localhost          | .parda.me           |
| COOKIE_SECURE | false              | true                |
| ENVIRONMENT   | development        | production          |
| CORS_ORIGINS  | localhost:3000,etc | https://\*.parda.me |

## Testing

The system includes comprehensive tests for:

- Cookie setting and reading
- Dual authentication support
- Backward compatibility
- Security attributes
- Cross-domain functionality

Run tests with:

```bash
python -m pytest src/tests/test_cookie_auth.py -v
python -m pytest src/tests/test_cookie_auth_integration.py -v
```
