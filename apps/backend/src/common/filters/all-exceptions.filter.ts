import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * AllExceptionsFilter - Filter for ALL unhandled exceptions
 *
 * This filter is a "safety net" - it catches exceptions
 * that were not handled by HttpExceptionFilter.
 *
 * This mainly includes:
 * - Database errors
 * - External service errors (Supabase)
 * - Unexpected code errors
 *
 * IMPORTANT: In production we do NOT return stack trace or error details!
 * This could reveal sensitive system information.
 *
 * @Catch() - without arguments = catches EVERYTHING
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // For unknown exceptions we always return 500
    const status = HttpStatus.INTERNAL_SERVER_ERROR;

    // Extract error information for logging
    const errorDetails = this.extractErrorDetails(exception);

    // Log full error details (server-side only)
    this.logger.error(
      `Unhandled exception: ${request.method} ${request.url}`,
      errorDetails.stack || errorDetails.message,
    );

    // Response for client - do NOT reveal details!
    const errorResponse = {
      statusCode: status,
      code: 'INTERNAL_SERVER_ERROR',
      message:
        process.env.NODE_ENV === 'development'
          ? errorDetails.message
          : 'Internal server error',
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }

  /**
   * Extracts error details for logging
   *
   * Handles different exception types:
   * - Error (standard)
   * - String
   * - Unknown object
   */
  private extractErrorDetails(exception: unknown): {
    message: string;
    stack?: string;
  } {
    if (exception instanceof Error) {
      return {
        message: exception.message,
        stack: exception.stack,
      };
    }

    if (typeof exception === 'string') {
      return { message: exception };
    }

    return { message: 'Unknown error occurred' };
  }
}
