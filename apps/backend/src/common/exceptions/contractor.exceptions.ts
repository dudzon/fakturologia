import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

/**
 * Domain exceptions for the Contractors module
 *
 * In NestJS, HTTP exceptions automatically return the appropriate status code.
 * We create custom exception classes for better code readability
 * and consistent error codes in the API.
 *
 * Error response structure:
 * {
 *   "statusCode": 400,
 *   "code": "CONTRACTOR_NOT_FOUND",
 *   "message": "Contractor not found",
 *   "timestamp": "2025-01-02T10:00:00.000Z",
 *   "path": "/api/v1/contractors/uuid"
 * }
 */

/**
 * ContractorNotFoundException - Contractor not found
 *
 * HTTP 404 Not Found
 * Thrown when a contractor with the given ID does not exist or does not belong to the user
 */
export class ContractorNotFoundException extends NotFoundException {
  constructor(contractorId?: string) {
    super({
      code: 'CONTRACTOR_NOT_FOUND',
      message: contractorId
        ? `Contractor with ID ${contractorId} not found`
        : 'Contractor not found',
    });
  }
}

/**
 * ContractorNipExistsException - NIP already exists for another contractor
 *
 * HTTP 409 Conflict
 * Thrown when user tries to add/update a contractor with NIP
 * that already exists for another contractor of this user
 */
export class ContractorNipExistsException extends ConflictException {
  constructor(nip: string) {
    super({
      code: 'NIP_EXISTS',
      message: `Contractor with NIP ${nip} already exists`,
    });
  }
}

/**
 * ContractorNameRequiredException - Contractor name is required
 *
 * HTTP 400 Bad Request
 * Thrown when trying to create a contractor without a name
 */
export class ContractorNameRequiredException extends BadRequestException {
  constructor() {
    super({
      code: 'NAME_REQUIRED',
      message: 'Contractor name is required',
    });
  }
}

/**
 * InvalidContractorNipException - Invalid NIP format or checksum
 *
 * HTTP 400 Bad Request
 * Thrown by the IsPolishNIP validator for contractors
 */
export class InvalidContractorNipException extends BadRequestException {
  constructor() {
    super({
      code: 'INVALID_NIP',
      message: 'Invalid NIP format or checksum',
    });
  }
}
