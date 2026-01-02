import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * AllExceptionsFilter - Filtr dla WSZYSTKICH nieobsłużonych wyjątków
 *
 * Ten filtr jest "siatką bezpieczeństwa" - przechwytuje wyjątki,
 * które nie zostały obsłużone przez HttpExceptionFilter.
 *
 * Dotyczy to głównie:
 * - Błędów bazy danych
 * - Błędów zewnętrznych serwisów (Supabase)
 * - Nieoczekiwanych błędów w kodzie
 *
 * WAŻNE: W produkcji NIE zwracamy stack trace ani szczegółów błędu!
 * To mogłoby ujawnić wrażliwe informacje o systemie.
 *
 * @Catch() - bez argumentów = przechwytuje WSZYSTKO
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Dla nieznanych wyjątków zawsze zwracamy 500
    const status = HttpStatus.INTERNAL_SERVER_ERROR;

    // Wyciągnij informacje o błędzie do logowania
    const errorDetails = this.extractErrorDetails(exception);

    // Loguj pełne szczegóły błędu (tylko po stronie serwera)
    this.logger.error(
      `Unhandled exception: ${request.method} ${request.url}`,
      errorDetails.stack || errorDetails.message,
    );

    // Odpowiedź dla klienta - NIE ujawniamy szczegółów!
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
   * Wyciąga szczegóły błędu dla logowania
   *
   * Obsługuje różne typy wyjątków:
   * - Error (standardowy)
   * - String
   * - Nieznany obiekt
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
