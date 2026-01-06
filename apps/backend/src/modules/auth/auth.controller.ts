import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  RegisterResponseDto,
  LoginResponseDto,
  RefreshResponseDto,
  MessageResponseDto,
} from './dto';
import { JwtAuthGuard, Public } from '../../common';

/**
 * AuthController - Handles all authentication endpoints
 *
 * Endpoints:
 * - POST /auth/register      - User registration (public)
 * - POST /auth/login         - User login (public)
 * - POST /auth/logout        - User logout (protected)
 * - POST /auth/refresh       - Token refresh (public)
 * - POST /auth/forgot-password - Request password reset (public)
 * - POST /auth/reset-password  - Execute password reset (public)
 *
 * All public endpoints are marked with @Public() decorator.
 * The logout endpoint requires a valid JWT token.
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/v1/auth/register
   *
   * Register a new user account.
   * Sends verification email to the provided address.
   */
  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register new user',
    description:
      'Creates a new user account. A verification email will be sent to the provided email address.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: RegisterResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid email format or password too short',
  })
  @ApiResponse({
    status: 409,
    description: 'Email is already registered',
  })
  async register(@Body() dto: RegisterDto): Promise<RegisterResponseDto> {
    return this.authService.register(dto);
  }

  /**
   * POST /api/v1/auth/login
   *
   * Authenticate user and return JWT tokens.
   */
  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login',
    description:
      'Authenticates user with email and password. Returns access and refresh tokens.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid email or password',
  })
  @ApiResponse({
    status: 403,
    description: 'Email not verified',
  })
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(dto);
  }

  /**
   * POST /api/v1/auth/logout
   *
   * Invalidate current session.
   * Requires valid JWT token in Authorization header.
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'User logout',
    description: 'Invalidates the current session. Requires valid JWT token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged out',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or missing token',
  })
  async logout(
    @Headers('authorization') authHeader: string,
  ): Promise<MessageResponseDto> {
    // Extract token from "Bearer <token>" header
    const token = authHeader?.replace('Bearer ', '');
    return this.authService.logout(token);
  }

  /**
   * POST /api/v1/auth/refresh
   *
   * Get new access token using refresh token.
   */
  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Exchanges refresh token for new access and refresh tokens. Implements token rotation.',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: RefreshResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
  })
  async refreshToken(
    @Body() dto: RefreshTokenDto,
  ): Promise<RefreshResponseDto> {
    return this.authService.refreshToken(dto);
  }

  /**
   * POST /api/v1/auth/forgot-password
   *
   * Request password reset email.
   * Always returns success to prevent email enumeration.
   */
  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset',
    description:
      'Sends password reset email if account exists. Always returns success to prevent email enumeration.',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent (if account exists)',
    type: MessageResponseDto,
  })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<MessageResponseDto> {
    return this.authService.forgotPassword(dto);
  }

  /**
   * POST /api/v1/auth/reset-password
   *
   * Reset password using token from email.
   */
  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password',
    description:
      'Resets user password using the token received via email. Token is single-use.',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password successfully reset',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired reset token',
  })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<MessageResponseDto> {
    return this.authService.resetPassword(dto);
  }
}
