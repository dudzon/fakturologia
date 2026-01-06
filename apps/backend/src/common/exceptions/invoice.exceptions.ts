import { BadRequestException, NotFoundException } from '@nestjs/common';

/**
 * Domain exceptions for the Invoices module
 *
 * In NestJS, HTTP exceptions automatically return the appropriate status code.
 * We create custom exception classes for better code readability
 * and consistent error codes in the API.
 *
 * Error response structure:
 * {
 *   "statusCode": 404,
 *   "code": "INVOICE_NOT_FOUND",
 *   "message": "Invoice not found",
 *   "timestamp": "2025-01-02T10:00:00.000Z",
 *   "path": "/api/v1/invoices/uuid"
 * }
 */

/**
 * InvoiceNotFoundException - Invoice not found
 *
 * HTTP 404 Not Found
 * Thrown when an invoice with the given ID does not exist or does not belong to the user
 */
export class InvoiceNotFoundException extends NotFoundException {
  constructor(invoiceId?: string) {
    super({
      code: 'INVOICE_NOT_FOUND',
      message: invoiceId
        ? `Invoice with ID ${invoiceId} not found`
        : 'Invoice not found',
    });
  }
}

/**
 * InvoiceNumberRequiredException - Invoice number is required
 *
 * HTTP 400 Bad Request
 * Thrown when trying to create an invoice without a number
 */
export class InvoiceNumberRequiredException extends BadRequestException {
  constructor() {
    super({
      code: 'INVOICE_NUMBER_REQUIRED',
      message: 'Invoice number is required',
    });
  }
}

/**
 * InvoiceNumberExistsException - Invoice number already exists
 *
 * HTTP 400 Bad Request
 * Thrown when user tries to create an invoice with a number
 * that already exists for this user
 */
export class InvoiceNumberExistsException extends BadRequestException {
  constructor(invoiceNumber: string) {
    super({
      code: 'INVOICE_NUMBER_EXISTS',
      message: `Invoice with number ${invoiceNumber} already exists`,
    });
  }
}

/**
 * InvalidDatesException - Invalid invoice dates
 *
 * HTTP 400 Bad Request
 * Thrown when the due date is earlier than the issue date
 */
export class InvalidDatesException extends BadRequestException {
  constructor() {
    super({
      code: 'INVALID_DATES',
      message: 'Due date must be greater than or equal to issue date',
    });
  }
}

/**
 * ItemsRequiredException - At least one item is required
 *
 * HTTP 400 Bad Request
 * Thrown when an invoice has no items
 */
export class ItemsRequiredException extends BadRequestException {
  constructor() {
    super({
      code: 'ITEMS_REQUIRED',
      message: 'At least one invoice item is required',
    });
  }
}

/**
 * InvalidVatRateException - Invalid VAT rate
 *
 * HTTP 400 Bad Request
 * Thrown when the provided VAT rate is not allowed
 */
export class InvalidVatRateException extends BadRequestException {
  constructor(vatRate: string) {
    super({
      code: 'INVALID_VAT_RATE',
      message: `Invalid VAT rate: ${vatRate}. Allowed values: 23, 8, 5, 0, zw`,
    });
  }
}

/**
 * InvalidBuyerNipException - Invalid buyer NIP
 *
 * HTTP 400 Bad Request
 * Thrown when buyer NIP has invalid format or checksum
 */
export class InvalidBuyerNipException extends BadRequestException {
  constructor() {
    super({
      code: 'INVALID_BUYER_NIP',
      message: 'Invalid buyer NIP format or checksum',
    });
  }
}

/**
 * IncompleteProfileException - Incomplete user profile
 *
 * HTTP 400 Bad Request
 * Thrown when user tries to issue an invoice (status != draft)
 * without completed company profile (companyName, address, nip)
 */
export class IncompleteProfileException extends BadRequestException {
  constructor() {
    super({
      code: 'INCOMPLETE_PROFILE',
      message:
        'Complete your company profile (company name, address, NIP) before issuing invoices',
    });
  }
}

/**
 * InvalidStatusException - Invalid invoice status
 *
 * HTTP 400 Bad Request
 * Thrown when the provided invoice status is not allowed
 */
export class InvalidStatusException extends BadRequestException {
  constructor(status: string) {
    super({
      code: 'INVALID_STATUS',
      message: `Invalid invoice status: ${status}. Allowed values: draft, unpaid, paid`,
    });
  }
}

/**
 * IncompleteInvoiceException - Invoice incomplete for status change
 *
 * HTTP 400 Bad Request
 * Thrown when trying to change draft invoice status to unpaid/paid
 * without complete data (e.g., missing items)
 */
export class IncompleteInvoiceException extends BadRequestException {
  constructor() {
    super({
      code: 'INCOMPLETE_INVOICE',
      message: 'Invoice is incomplete and cannot be issued',
    });
  }
}

/**
 * InvalidStatusTransitionException - Invalid status change
 *
 * HTTP 400 Bad Request
 * Thrown when trying to change invoice status in an invalid way
 */
export class InvalidStatusTransitionException extends BadRequestException {
  constructor(currentStatus: string, newStatus: string) {
    super({
      code: 'INVALID_STATUS_TRANSITION',
      message: `Cannot change invoice status from '${currentStatus}' to '${newStatus}'`,
    });
  }
}
