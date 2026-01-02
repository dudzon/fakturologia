import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { HttpExceptionFilter, AllExceptionsFilter } from './common';

/**
 * Funkcja bootstrap inicjalizująca aplikację NestJS
 *
 * Konfiguruje:
 * 1. Bezpieczeństwo (helmet, CORS)
 * 2. Walidację globalną (ValidationPipe)
 * 3. Kompresję odpowiedzi
 * 4. Filtry wyjątków
 * 5. Dokumentację Swagger
 * 6. Globalny prefix API
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Pobierz ConfigService do odczytu zmiennych środowiskowych
  const configService = app.get(ConfigService);

  // ===== BEZPIECZEŃSTWO =====

  // Helmet dodaje nagłówki HTTP zwiększające bezpieczeństwo
  // np. X-Content-Type-Options, X-Frame-Options, etc.
  app.use(helmet());

  // Konfiguracja CORS (Cross-Origin Resource Sharing)
  // Pozwala na komunikację z frontendem z innej domeny
  const allowedOrigins = configService.get<string[]>('cors.origins') || [];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true, // Pozwala na przesyłanie cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ===== KOMPRESJA =====

  // Kompresja gzip zmniejsza rozmiar odpowiedzi HTTP
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  app.use(compression());

  // ===== FILTRY WYJĄTKÓW =====

  // Globalne filtry wyjątków zapewniają spójny format odpowiedzi błędów
  // WAŻNE: Kolejność ma znaczenie!
  // - AllExceptionsFilter jako fallback (przechwytuje wszystko)
  // - HttpExceptionFilter dla wyjątków HTTP (bardziej szczegółowy)
  /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call */
  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());
  /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call */

  // ===== WALIDACJA GLOBALNA =====

  // ValidationPipe automatycznie waliduje wszystkie dane wejściowe
  // używając dekoratorów z class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      // whitelist: true - usuwa wszystkie pola, które nie są zdefiniowane w DTO
      whitelist: true,
      // forbidNonWhitelisted: true - rzuca błąd gdy przekazano nieznane pole
      forbidNonWhitelisted: true,
      // transform: true - automatycznie transformuje payload na instancję DTO
      transform: true,
      // transformOptions - opcje dla class-transformer
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ===== GLOBALNY PREFIX =====

  // Wszystkie endpointy będą poprzedzone /api/v1
  // np. /users/profile stanie się /api/v1/users/profile
  app.setGlobalPrefix('api/v1');

  // ===== SWAGGER =====

  // Konfiguracja dokumentacji Swagger/OpenAPI
  // Dokumentacja będzie dostępna pod /api/docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Fakturologia API')
    .setDescription(
      'API dla aplikacji do wystawiania faktur. Obsługuje zarządzanie profilami użytkowników, kontrahentami i fakturami.',
    )
    .setVersion('1.0')
    // Konfiguracja autoryzacji Bearer Token
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Wprowadź token JWT otrzymany z Supabase Auth',
      },
      'access-token', // Nazwa schematu autoryzacji
    )
    .addTag('Users', 'Zarządzanie profilem użytkownika')
    .addTag('Health', 'Sprawdzanie stanu aplikacji')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Zachowuje token między odświeżeniami
    },
  });

  // ===== START SERWERA =====

  const port = configService.get<number>('port') || 3000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
}

void bootstrap();
