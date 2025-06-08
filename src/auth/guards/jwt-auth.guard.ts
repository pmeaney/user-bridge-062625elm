// src/auth/guards/jwt-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
Why have this mostly empty file & class?
1. In part, it's for Dependency Injection Compatibility
2. It could also provide Future Extensibility (i.e. we could add logic to limit login attempts to a certain time interval)
3. It's a little cleaner in terms of Mental Context & Code files.
 */

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') { }