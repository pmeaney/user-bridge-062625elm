// src/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  NotFoundException,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateLocalUserDto } from './dtos/create-local-user.dto';
import { User } from './entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  /**
   * Get all users (optional - typically would be admin-only)
   */
  @Get()
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  /**
   * Get a specific user by ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<User> {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  /**
   * Register a new user with email/password
   * Note: OAuth users are created internally by AuthService, not through this endpoint
   * (i.e. SSO Oauth services are responsible for creating their own users-- i.e. you create a google account and that becomes your sso user,
   *  hence, we only handle creation of users when they use local login/registration strategy)
   * - Alternatively, we could create a more clear endpoint name, if we really felt the need:
   *    You could setup /users/register (POST) instead of this /users (POST) to make it super clear "this is a user registration endpoint"
   *    but we'll just recognize that when we post to /users it create a new user.
   */
  @Post()
  create(@Body() createLocalUserDto: CreateLocalUserDto): Promise<User> {
    return this.usersService.createLocalUser(createLocalUserDto);
  }

  /**
   * Alternative endpoint name for clarity (optional)
   * You can use either /users (POST) or /users/register (POST)
   */
  @Post('register')
  register(@Body() createLocalUserDto: CreateLocalUserDto): Promise<User> {
    return this.usersService.createLocalUser(createLocalUserDto);
  }

  /**
   * Delete a user
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return this.usersService.remove(id);
  }
}