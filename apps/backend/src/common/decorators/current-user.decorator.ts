import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@supabase/supabase-js';
import { RequestWithUser } from '../guards/jwt-auth.guard';

/**
 * @CurrentUser() - Dekorator parametru do pobierania aktualnie zalogowanego użytkownika
 *
 * W NestJS możemy tworzyć własne dekoratory parametrów używając createParamDecorator.
 * Dekorator ten pozwala na eleganckie wstrzykiwanie danych użytkownika do metod kontrolera.
 *
 * WYMAGANIE: Endpoint musi być zabezpieczony JwtAuthGuard,
 * który dodaje użytkownika do request.user
 *
 * Użycie:
 *
 * // Pobierz cały obiekt użytkownika
 * @Get('profile')
 * getProfile(@CurrentUser() user: User) {
 *   return user;
 * }
 *
 * // Pobierz tylko konkretne pole
 * @Get('id')
 * getId(@CurrentUser('id') userId: string) {
 *   return userId;
 * }
 *
 * @param data - opcjonalna nazwa pola do pobrania (np. 'id', 'email')
 * @param ctx - ExecutionContext z informacjami o aktualnym żądaniu
 * @returns User lub konkretne pole użytkownika
 */
export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    // Pobierz request z kontekstu HTTP
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();

    // request.user jest ustawiany przez JwtAuthGuard
    const user = request.user;

    // Jeśli podano nazwę pola, zwróć tylko to pole
    // W przeciwnym razie zwróć cały obiekt użytkownika
    if (data && user) {
      return user[data];
    }

    return user;
  },
);
