// src/users/users.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateLocalUserDto } from './dtos/create-local-user.dto';
import { CreateOAuthUserDto } from './dtos/create-oauth-user.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';

// Mock the argon2 library
jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  verify: jest.fn().mockResolvedValue(true),
  argon2id: 'argon2id',
}));

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createLocalUser', () => {
    it('should create a new local user', async () => {
      const createLocalUserDto: CreateLocalUserDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const user = {
        id: 'user-id',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        provider: 'local',
        passwordHash: 'hashed_password',
      };

      mockRepository.findOne.mockResolvedValue(null); // User doesn't exist
      mockRepository.create.mockReturnValue(user);
      mockRepository.save.mockResolvedValue(user);

      const result = await service.createLocalUser(createLocalUserDto);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: createLocalUserDto.email },
      });
      expect(mockRepository.create).toHaveBeenCalledWith({
        email: createLocalUserDto.email,
        firstName: createLocalUserDto.firstName,
        lastName: createLocalUserDto.lastName,
        passwordHash: 'hashed_password',
        provider: 'local',
      });
      expect(mockRepository.save).toHaveBeenCalledWith(user);
      expect(result).toEqual(user);
    });

    it('should throw a conflict exception if user already exists', async () => {
      const createLocalUserDto: CreateLocalUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockRepository.findOne.mockResolvedValue({ id: 'existing-id' });

      await expect(service.createLocalUser(createLocalUserDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('createOAuthUser', () => {
    it('should create a new OAuth user', async () => {
      const createOAuthUserDto: CreateOAuthUserDto = {
        email: 'test@example.com',
        provider: 'google',
        googleId: 'google-123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const user = {
        id: 'user-id',
        email: 'test@example.com',
        provider: 'google',
        googleId: 'google-123',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockRepository.create.mockReturnValue(user);
      mockRepository.save.mockResolvedValue(user);

      const result = await service.createOAuthUser(createOAuthUserDto);

      expect(mockRepository.create).toHaveBeenCalledWith(createOAuthUserDto);
      expect(mockRepository.save).toHaveBeenCalledWith(user);
      expect(result).toEqual(user);
    });
  });

  describe('findByEmail', () => {
    it('should return a user if found', async () => {
      const user = { id: 'user-id', email: 'test@example.com' };
      mockRepository.findOne.mockResolvedValue(user);

      const result = await service.findByEmail('test@example.com');
      expect(result).toEqual(user);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return null if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');
      expect(result).toBeNull();
    });
  });

  describe('findByGoogleId', () => {
    it('should return a user if found', async () => {
      const user = { id: 'user-id', googleId: 'google-123' };
      mockRepository.findOne.mockResolvedValue(user);

      const result = await service.findByGoogleId('google-123');
      expect(result).toEqual(user);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { googleId: 'google-123' },
      });
    });

    it('should return null if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByGoogleId('nonexistent-google-id');
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return a user if found', async () => {
      const user = { id: 'user-id', email: 'test@example.com' };
      mockRepository.findOne.mockResolvedValue(user);

      const result = await service.findById('user-id');
      expect(result).toEqual(user);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-id' },
      });
    });

    it('should return null if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findById('nonexistent-id');
      expect(result).toBeNull();
    });
  });

  describe('findOne', () => {
    it('should return a user if found (alias for findById)', async () => {
      const user = { id: 'user-id', email: 'test@example.com' };
      mockRepository.findOne.mockResolvedValue(user);

      const result = await service.findOne('user-id');
      expect(result).toEqual(user);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-id' },
      });
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [
        { id: 'user-id-1', email: 'test1@example.com' },
        { id: 'user-id-2', email: 'test2@example.com' },
      ];
      mockRepository.find.mockResolvedValue(users);

      const result = await service.findAll();
      expect(result).toEqual(users);
      expect(mockRepository.find).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update and return the user', async () => {
      const updateData = { firstName: 'Jane' };
      const updatedUser = {
        id: 'user-id',
        email: 'test@example.com',
        firstName: 'Jane',
      };

      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRepository.findOne.mockResolvedValue(updatedUser);

      const result = await service.update('user-id', updateData);

      expect(mockRepository.update).toHaveBeenCalledWith('user-id', updateData);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-id' },
      });
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException if user not found after update', async () => {
      const updateData = { firstName: 'Jane' };

      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent-id', updateData)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove('user-id');
      expect(mockRepository.delete).toHaveBeenCalledWith('user-id');
    });
  });
});