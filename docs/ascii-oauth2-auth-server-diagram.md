```ascii


┌─────────────────────────────────────────────────────────────────────┐
│                    🔐 USER-BRIDGE MICROSERVICE                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────┐    ┌─────────────────────┐                │
│  │   Existing Modules  │    │    Users Module     │                │
│  │                     │    │                     │                │
│  │ • AuthController    │    │ • UsersController   │                │
│  │ • AuthService       │◄───┤ • UsersService      │                │
│  │ • LocalStrategy     │    │ • User Entity       │                │
│  │ • GoogleStrategy    │    │                     │                │
│  │ • JwtStrategy       │    └─────────────────────┘                │
│  └─────────────────────┘                                           │
│             ▲                                                       │
│             │                                                       │
│  ┌─────────────────────────────────────────────────────────────────┤
│  │                🆕 NEW: OAuth2 Server Module                     │
│  │                                                                 │
│  │  ┌─────────────────┐    ┌─────────────────────────────────────┐ │
│  │  │ OAuth2Controller│◄───┤          OAuth2 Entities           │ │
│  │  │                 │    │                                     │ │
│  │  │ Endpoints:      │    │ • OAuth2Client                     │ │
│  │  │ /oauth/authorize│    │ • AuthorizationCode                │ │
│  │  │ /oauth/token    │    │ • AccessToken                      │ │
│  │  │ /oauth/userinfo │    │ • RefreshToken                     │ │
│  │  │ /oauth/clients  │    │                                     │ │
│  │  └─────────────────┘    └─────────────────────────────────────┘ │
│  │             │                                                   │ │
│  │             ▼                                                   │ │
│  │  ┌─────────────────────────────────────────────────────────────┐ │
│  │  │                OAuth2Service                                │ │
│  │  │ • validateClient()  • createAuthCode()                     │ │
│  │  │ • exchangeToken()   • getUserInfo()                        │ │
│  │  └─────────────────────────────────────────────────────────────┘ │
│  └─────────────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────────────┘
                                    ▲
                                    │ OAuth2 Flow
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        💬 FLARUM FORUM                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────┐    ┌─────────────────────┐                │
│  │  FoF OAuth Plugin   │◄───┤   Flarum Users      │                │
│  │                     │    │                     │                │
│  │ Client Config:      │    │ • User accounts     │                │
│  │ • Client ID         │    │ • Permissions       │                │
│  │ • Client Secret     │    │ • Groups            │                │
│  │ • Auth URL          │    │                     │                │
│  │ • Token URL         │    └─────────────────────┘                │
│  │ • UserInfo URL      │                                           │
│  └─────────────────────┘                                           │
└─────────────────────────────────────────────────────────────────────┘

🔄 OAUTH2 AUTHORIZATION FLOW:

User Browser    Flarum Forum         User-Bridge OAuth2 Server
     │               │                           │
     │ 1. Click      │                           │
     │ "Login w/UB"  │                           │
     ├──────────────►│                           │
     │               │ 2. Redirect to            │
     │               │    /oauth/authorize       │
     │               ├──────────────────────────►│
     │               │                           │ 3. User
     │◄──────────────────────────────────────────┤    Authentication
     │               │                           │    (existing auth)
     │ 4. Redirect   │                           │
     │    with code  │◄──────────────────────────┤
     ├──────────────►│                           │
     │               │ 5. Exchange code          │
     │               │    for access token       │
     │               ├──────────────────────────►│
     │               │                           │
     │               │ 6. Get user info          │
     │               ├──────────────────────────►│
     │               │◄──────────────────────────┤
     │               │ 7. Create/login user      │
     │ 8. Logged in  │                           │
     │◄──────────────┤                           │

🔧 REQUIRED ENDPOINTS:

GET  /oauth/authorize  - Authorization endpoint (step 2)
POST /oauth/token      - Token exchange endpoint (step 5)  
GET  /oauth/userinfo   - User profile endpoint (step 6)
POST /oauth/clients    - Client management (setup)

🏢 FLARUM CONFIGURATION:

Provider Name: UserBridge
Client ID: flarum-forum
Client Secret: [generated]
Authorization URL: https://yoursite.com/oauth/authorize
Token URL: https://yoursite.com/oauth/token
User Info URL: https://yoursite.com/oauth/userinfo
Scopes: openid profile email

```