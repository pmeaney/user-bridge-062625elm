// test/app.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

describe('User Authentication Flow (e2e)', () => {
  let app: INestApplication;
  let createdUserId: string;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            type: 'postgres',
            host: configService.get('DB_HOST', 'localhost'),
            port: configService.get<number>('DB_PORT', 5432),
            username: configService.get('DB_USERNAME', 'postgres'),
            password: configService.get('DB_PASSWORD', 'postgres'),
            database: configService.get('DB_DATABASE', 'user_bridge_test'),
            entities: [__dirname + '/../**/*.entity{.ts,.js}'],
            synchronize: true,
            dropSchema: true, // Clean database for each test run
          }),
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }));

    await app.init();
  });

  // Clean up between tests
  beforeEach(async () => {
    // Clear all users before each test to avoid conflicts
    try {
      const users = await request(app.getHttpServer()).get('/users');
      if (users.body && Array.isArray(users.body)) {
        for (const user of users.body) {
          await request(app.getHttpServer())
            .delete(`/users/${user.id}`)
            .catch(() => { }); // Ignore errors during cleanup
        }
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should return welcome message', async () => {
    const response = await request(app.getHttpServer())
      .get('/')
      .expect(200);

    expect(response.text).toBe('Welcome to user-bridge - a centralized authentication service');
  });

  describe('User Registration', () => {
    const userData = {
      email: 'test@example.com',
      password: 'SecurePassword123!',
      firstName: 'John',
      lastName: 'Doe'
    };

    it('should create a new user successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(userData.email);
      createdUserId = response.body.id;
    });

    it('should reject duplicate email', async () => {
      // First create a user
      await request(app.getHttpServer())
        .post('/users')
        .send(userData)
        .expect(201);

      // Then try to create another with same email
      await request(app.getHttpServer())
        .post('/users')
        .send({
          email: 'test@example.com',
          password: 'AnotherPassword123!'
        })
        .expect(409);
    });

    it('should reject invalid user creation', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .send({
          email: 'invalid-email',
          password: 'short'
        })
        .expect(400);
    });
  });

  describe('Authentication Flow', () => {
    beforeEach(async () => {
      // Create a user for authentication tests
      const userData = {
        email: 'auth-test@example.com',
        password: 'SecurePassword123!',
        firstName: 'Auth',
        lastName: 'User'
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(userData)
        .expect(201);

      createdUserId = response.body.id;
    });

    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'auth-test@example.com',
          password: 'SecurePassword123!'
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      accessToken = response.body.access_token;
    });

    it('should reject login with incorrect password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'auth-test@example.com',
          password: 'WrongPassword'
        })
        .expect(401);
    });
  });

  describe('User Management', () => {
    beforeEach(async () => {
      // Create a user and get auth token for management tests
      const userData = {
        email: 'management-test@example.com',
        password: 'SecurePassword123!',
        firstName: 'Management',
        lastName: 'User'
      };

      const userResponse = await request(app.getHttpServer())
        .post('/users')
        .send(userData)
        .expect(201);

      createdUserId = userResponse.body.id;

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'management-test@example.com',
          password: 'SecurePassword123!'
        })
        .expect(200);

      accessToken = loginResponse.body.access_token;
    });

    it('should retrieve user details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${createdUserId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', createdUserId);
      expect(response.body.email).toBe('management-test@example.com');
    });

    it('should delete user', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${createdUserId}`)
        .expect(204);

      // Verify user is deleted
      await request(app.getHttpServer())
        .get(`/users/${createdUserId}`)
        .expect(404);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});