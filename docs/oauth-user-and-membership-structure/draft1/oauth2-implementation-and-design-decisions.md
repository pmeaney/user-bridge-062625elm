# OAuth2 Server Implementation Decisions - MVP

## Overview

This document captures key implementation decisions for the OAuth2 server MVP, focusing on practical solutions that balance simplicity with functionality.

## 1. Client Registration Strategy

### Approach: Database Seeding
Use a database seed file to pre-populate OAuth2 clients rather than building registration endpoints initially.

### Sample Implementation
```typescript
// database/seeds/oauth2-clients.seed.ts
const oauth2Clients = [
  {
    clientId: "teravi-job-board",
    clientSecret: "generated_secret_123", 
    name: "Teravi Job Board",
    redirectUris: ["https://jobs.teravi.com/auth/callback"],
    allowedScopes: ["openid", "profile", "email", "memberships"],
    srcCompany: "teravi"
  },
  {
    clientId: "teravi-forum", 
    clientSecret: "generated_secret_456",
    name: "Teravi Forum",
    redirectUris: ["https://discuss.teravi.com/auth/flarum"],
    allowedScopes: ["openid", "profile", "email"],
    srcCompany: "flarum"
  },
  {
    clientId: "teravi-logistics",
    clientSecret: "generated_secret_789",
    name: "Teravi Logistics",
    redirectUris: ["https://logi.teravi.com/oauth/callback"],
    allowedScopes: ["openid", "profile", "email", "memberships"],
    srcCompany: "teravi"
  },
  {
    clientId: "teravi-crm",
    clientSecret: "generated_secret_012",
    name: "Teravi CRM",
    redirectUris: ["https://crm.teravi.com/auth/oauth"],
    allowedScopes: ["openid", "profile", "email", "memberships"],
    srcCompany: "odoo"
  }
];
```

### Benefits
- **Simple Setup**: No need to build admin interfaces initially
- **Version Controlled**: Client configurations are tracked in code
- **Predictable**: All environments get the same client setup
- **Future Path**: Can add self-service registration later via admin dashboard

## 2. Scope Permissions Strategy

### Approach: Allow All Scopes for All Clients
For MVP, all registered clients can request any available scope without restrictions.

### Potential Security Risk Example
```typescript
// Hypothetical security concern:
// If a malicious actor gets client credentials, they could try:
GET /oauth/authorize?client_id=teravi-forum&scope=admin_access,financial_data,all_user_emails

// This could potentially expose:
// - All user email addresses (privacy violation)
// - Admin functions (security breach) 
// - Financial data (compliance issues)
```

### MVP Justification
- **Controlled Environment**: All applications are owned/controlled by the same organization
- **Limited Risk**: No external third parties have access to client credentials
- **Rapid Development**: Removes complexity of scope validation logic
- **Future Enhancement**: Scope restrictions can be added when external clients are introduced

## 3. Token Storage Strategy

### Approach: JWT Tokens
Use JSON Web Tokens for access tokens rather than database-stored random tokens.

### Implementation Benefits
- **NestJS Integration**: Leverages existing JWT infrastructure in the project
- **Stateless**: No need to store tokens in database
- **Performance**: No database lookup required for token validation
- **Simplicity**: Built-in expiration and validation

### Tradeoffs Accepted
- **Revocation Limitation**: Cannot revoke individual tokens before expiration
- **Size**: JWT tokens are larger than random strings
- **Security**: Token contains readable claims (but signed/verified)

### MVP Justification
- **Existing Infrastructure**: NestJS likely already has JWT token generation configured
- **Prototype Appropriate**: Revocation complexity not needed for initial development
- **Standard Compliance**: JWTs are standard for OAuth2 implementations

## 4. Multi-Organization Context Handling

### Scenario
Users may belong to multiple organizations with different roles:

```typescript
// Example: Consultant working with multiple farms
user: "sarah@consultant.com"
organizations: [
  { id: "green-valley-farm", type: "landowner", role: "manager" },
  { id: "agri-consulting", type: "business", role: "admin" }
]

// Question: When logging into Flarum, which context applies?
// - Farm manager from Green Valley Farm?
// - Business admin from Agri Consulting?
```

### Approach: Return All Memberships
Include all user organization memberships in OAuth2 userinfo response and let consuming applications handle the selection logic.

### Sample Response
```json
{
  "sub": "user-456",
  "email": "sarah@consultant.com",
  "name": "Sarah Smith",
  "memberships": {
    "green-valley-farm": {
      "status": "active",
      "role": "manager", 
      "organization_type": "landowner"
    },
    "agri-consulting": {
      "status": "active",
      "role": "admin",
      "organization_type": "business"
    }
  }
}
```

### Application Handling Options
- **Primary Organization**: Apps can use the first/primary organization
- **User Selection**: Apps can prompt user to choose context
- **Context Switching**: Apps can allow switching between organizations
- **Role Combination**: Apps can combine permissions from all roles

## Implementation Summary

### MVP Decisions
1. ✅ **Database seed file** for OAuth2 client registration
2. ✅ **All clients can request all scopes** (no restrictions)  
3. ✅ **Use JWT tokens** for access tokens
4. ✅ **Return all user memberships** in userinfo, let apps handle multiple organizations

### Future Enhancements
- **Client Management UI**: Admin dashboard for client registration/management
- **Scope Restrictions**: Limit scopes based on client type or trust level
- **Token Revocation**: Database-backed tokens for immediate revocation capability
- **Organization Selection**: UI for users to choose active organization context

### Development Priority
Focus on core OAuth2 flow implementation with these simplified assumptions, then iterate based on real-world usage patterns and security requirements as the platform scales.