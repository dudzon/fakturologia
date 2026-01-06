import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

/**
 * AuthModule - Module handling user authentication
 *
 * This module provides:
 * - User registration with email verification
 * - Login/logout functionality
 * - JWT token management (refresh)
 * - Password recovery (forgot/reset)
 *
 * Endpoints:
 * - POST /auth/register        - Register new user
 * - POST /auth/login           - User login
 * - POST /auth/logout          - User logout (protected)
 * - POST /auth/refresh         - Refresh access token
 * - POST /auth/forgot-password - Request password reset
 * - POST /auth/reset-password  - Execute password reset
 *
 * All endpoints except logout are public (no JWT required).
 * Authentication is handled by Supabase Auth.
 */
@Module({
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
