import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';
import { join } from 'path';
import express from 'express';
import { ServeStaticFilesMiddleware } from './static-files.middleware';



async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.enableCors({
    origin: 'http://localhost:3000', // Replace with the origin of your client-side application
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  app.use('/uploads', new ServeStaticFilesMiddleware().use);
  
  await app.listen(4000);
}
bootstrap();
