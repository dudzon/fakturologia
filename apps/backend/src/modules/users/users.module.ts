import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

/**
 * UsersModule - Module handling user profiles
 *
 * In NestJS architecture, modules group related functionality.
 * This module contains:
 * - UsersController - handles HTTP requests for /users/*
 * - UsersService - business logic and communication with Supabase
 *
 * Endpoints:
 * - GET  /users/profile      - get profile
 * - PUT  /users/profile      - update profile
 * - POST /users/profile/logo - upload logo
 * - DELETE /users/profile/logo - delete logo
 */
@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Export service for other modules
})
export class UsersModule {}
