import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import compression from 'compression';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('Bootstrap');

  // Global prefix
  app.setGlobalPrefix('api');

  // Serve static files from uploads directory
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  // Security headers with helmet
  app.use(helmet());

  // Response compression
  app.use(compression());

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Global exception filter for consistent error responses
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Real Estate Platform API')
    .setDescription('Comprehensive API for Uzbekistan real estate platform with properties, agents, agencies, messaging, and more')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token',
      },
      'JWT-auth',
    )
    .addTag('Authentication', 'User authentication and OAuth endpoints')
    .addTag('Search', 'Advanced search with Elasticsearch, autocomplete, and suggestions')
    .addTag('Properties', 'Property listings CRUD and search')
    .addTag('Agents', 'Real estate agent profiles and directory')
    .addTag('Agencies', 'Real estate agency management')
    .addTag('Favorites', 'User favorite properties')
    .addTag('Messages', 'Real-time messaging between users')
    .addTag('Saved Searches', 'User saved search filters with notifications')
    .addTag('Reviews', 'Property reviews and ratings')
    .addTag('Viewings', 'Property viewing appointments')
    .addTag('Upload', 'File upload to Cloudflare R2')
    .addTag('Admin', 'Administrative operations')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Real Estate API Docs',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = process.env.API_PORT || 3001;
  await app.listen(port);

  logger.log(`API running on http://localhost:${port}/api`);
  logger.log(`Swagger documentation available at http://localhost:${port}/api/docs`);
}
void bootstrap();
