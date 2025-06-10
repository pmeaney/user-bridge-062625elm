// test/auth-google.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

describe('Google OAuth Authentication (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';

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
            dropSchema: true, // This ensures a clean database for each test run
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

  // Clean up users between tests
  beforeEach(async () => {
    // Clear all users before each test to avoid conflicts
    try {
      await request(app.getHttpServer())
        .get('/users')
        .then(async (response) => {
          if (response.body && Array.isArray(response.body)) {
            for (const user of response.body) {
              await request(app.getHttpServer())
                .delete(`/users/${user.id}`)
                .catch(() => { }); // Ignore errors during cleanup
            }
          }
        })
        .catch(() => { }); // Ignore errors if no users exist
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Google OAuth Flow Simulation', () => {
    const newGoogleUser = {
      email: 'newuser@gmail.com',
      firstName: 'John',
      lastName: 'Doe',
      googleId: 'google-12345',
      accessToken: 'mock-access-token',
    };

    const existingGoogleUser = {
      email: 'existing@gmail.com',
      firstName: 'Jane',
      lastName: 'Smith',
      googleId: 'google-67890',
      accessToken: 'mock-access-token',
    };

    it('should create new user via Google OAuth', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/google/test-callback')
        .send(newGoogleUser)
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(typeof response.body.access_token).toBe('string');

      // Verify user was created in database
      const users = await request(app.getHttpServer())
        .get('/users')
        .expect(200);

      const createdUser = users.body.find(u => u.email === 'newuser@gmail.com');
      expect(createdUser).toBeDefined();
      expect(createdUser.provider).toBe('google');
      expect(createdUser.googleId).toBe('google-12345');
      expect(createdUser.firstName).toBe('John');
      expect(createdUser.lastName).toBe('Doe');
      expect(createdUser.passwordHash).toBeFalsy(); // OAuth users don't have passwords (null or undefined)
    });

    it('should login existing Google user and update info', async () => {
      // First login creates the user
      const firstLogin = await request(app.getHttpServer())
        .post('/auth/google/test-callback')
        .send(existingGoogleUser)
        .expect(200);

      expect(firstLogin.body).toHaveProperty('access_token');

      // Second login with updated info should update existing user
      const updatedUser = {
        ...existingGoogleUser,
        firstName: 'Updated Jane',
        lastName: 'Updated Smith',
      };

      const secondLogin = await request(app.getHttpServer())
        .post('/auth/google/test-callback')
        .send(updatedUser)
        .expect(200);

      expect(secondLogin.body).toHaveProperty('access_token');

      // Verify user was updated, not duplicated
      const users = await request(app.getHttpServer())
        .get('/users')
        .expect(200);

      const existingUsers = users.body.filter(u => u.email === 'existing@gmail.com');
      expect(existingUsers).toHaveLength(1); // Should be only one user with this email

      const updatedUserInDb = existingUsers[0];
      expect(updatedUserInDb.firstName).toBe('Updated Jane');
      expect(updatedUserInDb.lastName).toBe('Updated Smith');
    });

    it('should handle Google user with minimal info', async () => {
      const minimalGoogleUser = {
        email: 'minimal@gmail.com',
        googleId: 'google-minimal',
        accessToken: 'mock-access-token',
        // No firstName or lastName
      };

      const response = await request(app.getHttpServer())
        .post('/auth/google/test-callback')
        .send(minimalGoogleUser)
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
    });

    it('should reject test endpoint in non-test environment', async () => {
      // Temporarily change environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      await request(app.getHttpServer())
        .post('/auth/google/test-callback')
        .send(newGoogleUser)
        .expect(403);

      // Restore test environment
      process.env.NODE_ENV = originalEnv;
    });

    it('should handle invalid Google user data', async () => {
      const invalidGoogleUser = {
        // Missing required fields
        firstName: 'John',
        lastName: 'Doe',
        // No email, googleId, or accessToken
      };

      await request(app.getHttpServer())
        .post('/auth/google/test-callback')
        .send(invalidGoogleUser)
        .expect(403); // Our validation throws 403 for missing required fields
    });
  });

  afterAll(async () => {
    await app.close();
    // Reset environment
    delete process.env.NODE_ENV;
  });
});