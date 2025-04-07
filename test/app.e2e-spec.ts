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
    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
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
          email: 'test@example.com',
          password: 'WrongPassword'
        })
        .expect(401);
    });
  });

  describe('User Management', () => {
    it('should retrieve user details', async () => {
      await request(app.getHttpServer())
        .get(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should delete user', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});