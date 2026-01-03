import { Module } from '@nestjs/common';
import { ContractorsController } from './contractors.controller';
import { ContractorsService } from './contractors.service';

/**
 * ContractorsModule - Module handling contractors (invoice buyers)
 *
 * In NestJS architecture modules group related functionality.
 * This module contains:
 * - ContractorsController - handles HTTP requests for /contractors/*
 * - ContractorsService - business logic and communication with Supabase
 *
 * Endpoints:
 * - GET    /contractors      - contractor list with pagination
 * - GET    /contractors/:id  - get contractor
 * - POST   /contractors      - create contractor
 * - PUT    /contractors/:id  - update contractor
 * - DELETE /contractors/:id  - delete contractor (soft delete)
 */
@Module({
  controllers: [ContractorsController],
  providers: [ContractorsService],
  exports: [ContractorsService], // Export service for other modules (e.g., invoices)
})
export class ContractorsModule {}
