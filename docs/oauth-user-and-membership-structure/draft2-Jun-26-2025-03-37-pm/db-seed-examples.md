# Database Seed Files and Data Examples

## Understanding Seed Data vs Runtime Data

Before diving into the specific tables, it's important to understand the fundamental distinction between seed data and runtime data in this agricultural platform. Seed data represents the foundational information that must exist before the system can function properly - think of it as the scaffolding that supports all user activity. Runtime data, by contrast, represents the dynamic information that gets created as users interact with the platform.

This distinction matters because seed data determines what's possible within your system, while runtime data represents what actually happens. For example, the roles table (seed data) defines what types of authority users can have, while the user_platform_roles table (runtime data) tracks which specific users have been granted those authorities and when.

## Section 1: Required Seed Files

The following tables require seed data for the application to function properly. These contain foundational data that the system depends on for authorization, application registration, and demo functionality. Understanding why each of these requires seeding helps illuminate how the permission system operates at a structural level.

### 1. Roles Seed Data

The roles table serves as the foundation for the entire authorization system. These entries define the vocabulary of authority that your platform understands. Notice how the roles are carefully structured to support the two-category permission model we developed, with business roles governing organizational authority and platform roles governing community participation.

| id          | name        | category | scope    | description                           | permissions                                   |
|-------------|-------------|----------|----------|---------------------------------------|-----------------------------------------------|
| role-b-adm  | admin       | business | business | Full authority within organization    | ["manage_org", "staff_mgmt", "finances", "manage_ops", "view_reports"] |
| role-b-mgr  | manager     | business | business | Operational management                | ["manage_ops", "view_reports", "view_basic_info"] |
| role-b-wrk  | worker      | business | business | Staff with task-specific permissions  | ["view_basic_info"]                          |
| role-b-gen  | general     | business | business | Basic organizational member           | ["view_basic_info"]                          |
| role-p-mem  | member      | platform | system   | Basic platform access                 | ["view_content"]                             |
| role-p-con  | contributor | platform | system   | Enhanced content creation             | ["view_content", "create_content"]           |
| role-p-cur  | curator     | platform | system   | Content organization abilities        | ["view_content", "create_content", "curate_content"] |
| role-p-mod  | moderator   | platform | system   | Community moderation authority        | ["view_content", "create_content", "curate_content", "moderate_content"] |
| role-p-adm  | admin       | platform | system   | Platform administration               | ["view_content", "create_content", "curate_content", "moderate_content", "manage_users", "config_system"] |

Notice how the permissions are structured as cumulative capabilities. A platform curator has all the abilities of a contributor plus additional curation powers. This hierarchical structure makes role progression intuitive while maintaining clear boundaries between different levels of authority.

### 2. Registered Apps Seed Data

The registered apps table defines which applications are part of your platform ecosystem. Each entry represents a distinct service that users can access through your unified authentication system. The authType field determines whether the application uses internal authentication or requires OAuth2 token exchange.

| id          | appIdentifier              | appName                    | authType | baseUrl                      |
|-------------|----------------------------|----------------------------|----------|------------------------------|
| app-land    | landownerAndUserdirectory  | Land Directory             | internal | https://land.teravi.com      |
| app-forum   | flarumForum                | Community Forum            | oauth2   | https://discuss.teravi.com   |
| app-invoice | invoiceNinja               | Invoice Management         | oauth2   | https://invoice.teravi.com   |
| app-jobs    | ruralJobsBoard             | Rural Jobs Board           | internal | https://jobs.teravi.com      |

The distinction between internal and OAuth2 authentication reflects different integration approaches. Internal applications are tightly coupled with your authentication system and can directly query user permissions. OAuth2 applications receive standardized tokens and must make authorization decisions based on the claims contained within those tokens.

### 3. Organizations Seed Data

The organizations table provides concrete examples of the types of agricultural entities that your platform serves. These seed entries support development and testing while demonstrating the platform's flexibility in accommodating different organizational structures within the agricultural community.

| id                | name                   | type      | description                       | contactEmail           |
|-------------------|------------------------|-----------|-----------------------------------|------------------------|
| org-happy-acre    | Happy Acre Farms       | landowner | 200-acre organic vegetable farm   | contact@happyacre.com  |
| org-jims-cattle   | Jim's Cattle Ranch     | landowner | 1000-acre cattle operation       | jim@cattleranch.com    |
| org-agricorp      | AgriCorp Solutions     | landuser  | Agricultural consulting firm      | info@agricorp.com      |
| org-rural-equip   | Rural Equipment Co     | business  | Farm equipment sales/service      | sales@ruralequip.com   |
| org-bee-collective| Riverside Bee Collective| business  | Beekeeping cooperative           | hives@bees.coop        |

The variety of organization types reflects the complex ecosystem of relationships that exist in agricultural communities. Landowners operate farms and ranches, landusers provide consulting and specialized services, and businesses supply equipment and related services to the agricultural community.

### 4. OAuth2 Client Registry Seed Data

The OAuth2 client registry establishes trust relationships between your authentication server and external applications. Each client entry represents a formal agreement about how authentication should work, including security parameters and allowed operations.

| clientId      | clientSecret | appId       | redirectUris                           | allowedScopes              | srcCompany |
|---------------|--------------|-------------|----------------------------------------|----------------------------|------------|
| teravi-forum  | secret123... | app-forum   | ["https://discuss.teravi.com/auth/..."]| ["openid","profile","email"]| flarum     |
| teravi-invoice| secret456... | app-invoice | ["https://invoice.teravi.com/auth/..."]| ["openid","profile","org"] | invoice-ninja |

The allowedScopes field determines what information each client can request about authenticated users. Notice how the invoice application requests "org" scope to understand organizational context, while the forum primarily needs identity information.

### 5. Demo Users Seed Data

These user entries provide realistic test data that demonstrates the platform's capability to handle diverse authentication methods and user profiles. The mix of local and OAuth authentication shows how the system accommodates different user preferences and technical requirements.

| id       | email                    | firstName | lastName | provider | passwordHash | googleId    | phoneNumber |
|----------|--------------------------|-----------|----------|----------|--------------|-------------|-------------|
| user-001 | john@happyacre.com       | John      | Doe      | local    | $argon2$...  | null        | +1-555-0101 |
| user-002 | sarah@happyacre.com      | Sarah     | Smith    | local    | $argon2$...  | null        | +1-555-0102 |
| user-003 | lisa@agricorp.com        | Lisa      | Chen     | google   | null         | google-456  | +1-555-0201 |
| user-004 | mike@happyacre.com       | Mike      | Johnson  | local    | $argon2$...  | null        | +1-555-0103 |
| user-005 | jim@cattleranch.com      | Jim       | Wilson   | local    | $argon2$...  | null        | +1-555-0301 |
| user-006 | keeper@bees.coop         | Maria     | Santos   | local    | $argon2$...  | null        | +1-555-0401 |

The email addresses are strategically chosen to reflect realistic organizational affiliations, which becomes important when testing how the system handles users who represent different organizations in different contexts.

### 6. User Organizations Seed Data

This junction table demonstrates the complex multi-organizational relationships that are common in agricultural communities. Notice how Lisa Chen appears multiple times, reflecting her role as a consultant who works with different organizations in different capacities.

| id    | userId   | organizationId   | roleId      | title                     | startDate  | isActive |
|-------|----------|------------------|-------------|---------------------------|------------|----------|
| uo-01 | user-001 | org-happy-acre   | role-b-adm  | Farm Owner                | 2023-01-01 | true     |
| uo-02 | user-002 | org-happy-acre   | role-b-mgr  | Farm Manager              | 2023-01-15 | true     |
| uo-03 | user-003 | org-happy-acre   | role-b-gen  | Community Member          | 2023-01-01 | true     |
| uo-04 | user-003 | org-jims-cattle  | role-b-wrk  | Sustainability Consultant | 2023-03-15 | true     |
| uo-05 | user-003 | org-agricorp     | role-b-adm  | CEO                       | 2022-01-01 | true     |
| uo-06 | user-004 | org-happy-acre   | role-b-wrk  | Farm Worker               | 2023-02-10 | true     |
| uo-07 | user-005 | org-jims-cattle  | role-b-adm  | Ranch Owner               | 2022-06-01 | true     |
| uo-08 | user-006 | org-bee-collective| role-b-adm | Beekeeper Coordinator     | 2023-04-01 | true     |

The title field provides human-readable context for each organizational relationship, helping administrators understand the real-world nature of each user's role beyond the formal permission categories.

### 7. User Platform Roles Seed Data

This table demonstrates how platform-level privileges are granted independently of business relationships. The grantedBy and reason fields create an audit trail that helps maintain transparency in community governance decisions.

| id    | userId   | roleId      | grantedBy    | reason                           | grantedAt  | isActive |
|-------|----------|-------------|--------------|----------------------------------|------------|----------|
| upr-01| user-003 | role-p-mod  | system-admin | Community leadership recognition | 2023-06-01 | true     |
| upr-02| user-001 | role-p-con  | system-admin | Active community contributor     | 2023-05-15 | true     |
| upr-03| user-005 | role-p-cur  | system-admin | Excellent content organization   | 2023-07-01 | true     |

Notice how platform roles are granted based on community contribution and leadership rather than business authority. Lisa Chen's moderation privileges stem from her community engagement, not her CEO status at AgriCorp.

### 8. User App Memberships Seed Data

This complex junction table demonstrates how business and platform permissions intersect within specific applications. Each row represents a user's access to a particular application within a particular organizational context, potentially enhanced by platform-level privileges.

| id     | userId   | organizationId  | appId       | businessRoleId | platformRoleId | status | joinedAt   |
|--------|----------|-----------------|-------------|----------------|----------------|--------|------------|
| uam-01 | user-001 | org-happy-acre  | app-land    | role-b-adm     | null           | active | 2023-01-15 |
| uam-02 | user-001 | org-happy-acre  | app-forum   | role-b-adm     | role-p-con     | active | 2023-01-20 |
| uam-03 | user-001 | org-happy-acre  | app-jobs    | role-b-adm     | null           | active | 2023-01-25 |
| uam-04 | user-002 | org-happy-acre  | app-land    | role-b-mgr     | null           | active | 2023-01-20 |
| uam-05 | user-002 | org-happy-acre  | app-forum   | role-b-mgr     | role-p-mem     | active | 2023-01-25 |
| uam-06 | user-003 | org-happy-acre  | app-forum   | role-b-gen     | role-p-mod     | active | 2023-02-01 |
| uam-07 | user-003 | org-jims-cattle | app-land    | role-b-wrk     | null           | active | 2023-03-20 |
| uam-08 | user-003 | org-jims-cattle | app-forum   | role-b-wrk     | role-p-mod     | active | 2023-03-25 |
| uam-09 | user-003 | org-agricorp    | app-land    | role-b-adm     | null           | active | 2023-01-10 |
| uam-10 | user-003 | org-agricorp    | app-invoice | role-b-adm     | null           | active | 2023-01-15 |
| uam-11 | user-004 | org-happy-acre  | app-forum   | role-b-wrk     | role-p-mem     | active | 2023-02-15 |
| uam-12 | user-005 | org-jims-cattle | app-land    | role-b-adm     | null           | active | 2023-02-01 |
| uam-13 | user-005 | org-jims-cattle | app-forum   | role-b-adm     | role-p-cur     | active | 2023-02-05 |
| uam-14 | user-006 | org-bee-collective| app-invoice| role-b-adm     | null           | active | 2023-04-05 |

The combination of businessRoleId and platformRoleId in each row enables sophisticated authorization decisions. When Lisa moderates a forum discussion while representing AgriCorp, the system can validate both her business authority to speak for the organization and her platform authority to moderate content.

---

## Section 2: Runtime Data Tables (Examples)

The following tables are populated during application runtime as users authenticate and use the OAuth2 system. These examples show what the data looks like during active system operation, illustrating the dynamic flow of authentication and authorization as users interact with your agricultural platform.

### OAuth2 Authorization Codes (Runtime Generated)

Authorization codes represent the brief moment between user authentication and token issuance. These entries typically exist for only a few minutes, serving as secure bridges between your authentication system and requesting applications.

| id       | code     | clientId       | userId   | scopes                      | redirectUri                          | expiresAt           | isUsed |
|----------|----------|----------------|----------|-----------------------------|--------------------------------------|---------------------|--------|
| auth-001 | abc123   | teravi-forum   | user-001 | ["openid","profile"]        | https://discuss.teravi.com/auth/cb   | 2023-06-01 10:05:00 | false  |
| auth-002 | def456   | teravi-forum   | user-003 | ["openid","profile","email"]| https://discuss.teravi.com/auth/cb   | 2023-06-01 11:15:00 | true   |
| auth-003 | ghi789   | teravi-invoice | user-006 | ["openid","profile","org"]  | https://invoice.teravi.com/auth/cb   | 2023-06-01 14:20:00 | false  |

The scopes requested reflect each application's specific information needs. Notice how the invoice application requests organizational scope to understand billing context, while the forum focuses on identity and communication information.

### OAuth2 Access Tokens (Runtime Generated)

Access tokens represent active user sessions with external applications. The token lifetime and scope determine what actions the application can perform on behalf of the authenticated user.

| id       | token    | clientId       | userId   | scopes                        | expiresAt           | isRevoked |
|----------|----------|----------------|----------|-------------------------------|---------------------|-----------|
| token-01 | jwt789   | teravi-forum   | user-001 | ["openid","profile"]          | 2023-06-01 11:00:00 | false     |
| token-02 | jwt456   | teravi-forum   | user-003 | ["openid","profile","email"]  | 2023-06-01 12:10:00 | false     |
| token-03 | jwt123   | teravi-forum   | user-002 | ["openid","profile"]          | 2023-06-01 09:30:00 | true      |
| token-04 | jwt321   | teravi-invoice | user-006 | ["openid","profile","org"]    | 2023-06-01 15:15:00 | false     |

Token revocation can occur for various reasons, including explicit user logout, security concerns, or administrative action. The revoked status prevents applications from continuing to use invalidated tokens.

### OAuth2 Refresh Tokens (Runtime Generated)

Refresh tokens enable applications to maintain user sessions without requiring repeated authentication. These tokens typically have longer lifespans than access tokens, allowing for seamless user experiences while maintaining security through regular token rotation.

| id         | token      | accessTokenId | clientId       | userId   | expiresAt           | isRevoked |
|------------|------------|---------------|----------------|----------|---------------------|-----------|
| refresh-01 | refresh789 | token-01      | teravi-forum   | user-001 | 2023-07-01 11:00:00 | false     |
| refresh-02 | refresh456 | token-02      | teravi-forum   | user-003 | 2023-07-01 12:10:00 | false     |
| refresh-03 | refresh123 | token-03      | teravi-forum   | user-002 | 2023-07-01 09:30:00 | true      |
| refresh-04 | refresh321 | token-04      | teravi-invoice | user-006 | 2023-07-01 15:15:00 | false     |

The relationship between access tokens and refresh tokens maintains session continuity while enabling security through token rotation. When an access token expires, the application can use the refresh token to obtain a new access token without interrupting the user's workflow.

### Users Table (Complete with Auto-Generated IDs)

This represents the actual user table as it appears during system operation, including automatically generated timestamps and authentication status information that reflects real user activity patterns.

| id       | email                    | firstName | lastName | provider | passwordHash | googleId    | phoneNumber | isActive | lastLoginAt         |
|----------|--------------------------|-----------|----------|----------|--------------|-------------|-------------|----------|---------------------|
| user-001 | john@happyacre.com       | John      | Doe      | local    | $argon2$...  | null        | +1-555-0101 | true     | 2023-06-01 08:30:00 |
| user-002 | sarah@happyacre.com      | Sarah     | Smith    | local    | $argon2$...  | null        | +1-555-0102 | true     | 2023-06-01 09:15:00 |
| user-003 | lisa@agricorp.com        | Lisa      | Chen     | google   | null         | google-456  | +1-555-0201 | true     | 2023-06-01 10:45:00 |
| user-004 | mike@happyacre.com       | Mike      | Johnson  | local    | $argon2$...  | null        | +1-555-0103 | true     | 2023-05-28 16:20:00 |
| user-005 | jim@cattleranch.com      | Jim       | Wilson   | local    | $argon2$...  | null        | +1-555-0301 | true     | 2023-06-01 07:00:00 |
| user-006 | keeper@bees.coop         | Maria     | Santos   | local    | $argon2$...  | null        | +1-555-0401 | true     | 2023-05-30 14:20:00 |

The lastLoginAt timestamps provide insights into user engagement patterns, which can inform community management decisions and help identify users who might benefit from additional onboarding or support.

## Understanding the Data Flow

This documentation provides a complete picture of both the foundational seed data required for system operation and examples of how the runtime data tables populate during actual system usage. The seed data creates the framework for authorization and application access, establishing the vocabulary of permissions and the roster of available applications and organizations.

The runtime data captures the dynamic authentication flows that occur as users interact with your platform and its connected applications. Understanding this flow helps illuminate how the static permission structure enables dynamic authorization decisions that respect both business authority and community governance requirements.

The progression from seed data through runtime data demonstrates how your agricultural platform can start with a solid foundation and evolve organically as the community grows and new applications join the ecosystem. Each new organization, user, or application integration builds on the existing structure without requiring fundamental changes to the authorization architecture.