import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@supabase/supabase-js';
import { RequestWithUser } from '../guards/jwt-auth.guard';

/**
 * @CurrentUser() - Parameter decorator to get currently logged-in user
 *
 * In NestJS we can create custom parameter decorators using createParamDecorator.
 * This decorator allows for elegant injection of user data into controller methods.
 *
 * REQUIREMENT: Endpoint must be protected by JwtAuthGuard,
 * which adds user to request.user
 *
 * Usage:
 *
 * // Get entire user object
 * @Get('profile')
 * getProfile(@CurrentUser() user: User) {
 *   return user;
 * }
 *
 * // Get only specific field
 * @Get('id')
 * getId(@CurrentUser('id') userId: string) {
 *   return userId;
 * }
 *
 * @param data - optional field name to retrieve (e.g., 'id', 'email')
 * @param ctx - ExecutionContext with information about current request
 * @returns User or specific user field
 */
export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    // Get request from HTTP context
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();

    // request.user is set by JwtAuthGuard
    const user = request.user;

    // If field name provided, return only that field
    // Otherwise return entire user object
    if (data && user) {
      return user[data];
    }

    return user;
  },
);
