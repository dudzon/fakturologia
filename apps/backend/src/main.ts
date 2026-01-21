import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { HttpExceptionFilter, AllExceptionsFilter } from './common';

/**
 * Bootstrap function initializing NestJS application
 *
 * Configures:
 * 1. Security (helmet, CORS)
 * 2. Global validation (ValidationPipe)
 * 3. Response compression
 * 4. Exception filters
 * 5. Swagger documentation
 * 6. Global API prefix
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get ConfigService to read environment variables
  const configService = app.get(ConfigService);

  // ===== SECURITY =====

  // Helmet adds HTTP headers that increase security
  // e.g., X-Content-Type-Options, X-Frame-Options, etc.
  app.use(helmet());

  // CORS (Cross-Origin Resource Sharing) configuration
  // Allows communication with frontend from different domain
  const allowedOrigins = configService.get<string[]>('cors.origins') || [];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true, // Allows cookie transmission
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ===== COMPRESSION =====

  // Gzip compression reduces HTTP response size

  app.use(compression());

  // ===== EXCEPTION FILTERS =====

  // Global exception filters ensure consistent error response format
  // IMPORTANT: Order matters!
  // - AllExceptionsFilter as fallback (catches everything)
  // - HttpExceptionFilter for HTTP exceptions (more specific)

  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());

  // ===== GLOBAL VALIDATION =====

  // ValidationPipe automatically validates all input data
  // using decorators from class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      // whitelist: true - removes all fields not defined in DTO
      whitelist: true,
      // forbidNonWhitelisted: true - throws error when unknown field is passed
      forbidNonWhitelisted: true,
      // transform: true - automatically transforms payload to DTO instance
      transform: true,
      // transformOptions - options for class-transformer
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ===== GLOBAL PREFIX =====

  // All endpoints will be prefixed with /api/v1
  // e.g., /users/profile will become /api/v1/users/profile
  app.setGlobalPrefix('api/v1');

  // ===== SWAGGER =====

  // Swagger/OpenAPI documentation configuration
  // Documentation will be available at /api/docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Fakturologia API')
    .setDescription(
      'API for invoice application. Handles user profile management, contractors and invoices.',
    )
    .setVersion('1.0')
    // Bearer Token authorization configuration
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token obtained from Supabase Auth',
      },
      'access-token', // Authorization scheme name
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Persists token between refreshes
    },
  });

  // ===== SERVER START =====

  const port = configService.get<number>('port') || 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
}

void bootstrap();
