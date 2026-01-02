import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { validate } from './config/env.validation';
import { UsersModule } from './modules/users/users.module';

/**
 * Główny moduł aplikacji (AppModule)
 *
 * W NestJS każda aplikacja ma jeden główny moduł (root module).
 * Jest to punkt wejścia, który importuje i konfiguruje wszystkie inne moduły.
 *
 * @decorator @Module - definiuje moduł NestJS
 *   - imports: inne moduły, których funkcjonalność chcemy używać
 *   - controllers: kontrolery obsługujące żądania HTTP
 *   - providers: serwisy i inne dostawcy (dependency injection)
 *   - exports: elementy udostępniane innym modułom (tutaj nie używane)
 */
@Module({
  imports: [
    /**
     * ConfigModule - moduł do zarządzania konfiguracją
     *
     * forRoot() - metoda statyczna konfigurująca moduł jako globalny
     * - isGlobal: true - ConfigService będzie dostępny w całej aplikacji
     *   bez potrzeby importowania ConfigModule w każdym module
     * - load: [configuration] - ładuje funkcję konfiguracji z configuration.ts
     * - validate: funkcja walidująca zmienne środowiskowe
     * - envFilePath: określa gdzie szukać plików .env
     *   - szuka najpierw .env.{NODE_ENV} (np. .env.development)
     *   - potem .env jako fallback
     */
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
    }),

    /**
     * UsersModule - moduł obsługujący profile użytkowników
     * Zawiera endpointy: GET/PUT /profile, POST/DELETE /profile/logo
     */
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
