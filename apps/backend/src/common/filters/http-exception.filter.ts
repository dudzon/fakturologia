import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

// UWAGA: Używamy Request/Response z Express, ponieważ NestJS domyślnie
// używa Express jako warstwy HTTP. W filtrach wyjątków musimy bezpośrednio
// operować na obiektach request/response, więc importy z Express są standardem.

/**
 * Interfejs dla ustandaryzowanej odpowiedzi błędu API
 *
 * Wszystkie błędy HTTP zwracane przez API mają ten sam format,
 * co ułatwia obsługę błędów po stronie klienta.
 */
interface ErrorResponse {
  /** HTTP status code (np. 400, 401, 404, 500) */
  statusCode: number;

  /** Kod błędu domenowego (np. 'INVALID_NIP', 'PROFILE_NOT_FOUND') */
  code: string;

  /** Czytelny komunikat błędu lub tablica komunikatów (dla walidacji) */
  message: string | string[];

  /** Timestamp wystąpienia błędu w formacie ISO 8601 */
  timestamp: string;

  /** Ścieżka URL żądania które spowodowało błąd */
  path: string;
}

/**
 * HttpExceptionFilter - Globalny filtr wyjątków HTTP
 *
 * W NestJS filtry wyjątków przechwytują wyjątki rzucane podczas
 * przetwarzania żądań i przekształcają je w odpowiedzi HTTP.
 *
 * Ten filtr:
 * 1. Przechwytuje wszystkie HttpException (i podklasy)
 * 2. Formatuje odpowiedź błędu do ustandaryzowanego formatu
 * 3. Loguje błędy dla celów debugowania
 * 4. Ukrywa szczegóły wewnętrzne w produkcji
 *
 * @Catch(HttpException) - dekorator określający jakie wyjątki przechwytujemy
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  /**
   * Metoda catch - główna logika filtra
   *
   * Wywoływana automatycznie gdy HttpException jest rzucony
   * gdziekolwiek w pipeline żądania.
   *
   * @param exception - przechwycony wyjątek HttpException
   * @param host - ArgumentsHost dający dostęp do kontekstu żądania
   */
  catch(exception: HttpException, host: ArgumentsHost): void {
    // Pobierz kontekst HTTP
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Pobierz status HTTP z wyjątku
    const status = exception.getStatus();

    // Pobierz response z wyjątku (może być string lub obiekt)
    const exceptionResponse = exception.getResponse();

    // Wyciągnij kod błędu i komunikat
    const { code, message } = this.extractErrorDetails(exceptionResponse);

    // Zbuduj ustandaryzowaną odpowiedź błędu
    const errorResponse: ErrorResponse = {
      statusCode: status,
      code,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Loguj błąd (różne poziomy dla różnych statusów)
    this.logError(status, errorResponse, request);

    // Wyślij odpowiedź
    response.status(status).json(errorResponse);
  }

  /**
   * Wyciąga kod błędu i komunikat z odpowiedzi wyjątku
   *
   * Obsługuje różne formaty:
   * 1. String: "Not Found" → { code: 'ERROR', message: 'Not Found' }
   * 2. Object z code: { code: 'INVALID_NIP', message: '...' }
   * 3. Object z message array (walidacja): { message: ['error1', 'error2'] }
   *
   * @param response - response z HttpException
   * @returns { code, message }
   */
  private extractErrorDetails(response: string | object): {
    code: string;
    message: string | string[];
  } {
    // Jeśli response to string
    if (typeof response === 'string') {
      return {
        code: 'ERROR',
        message: response,
      };
    }

    // Jeśli response to obiekt
    const responseObj = response as Record<string, unknown>;

    // Pobierz kod błędu (domyślnie 'ERROR')
    const code =
      typeof responseObj.code === 'string' ? responseObj.code : 'ERROR';

    // Pobierz komunikat
    let message: string | string[];

    if (Array.isArray(responseObj.message)) {
      // Tablica komunikatów (np. z ValidationPipe)
      message = responseObj.message as string[];
    } else if (typeof responseObj.message === 'string') {
      message = responseObj.message;
    } else if (typeof responseObj.error === 'string') {
      // Fallback do pola 'error' (używane przez niektóre wbudowane wyjątki)
      message = responseObj.error;
    } else {
      message = 'An error occurred';
    }

    return { code, message };
  }

  /**
   * Loguje błąd z odpowiednim poziomem
   *
   * - 4xx (błędy klienta): WARN
   * - 5xx (błędy serwera): ERROR
   *
   * @param status - HTTP status code
   * @param errorResponse - obiekt odpowiedzi błędu
   * @param request - obiekt żądania
   */
  private logError(
    status: number,
    errorResponse: ErrorResponse,
    request: Request,
  ): void {
    const logMessage = `${request.method} ${request.url} - ${status} - ${errorResponse.code}`;

    if (status >= 500) {
      // Błędy serwera - ERROR level
      this.logger.error(logMessage, JSON.stringify(errorResponse));
    } else if (status >= 400) {
      // Błędy klienta - WARN level
      this.logger.warn(logMessage);
    }
  }
}
