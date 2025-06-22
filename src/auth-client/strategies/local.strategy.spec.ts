import { Test, TestingModule } from '@nestjs/testing';
import { LocalStrategy } from './local.strategy';
import { AuthClientService } from '../auth-client.service';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let authClientService: AuthClientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: AuthClientService,
          useValue: {
            validateUser: jest.fn()
          }
        }
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
    authClientService = module.get<AuthClientService>(AuthClientService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });
});