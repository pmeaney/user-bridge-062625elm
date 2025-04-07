// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Apply global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strip properties not defined in DTOs
    transform: true, // Automatically transforms payloads to DTO instances
    forbidNonWhitelisted: true, // Throws errors on unknown properties
  }));

  // Enable CORS
  app.enableCors({
    origin: true, // Allow all origins for now (can be customized later)
    credentials: true, // Allow credentials
  });

  await app.listen(3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();