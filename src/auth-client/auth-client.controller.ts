// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Req,
  ForbiddenException
} from '@nestjs/common';
import { AuthClientService } from './auth-client.service';
import { LocalAuthGuard } from './guards/local-auth-client.guard';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthClientController {
  constructor(private authClientService: AuthClientService) { }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Request() req, @Body() loginDto: LoginDto) {
    // The LocalAuthGuard will validate credentials before this method is called
    return this.authClientService.login(req.user);
  }

  @Get('google')
  @UseGuards(AuthGuard('google')) // google AuthGuard provided by PassportJS
  async googleAuth(@Req() req) {
    // This route starts the OAuth dance
    // The AuthGuard('google') automatically redirects to Google
    // This method body is actually never executed!
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google')) // google AuthGuard provided by PassportJS
  async googleAuthCallback(@Request() req) {
    // Google redirects here after user logs in
    // The AuthGuard('google') processes the callback
    // If successful, req.user contains the validated user
    return this.authClientService.login(req.user);
  }

  // TEST-ONLY ENDPOINT: Simulates Google OAuth callback for testing
  @Post('google/test-callback')
  @HttpCode(HttpStatus.OK)
  async testGoogleCallback(@Body() testGoogleUser: any) {
    // Only allow in test environment for security
    if (process.env.NODE_ENV !== 'test') {
      throw new ForbiddenException('Test endpoint only available in test environment');
    }

    // Validate the required fields
    if (!testGoogleUser.email || !testGoogleUser.googleId) {
      throw new ForbiddenException('Missing required fields: email and googleId');
    }

    // Simulate what the Google strategy would do
    const user = await this.authClientService.validateGoogleUser(testGoogleUser);
    return this.authClientService.login(user);
  }

  @Get('testing')
  async testEnvVars() {
    return this.authClientService.getEnvVars();
  }
}