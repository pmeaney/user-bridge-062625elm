// src/auth/strategies/jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      // Extract JWT from Authorization header
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Reject expired tokens
      ignoreExpiration: false,
      // Secret used to verify the token's signature
      secretOrKey: configService.get<string>('JWT_SECRET') || '',
      passReqToCallback: false
    });
  }

  /**
   * Validates and transforms JWT payload into user object
   * Called automatically by Passport when using JwtAuthClientGuard
   */
  async validate(payload: any) {
    // Return user data from payload
    // This becomes available as req.user in controllers
    return {
      userId: payload.sub,
      email: payload.email,
      // We'll add app memberships and roles here later
    };
  }
}