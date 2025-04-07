# User Bridge

>"A centralized authentication service that enables seamless identity sharing between independent business applications." 

User Bridge is a centralized auth service that provides an (optionally) shared user system for two or more separate, related business applications.  One could call it "federated-authentication-service" or "a microservice for a user system & related authentication", but "user-bridge" more concise and approachable.

This approach creates a unified user identity system while maintaining application-specific data in each app.

This architecture makes it easier to manage projects where users can access multiple related services. For example, a user from SaaS 1 can seamlessly review, join, and then access SaaS 2. This approach simplifies shared membership compared to creating separate user tables with complex linking between applications.

Goals:
- A single source of truth for user identities
- Clear separation between identity and application data
- Flexibility to add more apps in the future
- Proper role and permission management across applications

## Try it out

```
git clone git@github.com:pmeaney/user-bridge.git
cd user-bridge
cp .env-example .env
docker compose up
# open 2nd terminal to run tests:
docker compose exec api-user-bridge sh -c "pnpm test"
```

## User Registration & App Membership

When a user registers or logs in to one of the apps, this system:

- Creates or verifies their identity in the Auth service
- Creates/updates their app membership
- Returns appropriate tokens

```
┌─────────────────────────────────────────────┐
│             Auth Microservice               │
│                                             │
│  ┌─────────────┐    ┌────────────────────┐  │
│  │   Users     │    │   App Memberships  │  │
│  └─────────────┘    └────────────────────┘  │
│                                             │
│  ┌─────────────┐    ┌────────────────────┐  │
│  │   Auth      │    │      Roles &       │  │
│  │  Providers  │    │    Permissions     │  │
│  └─────────────┘    └────────────────────┘  │
└─────────────────────────────────────────────┘
         ▲                        ▲
         │                        │
         ▼                        ▼
┌─────────────────┐      ┌─────────────────┐
│  App1           │      │  App2           │
│  ┌────────────┐ │      │  ┌────────────┐ │
│  │ BizType1   │ │      │  │ BizType2   │ │
│  │ BizData    │ │      │  │ BizData    │ │
│  └────────────┘ │      │  └────────────┘ │
└─────────────────┘      └─────────────────┘
```

## Main dependencies

`pnpm add @nestjs/config @nestjs/typeorm typeorm pg argon2 class-validator class-transformer`

- @nestjs/config: For managing environment variables and configuration
- @nestjs/typeorm and typeorm: For database interactions and ORM functionality
- pg: PostgreSQL driver for TypeORM
- argon2: For securely hashing passwords with the modern, memory-hard Argon2id algorithm
- class-validator: For validating incoming data
- class-transformer: For transforming objects (like excluding password fields from responses)