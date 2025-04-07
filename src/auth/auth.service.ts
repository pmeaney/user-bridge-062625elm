// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as argon2 from 'argon2';

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
    // Find the user by email
    const user = await this.usersService.findByEmail(email);

    // If user exists and password matches
    if (user && await argon2.verify(user.passwordHash, password)) {
      // Return user without the password hash
      const { passwordHash, ...result } = user;
      return result;
    }

    // If credentials are invalid
    return null;
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
      sub: user.id,
      // Later we'll add app memberships and roles here
    };

    // Return the signed JWT
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}