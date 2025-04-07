import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should call authService.login', async () => {
      const mockRequest = { user: { id: '1', email: 'test@example.com' } };
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123'
      };

      mockAuthService.login.mockResolvedValue({ access_token: 'test-token' });

      const result = await controller.login(mockRequest, loginDto);

      expect(authService.login).toHaveBeenCalledWith(mockRequest.user);
      expect(result).toEqual({ access_token: 'test-token' });
    });
  });
});