// src/auth/strategies/google.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') || '',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || '',
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') || '',
      scope: ['email', 'profile'],
      passReqToCallback: false,
    });
  }

  /**
   * Validates Google OAuth user and either creates or retrieves existing user
   * Called automatically by Passport after successful Google authentication
   */
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const { name, emails, photos } = profile;

      const user = {
        email: emails[0].value,
        firstName: name.givenName,
        lastName: name.familyName,
        googleId: profile.id,
        accessToken,
        refreshToken,
      };

      // You'll need to implement this method in your AuthService
      const validatedUser = await this.authService.validateGoogleUser(user);

      done(null, validatedUser);
    } catch (error) {
      done(error, false);
    }
  }
}