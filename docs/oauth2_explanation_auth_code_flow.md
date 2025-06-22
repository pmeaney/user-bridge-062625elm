
# Explanation of OAuth2 Server - Authorization Code flow

>An explanation of how an OAuth2 Server's Authorizaiton Code flow works, and the credential exchange it involves.

A 3rd party service which uses the user-bridge microservice involves an interaction between three agents:

* human user (browser)
* user-bridge (server)
* 3rd party service (such as the flarum discussion forum) (server)

The diagram below explains how the OAuth2 server functionality within User-Bridge follows  OAuth2 RFC Standards ( RFC 6749 - https://oauth.net/2/ )for a "OAuth2 Authorization Code flow", enabling a 3rd party app or separate business unit-- in this case Flarum-- to use user-bridge's user system to sign users up & log users in.

Note: although he RFC 6749 defines 4 distinct parties.  In my explanation of the implementation relative to user-bridge, two are grouped together.

Resource Owner - The human user who owns the data/account
User-Agent - The browser (acts on behalf of the resource owner)
Client - Flarum (the application requesting access)
Authorization Server - User-bridge (issues tokens and handles auth)

I grouped the Resource Owner and User-Agent together as "human user (browser)" because in practice they work so closely together - the browser is just the tool the human uses. But the RFC treats them as separate entities with distinct roles.

This distinction matters because:

- The Resource Owner makes the authorization decision ("Yes, I want to allow Flarum to access my profile")
- The User-Agent (browser) carries out the technical steps - redirects, form submissions, carrying authorization codes between services

In terms of modeling the implmentation though, it's simplified if we just consider three main parties which interact, exchanging keys & session data.

```mermaid
sequenceDiagram
    participant Browser as 👤 Human User<br/>(Browser)
    participant Flarum as 🌐 Flarum Server<br/>(OAuth2 Client)
    participant UserBridge as 🔐 User-Bridge<br/>(OAuth2 Server)

    Note over Browser, UserBridge: Initial State: Who Has What Secrets

    Note over Flarum: 🔑 PERMANENTLY HOLDS:<br/>• client_id: "flarum-forum"<br/>• client_secret: "sk_live_abc123..."<br/>• redirect_uri: "https://forum.com/callback"

    Note over UserBridge: 🔑 PERMANENTLY HOLDS:<br/>• client_secret: "sk_live_abc123..." (registered)<br/>• JWT signing key: "super-secret-jwt-key"<br/>• User database & passwords

    Note over Browser: 🔑 HOLDS:<br/>• Nothing sensitive initially<br/>• User's login credentials (temporarily)

    rect rgb(240, 248, 255)
        Note over Browser, UserBridge: STEP 1: Authorization Request
        Browser->>Flarum: "I want to login"
        Flarum->>Browser: Redirect to:<br/>GET /oauth/authorize?<br/>client_id=flarum-forum&<br/>response_type=code&<br/>redirect_uri=https://forum.com/callback&<br/>scope=profile email&<br/>state=xyz789
        
        Note over Browser: 📝 Browser temporarily holds:<br/>• Authorization URL parameters<br/>• State parameter: "xyz789"
    end

    rect rgb(248, 255, 248)
        Note over Browser, UserBridge: STEP 2: User Authentication
        Browser->>UserBridge: User enters credentials
        UserBridge->>UserBridge: Validate user & generate auth code
        
        Note over UserBridge: 💾 Creates & stores:<br/>• auth_code: "ac_1234567890"<br/>• expires_at: now() + 10 minutes<br/>• user_id: "user-uuid-123"<br/>• client_id: "flarum-forum"<br/>• redirect_uri: verified match<br/>• scopes: ["profile", "email"]
        
        UserBridge->>Browser: Redirect to:<br/>https://forum.com/callback?<br/>code=ac_1234567890&<br/>state=xyz789
        
        Note over Browser: 📝 Browser now holds:<br/>• Authorization code: "ac_1234567890"<br/>• State: "xyz789" (for CSRF protection)
    end

    rect rgb(255, 248, 248)
        Note over Browser, UserBridge: STEP 3: Token Exchange (Server-to-Server)
        Browser->>Flarum: Delivers code via callback URL
        
        Note over Flarum: 🔍 Flarum validates:<br/>• State matches original request<br/>• Code is present and valid format
        
        Flarum->>UserBridge: POST /oauth/token<br/>Content-Type: application/json<br/>{<br/>"grant_type": "authorization_code",<br/>"code": "ac_1234567890",<br/>"client_id": "flarum-forum",<br/>"client_secret": "sk_live_abc123...",<br/>"redirect_uri": "https://forum.com/callback"<br/>}
        
        Note over UserBridge: 🔍 Validates all parameters:<br/>• Client credentials match<br/>• Code exists & not expired<br/>• Redirect URI matches<br/>• Marks code as USED
        
        UserBridge->>Flarum: HTTP 200 OK<br/>{<br/>"access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",<br/>"token_type": "Bearer",<br/>"expires_in": 3600,<br/>"scope": "profile email",<br/>"refresh_token": "rt_refresh123..."<br/>}
        
        Note over Flarum: 💾 Flarum now holds:<br/>• access_token (JWT Bearer)<br/>• refresh_token (for renewal)<br/>• token expiry time<br/>• granted scopes
    end

    rect rgb(255, 255, 240)
        Note over Browser, UserBridge: STEP 4: Resource Access
        Flarum->>UserBridge: GET /oauth/userinfo<br/>Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
        
        Note over UserBridge: 🔍 JWT Token validation:<br/>• Signature verification<br/>• Expiry check<br/>• Scope verification
        
        UserBridge->>Flarum: HTTP 200 OK<br/>{<br/>"sub": "user-uuid-123",<br/>"email": "john@example.com",<br/>"name": "John Doe",<br/>"given_name": "John",<br/>"family_name": "Doe"<br/>}
        
        Flarum->>Browser: Set-Cookie: flarum_session=abc123...<br/>User logged into Flarum
        
        Note over Browser: 🍪 Browser now holds:<br/>• Flarum session cookie<br/>• NO access tokens (server-only)<br/>• Standard web session
    end
```