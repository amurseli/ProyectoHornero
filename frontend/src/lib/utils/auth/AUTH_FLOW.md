# Authentication Flow Documentation

## Overview
Simple, centralized authentication using **HttpOnly JWT cookies** managed by the backend.  
Frontend only stores user data (not tokens) in React context.

## Architecture - Single Interceptor Pattern

### 1. Request Interceptor: `api.js`
**Single source of truth** for all HTTP requests - handles JWT refresh automatically.

**Flow on every request:**
```
1. Make request with cookies
2. If 401/403 (JWT missing/expired):
   → Try to refresh JWT using refresh token cookie
   → If refresh succeeds: Retry request with new JWT
   → If refresh fails: Logout user + redirect (if on protected route)
3. Return response
```

**Key features:**
- Request queuing during refresh (handles concurrent requests)
- Automatic session expiry handling
- Smart redirect (only on protected routes)

### 2. User State: `UserProvider`
Manages user data in React context (in-memory only).

**Responsibilities:**
- Fetch user data on app load
- Provide `login()`, `logout()`, `isAuthenticated()` methods
- Listen for `auth:logout` events from api.js

### 3. Navigation Verifier: `AuthVerifier`
Runs on every route navigation when user is logged in.

**Flow:**
```
Navigation → Call /api/users/me → api.js intercepts → Refresh if needed
```

This ensures JWT is always valid, even if manually deleted from cookies.

### 4. Route Protection: `ProtectedRoute`
Simple guard that checks if user exists in memory.

## Complete Authentication Flows

### Initial App Load
```
1. App starts
2. UserProvider fetches /api/users/me
3. If JWT valid → User loaded
4. If JWT expired → api.js refreshes → Retry
5. If no refresh token → User stays null
```

### Login
```
1. User submits login
2. POST /api/auth/login
3. Backend sets JWT + refresh token cookies
4. Frontend receives user data
5. UserProvider.login(userData)
6. Navigate to dashboard
```

### Navigation (Any Page)
```
1. User navigates
2. AuthVerifier calls /api/users/me
3. If JWT valid → Continue
4. If JWT expired → api.js refreshes automatically → Continue
5. If no refresh token → Logout + redirect (if protected)
```

### API Request with Expired JWT
```
1. Component calls api.get('/api/data')
2. Backend returns 401 (JWT expired)
3. api.js intercepts → Calls /api/auth/refresh
4. If refresh succeeds → Retries /api/data with new JWT
5. If refresh fails → Emits 'auth:logout' → Redirect to login
```

### Manual Cookie Deletion
```
1. User deletes JWT cookie manually
2. Navigates to any page
3. AuthVerifier calls /api/users/me → 401
4. api.js refreshes automatically
5. New JWT issued → Request succeeds
```

### Logout
```
1. User clicks logout
2. UserProvider.logout()
3. POST /api/users/logout (clears backend cookies)
4. UserProvider clears user state
5. Navigate to login
```

## Cookie Details

| Cookie | Type | Lifespan | Purpose |
|--------|------|----------|---------|
| JWT Access Token | HttpOnly, Secure, SameSite | ~15 min | Authenticate requests |
| Refresh Token | HttpOnly, Secure, SameSite | ~7 days | Get new JWT |

**Security:** HttpOnly prevents JavaScript access (XSS protection)

## Key Benefits

✅ **Centralized logic** - All auth handling in api.js  
✅ **Automatic refresh** - Transparent to components  
✅ **Request queuing** - Handles concurrent requests elegantly  
✅ **Smart redirects** - Only on protected routes  
✅ **Simple components** - No auth logic scattered everywhere  
✅ **SvelteKit-like** - Single interceptor pattern  

## File Structure

```
src/lib/
├── utils/
│   ├── api/
│   │   └── api.js           # Request interceptor (JWT refresh)
│   └── auth/
│       ├── AUTH_FLOW.md     # This file
│       └── auth.js          # Deprecated utilities
├── store/
│   ├── UserContext.js       # React context definition
│   ├── UserProvider.jsx     # User state management
│   └── useUser.js           # Hook to access user
└── components/
    └── ProtectedRoute.jsx   # Route guard

src/
└── App.jsx                  # AuthVerifier component
```

## Migration from Complex Pattern

**Before:** Multiple verification points, duplicate refresh logic  
**After:** Single interceptor in api.js, simple components
