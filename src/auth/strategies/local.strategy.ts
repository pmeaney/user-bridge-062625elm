// src/auth/strategies/local.strategy.ts
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { Strategy } from "passport-local";
import { PassportStrategy } from "@nestjs/passport";
import { AuthService } from "../auth.service";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    // Configure the strategy to use email field instead of default 'username'
    super({ usernameField: 'email' });
  }

  /**
   * Validates user credentials through the auth service
   * This is called automatically by Passport when using the LocalAuthGuard
   */
  async validate(email: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }
}