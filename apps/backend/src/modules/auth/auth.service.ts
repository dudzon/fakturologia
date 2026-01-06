import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient, AuthError } from '@supabase/supabase-js';
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
import {
  InvalidCredentialsException,
  EmailExistsException,
  EmailNotVerifiedException,
  InvalidRefreshTokenException,
  InvalidResetTokenException,
} from './exceptions';

/**
 * AuthService - Business logic for authentication
 *
 * This service handles all authentication operations using Supabase Auth:
 * - User registration with email verification
 * - Login with email/password
 * - Session management (logout, token refresh)
 * - Password recovery (forgot/reset)
 *
 * Supabase handles:
 * - Password hashing (bcrypt)
 * - JWT token generation and validation
 * - Email verification
 * - Rate limiting for auth operations
 */
@Injectable()
export class AuthService {
  private readonly supabase: SupabaseClient<any, any, any>;
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('supabase.url');
    const supabaseServiceKey = this.configService.get<string>(
      'supabase.serviceRoleKey',
    );

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration is missing');
    }

    // Use service role key for admin operations (registration, etc.)
    this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  /**
   * Register a new user
   *
   * @param dto - Registration data (email, password)
   * @returns RegisterResponseDto with success message and user ID
   * @throws EmailExistsException if email is already registered
   */
  async register(dto: RegisterDto): Promise<RegisterResponseDto> {
    this.logger.log(`Registration attempt for email: ${dto.email}`);

    const { data, error } = await this.supabase.auth.signUp({
      email: dto.email,
      password: dto.password,
    });

    if (error) {
      this.handleSupabaseError(error, 'register');
    }

    if (!data.user) {
      throw new EmailExistsException();
    }

    // Check if user already exists (Supabase returns user with identities: [] if email exists)
    if (data.user.identities && data.user.identities.length === 0) {
      throw new EmailExistsException();
    }

    this.logger.log(`User registered successfully: ${data.user.id}`);

    return {
      message:
        'Registration successful. Please check your email to verify your account.',
      userId: data.user.id,
    };
  }

  /**
   * Login user with email and password
   *
   * @param dto - Login credentials
   * @returns LoginResponseDto with tokens and user info
   * @throws InvalidCredentialsException if credentials are wrong
   * @throws EmailNotVerifiedException if email is not verified
   */
  async login(dto: LoginDto): Promise<LoginResponseDto> {
    this.logger.log(`Login attempt for email: ${dto.email}`);

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error) {
      this.handleSupabaseError(error, 'login');
    }

    if (!data.session || !data.user) {
      throw new InvalidCredentialsException();
    }

    this.logger.log(`User logged in successfully: ${data.user.id}`);

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in ?? 3600,
      user: {
        id: data.user.id,
        email: data.user.email ?? dto.email,
      },
    };
  }

  /**
   * Logout user (invalidate session)
   *
   * @param accessToken - Current access token to invalidate
   * @returns MessageResponseDto with success message
   */
  async logout(accessToken: string): Promise<MessageResponseDto> {
    this.logger.log('Logout attempt');

    // Create a client with the user's token to sign them out
    const supabaseUrl = this.configService.get<string>('supabase.url');
    const supabaseAnonKey = this.configService.get<string>('supabase.anonKey');

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration is missing');
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });

    const { error } = await userClient.auth.signOut();

    if (error) {
      this.logger.warn(`Logout error: ${error.message}`);
      // Don't throw - logout should succeed even if token is already invalid
    }

    this.logger.log('User logged out successfully');

    return {
      message: 'Successfully logged out',
    };
  }

  /**
   * Refresh access token using refresh token
   *
   * @param dto - Contains the refresh token
   * @returns RefreshResponseDto with new tokens
   * @throws InvalidRefreshTokenException if refresh token is invalid
   */
  async refreshToken(dto: RefreshTokenDto): Promise<RefreshResponseDto> {
    this.logger.log('Token refresh attempt');

    const { data, error } = await this.supabase.auth.refreshSession({
      refresh_token: dto.refreshToken,
    });

    if (error) {
      this.handleSupabaseError(error, 'refresh');
    }

    if (!data.session) {
      throw new InvalidRefreshTokenException();
    }

    this.logger.log('Token refreshed successfully');

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in ?? 3600,
    };
  }

  /**
   * Request password reset email
   *
   * Always returns success to prevent email enumeration attacks.
   *
   * @param dto - Contains user email
   * @returns MessageResponseDto with generic success message
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<MessageResponseDto> {
    this.logger.log(`Password reset requested for: ${dto.email}`);

    // Get the redirect URL from config or use default
    const frontendUrl =
      this.configService.get<string>('cors.origins')?.[0] ||
      'http://localhost:4200';
    const redirectTo = `${frontendUrl}/auth/reset-password`;

    const { error } = await this.supabase.auth.resetPasswordForEmail(
      dto.email,
      {
        redirectTo,
      },
    );

    if (error) {
      // Log error but don't expose to client (prevents email enumeration)
      this.logger.warn(`Password reset error: ${error.message}`);
    }

    // Always return success to prevent email enumeration
    return {
      message: 'If the email exists, a password reset link has been sent',
    };
  }

  /**
   * Reset password using token from email
   *
   * @param dto - Contains reset token and new password
   * @returns MessageResponseDto with success message
   * @throws InvalidResetTokenException if token is invalid or expired
   */
  async resetPassword(dto: ResetPasswordDto): Promise<MessageResponseDto> {
    this.logger.log('Password reset attempt');

    // First verify the token by exchanging it for a session
    const { data: sessionData, error: sessionError } =
      await this.supabase.auth.verifyOtp({
        token_hash: dto.token,
        type: 'recovery',
      });

    if (sessionError || !sessionData.session) {
      this.logger.warn(
        `Reset token verification failed: ${sessionError?.message}`,
      );
      throw new InvalidResetTokenException();
    }

    // Now update the password using the session
    const { error: updateError } = await this.supabase.auth.updateUser({
      password: dto.password,
    });

    if (updateError) {
      this.logger.error(`Password update failed: ${updateError.message}`);
      throw new InvalidResetTokenException();
    }

    this.logger.log('Password reset successfully');

    return {
      message: 'Password successfully reset',
    };
  }

  /**
   * Map Supabase auth errors to domain exceptions
   *
   * @param error - Supabase AuthError
   * @param context - Operation context for logging
   * @throws Appropriate domain exception
   */
  private handleSupabaseError(error: AuthError, context: string): never {
    this.logger.warn(`Supabase ${context} error: ${error.message}`);

    const errorMessage = error.message.toLowerCase();

    // Registration errors
    if (
      errorMessage.includes('user already registered') ||
      errorMessage.includes('email already')
    ) {
      throw new EmailExistsException();
    }

    // Login errors
    if (
      errorMessage.includes('invalid login credentials') ||
      errorMessage.includes('invalid email or password')
    ) {
      throw new InvalidCredentialsException();
    }

    // Email verification errors
    if (errorMessage.includes('email not confirmed')) {
      throw new EmailNotVerifiedException();
    }

    // Refresh token errors
    if (
      errorMessage.includes('invalid refresh token') ||
      errorMessage.includes('refresh token not found') ||
      errorMessage.includes('token has expired')
    ) {
      throw new InvalidRefreshTokenException();
    }

    // Reset token errors
    if (
      errorMessage.includes('invalid otp') ||
      errorMessage.includes('otp has expired')
    ) {
      throw new InvalidResetTokenException();
    }

    // Default to invalid credentials for unknown auth errors
    throw new InvalidCredentialsException();
  }
}
