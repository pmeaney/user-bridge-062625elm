// src/users/users.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateLocalUserDto } from './dtos/create-local-user.dto';
import { CreateOAuthUserDto } from './dtos/create-oauth-user.dto';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  /**
   * Create a new user with email/password authentication
   */
  async createLocalUser(createLocalUserDto: CreateLocalUserDto): Promise<User> {
    // Check if user already exists
    const existingUser = await this.findByEmail(createLocalUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash the password before saving
    const passwordHash = await argon2.hash(createLocalUserDto.password);

    const user = this.userRepository.create({
      email: createLocalUserDto.email,
      firstName: createLocalUserDto.firstName,
      lastName: createLocalUserDto.lastName,
      passwordHash,
      provider: 'local',
    });

    return this.userRepository.save(user);
  }

  /**
   * Create a new OAuth user (Google, etc.)
   */
  async createOAuthUser(createOAuthUserDto: CreateOAuthUserDto): Promise<User> {
    const user = this.userRepository.create(createOAuthUserDto);
    return this.userRepository.save(user);
  }

  /**
   * Find a user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  /**
   * Find a user by Google ID
   */
  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { googleId } });
  }

  /**
   * Find a user by ID
   */
  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  /**
   * Find a user by ID (alias for findById to match controller)
   */
  async findOne(id: string): Promise<User | null> {
    return this.findById(id);
  }

  /**
   * Update a user
   */
  async update(id: string, updateData: Partial<User>): Promise<User> {
    await this.userRepository.update(id, updateData);
    const updatedUser = await this.userRepository.findOne({ where: { id } });

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return updatedUser;
  }

  /**
   * Remove a user
   */
  async remove(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }

  /**
   * Get all users (optional - for admin purposes)
   */
  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }
}