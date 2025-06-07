// src/users/dtos/create-oauth-user.dto.ts
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsDate } from 'class-validator';

/**
 * DTO for creating users via OAuth providers (Google, GitHub, etc.)
 * This is used internally by the auth service, not exposed to public API
 */
export class CreateOAuthUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  googleId: string;

  @IsString()
  @IsNotEmpty()
  provider: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsDate()
  @IsNotEmpty()
  lastLoginAt: Date;
}