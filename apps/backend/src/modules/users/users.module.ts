import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

/**
 * UsersModule - Moduł obsługujący profile użytkowników
 *
 * W architekturze NestJS moduły grupują powiązaną funkcjonalność.
 * Ten moduł zawiera:
 * - UsersController - obsługuje żądania HTTP dla /users/*
 * - UsersService - logika biznesowa i komunikacja z Supabase
 *
 * Endpointy:
 * - GET  /users/profile      - pobierz profil
 * - PUT  /users/profile      - aktualizuj profil
 * - POST /users/profile/logo - upload logo
 * - DELETE /users/profile/logo - usuń logo
 */
@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Eksportujemy serwis dla innych modułów
})
export class UsersModule {}
