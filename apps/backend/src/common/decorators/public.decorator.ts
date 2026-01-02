import { SetMetadata } from '@nestjs/common';

/**
 * Klucz metadanych dla publicznych endpointów
 * Używany przez JwtAuthGuard do rozpoznawania endpointów
 * które nie wymagają autoryzacji
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * @Public() - Dekorator oznaczający endpoint jako publiczny
 *
 * Endpointy oznaczone tym dekoratorem nie będą wymagały
 * tokenu JWT do dostępu.
 *
 * Użycie:
 *
 * @Public()
 * @Get('health')
 * healthCheck() {
 *   return { status: 'ok' };
 * }
 *
 * UWAGA: Wymaga modyfikacji JwtAuthGuard aby sprawdzał
 * ten metadata i pomijał weryfikację dla publicznych endpointów.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
