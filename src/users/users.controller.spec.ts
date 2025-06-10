// src/users/users.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateLocalUserDto } from './dtos/create-local-user.dto';
import { NotFoundException } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUserService = {
    createLocalUser: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
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
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserService.createLocalUser.mockResolvedValue(user);

      const result = await controller.create(createLocalUserDto);
      expect(result).toEqual(user);
      expect(mockUserService.createLocalUser).toHaveBeenCalledWith(createLocalUserDto);
    });
  });

  describe('register', () => {
    it('should register a new user (alternative endpoint)', async () => {
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
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserService.createLocalUser.mockResolvedValue(user);

      const result = await controller.register(createLocalUserDto);
      expect(result).toEqual(user);
      expect(mockUserService.createLocalUser).toHaveBeenCalledWith(createLocalUserDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [
        { id: 'user-id-1', email: 'test1@example.com' },
        { id: 'user-id-2', email: 'test2@example.com' },
      ];
      mockUserService.findAll.mockResolvedValue(users);

      const result = await controller.findAll();
      expect(result).toEqual(users);
      expect(mockUserService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user if found', async () => {
      const user = {
        id: 'user-id',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      };
      mockUserService.findOne.mockResolvedValue(user);

      const result = await controller.findOne('user-id');
      expect(result).toEqual(user);
      expect(mockUserService.findOne).toHaveBeenCalledWith('user-id');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserService.findOne.mockResolvedValue(null);

      await expect(controller.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockUserService.findOne).toHaveBeenCalledWith('non-existent-id');
    });
  });

  describe('remove', () => {
    it('should remove a user if found', async () => {
      const user = {
        id: 'user-id',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      };

      mockUserService.findOne.mockResolvedValue(user);
      mockUserService.remove.mockResolvedValue(undefined);

      await controller.remove('user-id');
      expect(mockUserService.findOne).toHaveBeenCalledWith('user-id');
      expect(mockUserService.remove).toHaveBeenCalledWith('user-id');
    });

    it('should throw NotFoundException if user to delete not found', async () => {
      mockUserService.findOne.mockResolvedValue(null);

      await expect(controller.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockUserService.findOne).toHaveBeenCalledWith('non-existent-id');
      expect(mockUserService.remove).not.toHaveBeenCalled();
    });
  });
});