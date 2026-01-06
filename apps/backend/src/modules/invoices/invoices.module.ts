import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

/**
 * InvoicesModule - Module handling invoices
 *
 * Contains endpoints:
 * - GET    /invoices           - invoice list with pagination and filters
 * - GET    /invoices/next-number - next invoice number
 * - GET    /invoices/:id       - single invoice
 * - POST   /invoices           - create invoice
 * - PUT    /invoices/:id       - update invoice
 * - PATCH  /invoices/:id/status - change invoice status
 * - POST   /invoices/:id/duplicate - duplicate invoice
 * - DELETE /invoices/:id       - soft delete invoice
 */
@Module({
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
