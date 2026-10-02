export class DomainError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends DomainError {
  constructor(message = 'Resource not found') {
    super(message, 'NOT_FOUND');
  }
}

export class ConflictError extends DomainError {
  constructor(message = 'Conflict') {
    super(message, 'CONFLICT');
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = 'Forbidden') {
    super(message, 'FORBIDDEN');
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = 'Unauthorized') {
    super(message, 'UNAUTHORIZED');
  }
}

export class PublicationNotEligibleError extends DomainError {
  constructor(
    message = 'Mentor profile is not eligible for publication',
    readonly requirements: Array<{
      code: string;
      label: string;
      satisfied: boolean;
    }> = [],
  ) {
    super(message, 'PUBLICATION_NOT_ELIGIBLE');
  }
}
