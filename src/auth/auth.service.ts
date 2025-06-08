// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import * as argon2 from 'argon2';
import { CreateOAuthUserDto } from 'src/users/dtos/create-oauth-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) { }

  /**
   * Validates a user's credentials
    
   * @param email User's email
   * @param password User's password.  The plain-text password passed in, to verify 
    (argon2 runs verify on the hashed pw from the db (user.passwordHash), vs the pw passed in-- 
    which it hashes with the same hashing process in order to check if matches the original stored one)
   * @returns User object without password hash if credentials are valid
   */
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    // Check if user exists AND has a passwordHash (not an OAuth user)
    if (user && user.passwordHash) {
      // Now TypeScript knows passwordHash is defined (not undefined)
      const isPasswordValid = await argon2.verify(user.passwordHash, password);

      if (isPasswordValid) {
        const { passwordHash, ...result } = user;
        return result;
      }
    }

    return null;
  }

  // Add this to your AuthService class
  // auth.service.ts
  async validateGoogleUser(googleUser: {
    email: string;
    firstName: string;
    lastName: string;
    googleId: string;
    accessToken: string;
    refreshToken?: string;
  }): Promise<User> {
    // Create the DTO instance
    const oauthUserDto = new CreateOAuthUserDto();
    oauthUserDto.email = googleUser.email;
    oauthUserDto.firstName = googleUser.firstName;
    oauthUserDto.lastName = googleUser.lastName;
    oauthUserDto.googleId = googleUser.googleId;
    oauthUserDto.provider = 'google';
    oauthUserDto.lastLoginAt = new Date();

    let user = await this.usersService.findByEmail(googleUser.email);

    if (!user) {
      user = await this.usersService.createOAuthUser(oauthUserDto);
    } else {
      // Update existing user
      user = await this.usersService.update(user.id, {
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
        googleId: googleUser.googleId,
        lastLoginAt: new Date(),
      });
    }

    return user;
  }

  /**
   * Generates JWT token after successful authentication
   * @param user Authenticated user
   * @returns Object containing the access token
   */
  async login(user: any) {
    /* Define the payload to be included in the JWT
    * The JWT payload contains the user's email and ID (as "sub" which stands for "subject" in JWT terminology).
    * Later, we'll enhance this to include application memberships and roles.
    */
    const payload = {
      email: user.email,
      sub: user.id, // JWT standard for "subject" - the user this token represents
      // Later we'll add app memberships and roles here
    };

    // Return the signed JWT
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}