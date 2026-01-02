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
 * Interfejs rozszerzający Express Request o dane użytkownika
 */
export interface RequestWithUser extends Request {
  user?: User;
}

/**
 * JwtAuthGuard - Guard zabezpieczający endpointy wymagające autoryzacji
 *
 * W NestJS Guard to klasa implementująca interfejs CanActivate.
 * Jest wywoływany PRZED kontrolerem i decyduje czy żądanie może być obsłużone.
 *
 * Ten guard:
 * 1. Wyciąga token JWT z nagłówka Authorization
 * 2. Weryfikuje token używając Supabase Auth
 * 3. Dodaje dane użytkownika do obiektu request
 *
 * Użycie:
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * getProfile() { ... }
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private supabase: SupabaseClient<any, any, any>;

  constructor(private readonly configService: ConfigService) {
    // Inicjalizacja klienta Supabase
    // Używamy anonKey bo weryfikacja JWT jest publiczna
    const supabaseUrl = this.configService.get<string>('supabase.url');
    const supabaseAnonKey = this.configService.get<string>('supabase.anonKey');

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration is missing');
    }

    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
  }

  /**
   * Metoda canActivate - główna logika guarda
   *
   * @param context - ExecutionContext zawiera informacje o aktualnym żądaniu
   * @returns Promise<boolean> - true jeśli żądanie może być obsłużone
   * @throws UnauthorizedException - jeśli token jest nieprawidłowy lub brakuje go
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Pobierz obiekt request z kontekstu HTTP
    // NestJS obsługuje różne typy kontekstów (HTTP, WebSocket, RPC)
    // dlatego używamy switchToHttp() aby uzyskać dostęp do HTTP request
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    // Wyciągnij token z nagłówka Authorization
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Missing authentication token',
      });
    }

    try {
      // Weryfikuj token używając Supabase
      // getUser() zwraca dane użytkownika jeśli token jest prawidłowy
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

      // Dodaj użytkownika do obiektu request
      // Dzięki temu kontroler i @CurrentUser decorator
      // będą miały dostęp do danych zalogowanego użytkownika
      request.user = user;

      return true;
    } catch (error) {
      // Jeśli błąd to już UnauthorizedException, przekaż go dalej
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // Inne błędy (np. problem z połączeniem do Supabase)
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Token verification failed',
      });
    }
  }

  /**
   * Pomocnicza metoda do wyciągania tokenu z nagłówka
   *
   * Nagłówek Authorization ma format: "Bearer <token>"
   *
   * @param request - obiekt żądania Express
   * @returns token JWT lub undefined
   */
  private extractTokenFromHeader(request: RequestWithUser): string | undefined {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return undefined;
    }

    // Rozdziel "Bearer" i token
    const [type, token] = authHeader.split(' ');

    // Sprawdź czy format jest poprawny
    if (type !== 'Bearer' || !token) {
      return undefined;
    }

    return token;
  }
}
