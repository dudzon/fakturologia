import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

// NOTE: We use Request/Response from Express because NestJS by default
// uses Express as the HTTP layer. In exception filters we must directly
// operate on request/response objects, so Express imports are standard.

/**
 * Interface for standardized API error response
 *
 * All HTTP errors returned by the API have the same format,
 * which makes error handling easier on the client side.
 */
interface ErrorResponse {
  /** HTTP status code (e.g., 400, 401, 404, 500) */
  statusCode: number;

  /** Domain error code (e.g., 'INVALID_NIP', 'PROFILE_NOT_FOUND') */
  code: string;

  /** Human-readable error message or array of messages (for validation) */
  message: string | string[];

  /** Timestamp of error occurrence in ISO 8601 format */
  timestamp: string;

  /** URL path of the request that caused the error */
  path: string;
}

/**
 * HttpExceptionFilter - Global HTTP exception filter
 *
 * In NestJS exception filters intercept exceptions thrown during
 * request processing and transform them into HTTP responses.
 *
 * This filter:
 * 1. Catches all HttpException (and subclasses)
 * 2. Formats error response to standardized format
 * 3. Logs errors for debugging purposes
 * 4. Hides internal details in production
 *
 * @Catch(HttpException) - decorator specifying which exceptions we catch
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  /**
   * catch method - main filter logic
   *
   * Called automatically when HttpException is thrown
   * anywhere in the request pipeline.
   *
   * @param exception - caught HttpException
   * @param host - ArgumentsHost providing access to request context
   */
  catch(exception: HttpException, host: ArgumentsHost): void {
    // Get HTTP context
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Get HTTP status from exception
    const status = exception.getStatus();

    // Get response from exception (can be string or object)
    const exceptionResponse = exception.getResponse();

    // Extract error code and message
    const { code, message } = this.extractErrorDetails(exceptionResponse);

    // Build standardized error response
    const errorResponse: ErrorResponse = {
      statusCode: status,
      code,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Log error (different levels for different statuses)
    this.logError(status, errorResponse, request);

    // Send response
    response.status(status).json(errorResponse);
  }

  /**
   * Extracts error code and message from exception response
   *
   * Handles different formats:
   * 1. String: "Not Found" → { code: 'ERROR', message: 'Not Found' }
   * 2. Object with code: { code: 'INVALID_NIP', message: '...' }
   * 3. Object with message array (validation): { message: ['error1', 'error2'] }
   *
   * @param response - response from HttpException
   * @returns { code, message }
   */
  private extractErrorDetails(response: string | object): {
    code: string;
    message: string | string[];
  } {
    // If response is a string
    if (typeof response === 'string') {
      return {
        code: 'ERROR',
        message: response,
      };
    }

    // If response is an object
    const responseObj = response as Record<string, unknown>;

    // Get error code (default 'ERROR')
    const code =
      typeof responseObj.code === 'string' ? responseObj.code : 'ERROR';

    // Get message
    let message: string | string[];

    if (Array.isArray(responseObj.message)) {
      // Array of messages (e.g., from ValidationPipe)
      message = responseObj.message as string[];
    } else if (typeof responseObj.message === 'string') {
      message = responseObj.message;
    } else if (typeof responseObj.error === 'string') {
      // Fallback to 'error' field (used by some built-in exceptions)
      message = responseObj.error;
    } else {
      message = 'An error occurred';
    }

    return { code, message };
  }

  /**
   * Logs error with appropriate level
   *
   * - 4xx (client errors): WARN
   * - 5xx (server errors): ERROR
   *
   * @param status - HTTP status code
   * @param errorResponse - error response object
   * @param request - request object
   */
  private logError(
    status: number,
    errorResponse: ErrorResponse,
    request: Request,
  ): void {
    const logMessage = `${request.method} ${request.url} - ${status} - ${errorResponse.code}`;

    if (status >= 500) {
      // Server errors - ERROR level
      this.logger.error(logMessage, JSON.stringify(errorResponse));
    } else if (status >= 400) {
      // Client errors - WARN level
      this.logger.warn(logMessage);
    }
  }
}
