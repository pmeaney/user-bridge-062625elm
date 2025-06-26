# OAuth2 Scopes and Database Design for User-Bridge

## Overview

User-Bridge serves as a centralized identity verification and user profile service. When external applications (like Flarum forums) integrate with User-Bridge through OAuth2, they are essentially asking: "Is this person who they claim to be, and what information can be shared about them?"

This document outlines the OAuth2 scopes and database schema required to support centralized authentication across multiple applications.

## What User-Bridge Provides

User-Bridge acts as an identity provider that offers:

- **Identity Verification**: Confirming a user's identity across multiple applications
- **Profile Information**: Sharing user details like name, email, and profile data
- **Membership Data**: Information about which applications a user has access to
- **Role Management**: User roles and permissions across different connected applications

## Example of OAuth2 Scopes The Project Should Define

Here's an example of what could be defined for this project. In fact, this would be a good example for this project to use, as these scopes make sense for a centralized identity service:

**Core Identity Scopes:**
- `openid` - Basic identity verification (required for OpenID Connect)
- `profile` - Basic profile info (name, username, etc.)
- `email` - Email address and verification status

**Extended Scopes for Multi-App Ecosystem:**
- `memberships` - Which apps/services the user has access to
- `roles` - User roles across different applications
- `permissions` - Specific permissions in connected apps

## Detailed Scope Definitions

**Example Scope Definitions:**

```typescript
// What each scope grants access to:

'openid' → {
  sub: "user-uuid",  // Subject identifier
}

'profile' → {
  name: "John Doe",
  given_name: "John",
  family_name: "Doe",
  username: "johndoe",
  picture: "https://avatar-url.com/john.jpg",
  updated_at: "2023-01-01T00:00:00Z"
}

'email' → {
  email: "john@example.com",
  email_verified: true
}

'memberships' → {
  apps: [
    { app: "flarum-forum", status: "active", joined_at: "2023-01-01" },
    { app: "internal-saas-1", status: "active", joined_at: "2023-02-01" },
    { app: "internal-saas-2", status: "pending", invited_at: "2023-03-01" }
  ]
}

'roles' → {
  roles: [
    { app: "flarum-forum", role: "moderator" },
    { app: "internal-saas-1", role: "admin" },
    { app: "internal-saas-2", role: "user" }
  ]
}
```

## Database Schema

### OAuth2 Infrastructure Tables

These tables handle the core OAuth2 authorization flow mechanics.

#### OAuth2Client
Defines which applications can request authentication from User-Bridge.

```typescript
{
  id: "uuid",
  clientId: "flarum-forum",
  clientSecret: "hashed_secret", 
  name: "Forum Login",
  redirectUris: ["https://forum.com/auth/oauth"],
  allowedScopes: ["openid", "profile", "email", "memberships"],
  isActive: true,
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

#### AuthorizationCode
Temporary codes issued during the authorization flow, exchanged for access tokens.

```typescript
{
  id: "uuid",
  code: "abc123...",
  userId: "user-uuid", 
  clientId: "flarum-forum",
  scopes: ["openid", "profile", "email"],
  redirectUri: "https://forum.com/auth/oauth",
  expiresAt: "2023-01-01T00:10:00Z",
  used: false,
  createdAt: "timestamp"
}
```

#### AccessToken
Active tokens that grant API access to user information.

```typescript
{
  id: "uuid",
  token: "jwt_or_random_string",
  userId: "user-uuid",
  clientId: "flarum-forum", 
  scopes: ["openid", "profile", "email"],
  expiresAt: "2023-01-01T01:00:00Z",
  revoked: false,
  createdAt: "timestamp"
}
```

#### RefreshToken
Long-lived tokens for obtaining new access tokens without re-authentication.

```typescript
{
  id: "uuid",
  token: "refresh_token_string",
  userId: "user-uuid",
  clientId: "flarum-forum",
  expiresAt: "2023-01-30T00:00:00Z", 
  revoked: false,
  createdAt: "timestamp"
}
```

### Multi-Application Membership Tables

These tables enable centralized management of user access across multiple applications.

#### AppMembership
Tracks which applications users have access to and their status within each application.

```typescript
{
  id: "uuid",
  userId: "user-uuid",
  appIdentifier: "flarum-forum",
  status: "active" | "pending" | "suspended",
  role: "user" | "moderator" | "admin",
  joinedAt: "2023-01-01T00:00:00Z",
  invitedAt: "2023-01-01T00:00:00Z",
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

#### AppDefinition
Registry of all applications that can integrate with User-Bridge.

```typescript
{
  id: "uuid", 
  identifier: "flarum-forum",
  name: "Community Forum",
  description: "Main discussion forum",
  baseUrl: "https://forum.example.com",
  isActive: true,
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

## Example: Flarum Integration Flow

This example demonstrates how the scope and database design work together in a real authentication scenario.

### 1. Authorization Request
When a user clicks "Login with UserBridge" in Flarum, the following flow occurs:

**Flarum requests**: `scope=openid profile email memberships`

### 2. User-Bridge Processing
User-Bridge validates the request and checks:
- Is the user authenticated?
- Does the client have permission for the requested scopes?
- Does the user have appropriate memberships?

### 3. Data Response
User-Bridge returns the following information based on granted scopes:

```json
{
  "sub": "user-123",
  "email": "john@example.com",
  "name": "John Doe", 
  "memberships": {
    "flarum-forum": {
      "status": "active",
      "role": "moderator", 
      "joined_at": "2023-01-01"
    }
  }
}
```

### 4. Application Decision
Flarum processes this information to:
- Create or update John's user account
- Assign moderator permissions based on the role data
- Complete the login process

## Implementation Considerations

### Scope Strategy
Applications can start with basic identity scopes (`openid`, `profile`, `email`) and gradually adopt advanced features like membership management as requirements evolve.

### Membership Management
The membership system enables several advanced scenarios:
- **Automatic Access Control**: Only users with explicit app memberships can authenticate
- **Role Synchronization**: User roles are automatically synchronized across applications
- **Access Revocation**: Removing a user's membership automatically invalidates their tokens

### Security Implications
- Authorization codes expire within 10 minutes
- Access tokens expire within 1 hour
- Refresh tokens expire within 30 days
- All client secrets are hashed using argon2
- Token revocation is supported for immediate access removal

## Architecture Benefits

This design provides several key advantages:

1. **Single Source of Truth**: All user identity and membership information is centralized
2. **Flexible Integration**: Applications can request only the scopes they need
3. **Scalable Access Control**: New applications can be added without modifying existing integrations
4. **Consistent User Experience**: Users maintain the same identity across all connected applications
5. **Centralized Management**: User access and roles can be managed from a single interface