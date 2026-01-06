import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for public endpoints
 * Used by JwtAuthGuard to recognize endpoints
 * that do not require authorization
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * @Public() - Decorator marking an endpoint as public
 *
 * Endpoints marked with this decorator will not require
 * a JWT token for access.
 *
 * Usage:
 *
 * @Public()
 * @Get('health')
 * healthCheck() {
 *   return { status: 'ok' };
 * }
 *
 * NOTE: Requires modification of JwtAuthGuard to check
 * this metadata and skip verification for public endpoints.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
