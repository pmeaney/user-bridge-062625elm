// src/users/dtos/create-oauth-user.dto.ts
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsDate } from 'class-validator';

/**
 * DTO for creating users via OAuth providers (Google, GitHub, etc.)
 * This is used internally by the auth service, not exposed to public API
 */
export class CreateOAuthUserDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'OAuth provider is required' })
  provider: string;  // 'google', 'github', etc.

  @IsString()
  @IsNotEmpty({ message: 'Provider ID is required' })
  googleId: string;  // Or make this dynamic based on provider

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsDate()
  @IsOptional()
  lastLoginAt?: Date;
}