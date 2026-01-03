import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { Request } from 'express';

/**
 * Interface extending Express Request with user data
 */
export interface RequestWithUser extends Request {
  user?: User;
}

/**
 * JwtAuthGuard - Guard protecting endpoints requiring authorization
 *
 * In NestJS a Guard is a class implementing the CanActivate interface.
 * It is called BEFORE the controller and decides whether the request can be handled.
 *
 * This guard:
 * 1. Extracts JWT token from Authorization header
 * 2. Verifies token using Supabase Auth
 * 3. Adds user data to the request object
 *
 * Usage:
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * getProfile() { ... }
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private supabase: SupabaseClient<any, any, any>;

  constructor(private readonly configService: ConfigService) {
    // Initialize Supabase client
    // We use anonKey because JWT verification is public
    const supabaseUrl = this.configService.get<string>('supabase.url');
    const supabaseAnonKey = this.configService.get<string>('supabase.anonKey');

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration is missing');
    }

    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
  }

  /**
   * canActivate method - main guard logic
   *
   * @param context - ExecutionContext contains information about the current request
   * @returns Promise<boolean> - true if request can be handled
   * @throws UnauthorizedException - if token is invalid or missing
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get request object from HTTP context
    // NestJS handles different context types (HTTP, WebSocket, RPC)
    // so we use switchToHttp() to access HTTP request
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    // Extract token from Authorization header
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Missing authentication token',
      });
    }

    try {
      // Verify token using Supabase
      // getUser() returns user data if token is valid
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser(token);

      if (error || !user) {
        throw new UnauthorizedException({
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired token',
        });
      }

      // Add user to request object
      // This allows controller and @CurrentUser decorator
      // to access logged-in user data
      request.user = user;

      return true;
    } catch (error) {
      // If error is already UnauthorizedException, pass it through
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // Other errors (e.g., connection problem with Supabase)
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Token verification failed',
      });
    }
  }

  /**
   * Helper method to extract token from header
   *
   * Authorization header format: "Bearer <token>"
   *
   * @param request - Express request object
   * @returns JWT token or undefined
   */
  private extractTokenFromHeader(request: RequestWithUser): string | undefined {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return undefined;
    }

    // Split "Bearer" and token
    const [type, token] = authHeader.split(' ');

    // Check if format is correct
    if (type !== 'Bearer' || !token) {
      return undefined;
    }

    return token;
  }
}
