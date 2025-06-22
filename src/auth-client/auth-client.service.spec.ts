// src/auth/auth-client.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthClientService } from './auth-client.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

// Mock argon2
jest.mock('argon2', () => ({
  verify: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthClientService', () => {
  let service: AuthClientService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let configService: ConfigService;

  // Create mock implementations
  const mockUsersService = {
    findByEmail: jest.fn(),
    findByGoogleId: jest.fn(),
    createOAuthUser: jest.fn(),
    update: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthClientService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthClientService>(AuthClientService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getEnvVars', () => {
    it('should return environment variables', () => {
      mockConfigService.get
        .mockReturnValueOnce('google-client-id')
        .mockReturnValueOnce('google-client-secret')
        .mockReturnValueOnce('http://localhost:3000/auth/google/callback');

      const result = service.getEnvVars();

      expect(result).toEqual({
        googleClientId: 'google-client-id',
        googleClientSecret: 'google-client-secret',
        googleCallbackUrl: 'http://localhost:3000/auth/google/callback',
      });
    });
  });

  describe('validateUser', () => {
    const argon2 = require('argon2');

    it('should return user without password hash if credentials are valid', async () => {
      const user = {
        id: 'user-id',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockUsersService.findByEmail.mockResolvedValue(user);
      argon2.verify.mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password123');

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(argon2.verify).toHaveBeenCalledWith('hashed_password', 'password123');
      expect(result).toEqual({
        id: 'user-id',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });
    });

    it('should return null if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser('test@example.com', 'password123');

      expect(result).toBeNull();
    });

    it('should return null if user has no password hash (OAuth user)', async () => {
      const oauthUser = {
        id: 'user-id',
        email: 'test@example.com',
        googleId: 'google-123',
        provider: 'google',
        // No passwordHash
      };

      mockUsersService.findByEmail.mockResolvedValue(oauthUser);

      const result = await service.validateUser('test@example.com', 'password123');

      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      const user = {
        id: 'user-id',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
      };

      mockUsersService.findByEmail.mockResolvedValue(user);
      argon2.verify.mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('validateGoogleUser', () => {
    it('should create new user if not found', async () => {
      const googleUser = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        googleId: 'google-123',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      const createdUser = {
        id: 'user-id',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        googleId: 'google-123',
        provider: 'google',
      };

      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.createOAuthUser.mockResolvedValue(createdUser);

      const result = await service.validateGoogleUser(googleUser);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockUsersService.createOAuthUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          googleId: 'google-123',
          provider: 'google',
        })
      );
      expect(result).toEqual(createdUser);
    });

    it('should update existing user if found', async () => {
      const googleUser = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        googleId: 'google-123',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      const existingUser = {
        id: 'user-id',
        email: 'test@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
      };

      const updatedUser = {
        id: 'user-id',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        googleId: 'google-123',
      };

      mockUsersService.findByEmail.mockResolvedValue(existingUser);
      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await service.validateGoogleUser(googleUser);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockUsersService.update).toHaveBeenCalledWith('user-id', {
        firstName: 'John',
        lastName: 'Doe',
        googleId: 'google-123',
        lastLoginAt: expect.any(Date),
      });
      expect(result).toEqual(updatedUser);
    });
  });

  describe('login', () => {
    it('should return access token', async () => {
      const user = {
        id: 'user-id',
        email: 'test@example.com',
      };

      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login(user);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: 'test@example.com',
        sub: 'user-id',
      });
      expect(result).toEqual({
        access_token: 'jwt-token',
      });
    });
  });
});