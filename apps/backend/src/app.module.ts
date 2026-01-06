import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { validate } from './config/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ContractorsModule } from './modules/contractors/contractors.module';
import { InvoicesModule } from './modules/invoices/invoices.module';

/**
 * Main application module (AppModule)
 *
 * In NestJS every application has one main module (root module).
 * It is the entry point that imports and configures all other modules.
 *
 * @decorator @Module - defines a NestJS module
 *   - imports: other modules whose functionality we want to use
 *   - controllers: controllers handling HTTP requests
 *   - providers: services and other providers (dependency injection)
 *   - exports: elements exposed to other modules (not used here)
 */
@Module({
  imports: [
    /**
     * ConfigModule - module for configuration management
     *
     * forRoot() - static method configuring module as global
     * - isGlobal: true - ConfigService will be available across entire application
     *   without need to import ConfigModule in every module
     * - load: [configuration] - loads configuration function from configuration.ts
     * - validate: function validating environment variables
     * - envFilePath: specifies where to look for .env files
     *   - looks first for .env.{NODE_ENV} (e.g., .env.development)
     *   - then .env as fallback
     */
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
    }),

    /**
     * AuthModule - module handling user authentication
     * Contains endpoints: POST /auth/register, /auth/login, /auth/logout,
     * /auth/refresh, /auth/forgot-password, /auth/reset-password
     */
    AuthModule,

    /**
     * UsersModule - module handling user profiles
     * Contains endpoints: GET/PUT /profile, POST/DELETE /profile/logo
     */
    UsersModule,

    /**
     * ContractorsModule - module handling contractors (invoice buyers)
     * Contains endpoints: GET/POST /contractors, GET/PUT/DELETE /contractors/:id
     */
    ContractorsModule,

    /**
     * InvoicesModule - module handling invoices
     * Contains endpoints: GET/POST /invoices, GET/PUT/DELETE /invoices/:id,
     * GET /invoices/next-number, PATCH /invoices/:id/status, POST /invoices/:id/duplicate
     */
    InvoicesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
