import { Test, TestingModule } from '@nestjs/testing';
import { AuthClientController } from './auth-client.controller';
import { AuthClientService } from './auth-client.service';
import { LoginDto } from './dto/login.dto';

describe('AuthClientController', () => {
  let controller: AuthClientController;
  let authClientService: AuthClientService;

  const mockAuthService = {
    login: jest.fn(),
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthClientController],
      providers: [
        {
          provide: AuthClientService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthClientController>(AuthClientController);
    authClientService = module.get<AuthClientService>(AuthClientService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should call authClientService.login', async () => {
      const mockRequest = { user: { id: '1', email: 'test@example.com' } };
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123'
      };

      mockAuthService.login.mockResolvedValue({ access_token: 'test-token' });

      const result = await controller.login(mockRequest, loginDto);

      expect(authClientService.login).toHaveBeenCalledWith(mockRequest.user);
      expect(result).toEqual({ access_token: 'test-token' });
    });
  });
});