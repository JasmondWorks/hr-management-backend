export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Restore prototype chain
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}

export class NotFoundException extends AppError {
  constructor(message = "Resource not found") {
    super(404, message);
  }
}

export class BadRequestException extends AppError {
  constructor(message = "Bad request") {
    super(400, message);
  }
}

export class UnauthorizedException extends AppError {
  constructor(message = "Unauthorized") {
    super(401, message);
  }
}

export class ForbiddenException extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super(403, message);
  }
}

export class ConflictException extends AppError {
  constructor(message = "Conflict") {
    super(409, message);
  }
}

// Used for a resource that existed but is deliberately no longer usable — an
// invitation that has already been accepted or revoked. Distinct from 404 so the
// frontend can tell "we don't know this link" from "this link is spent".
export class GoneException extends AppError {
  constructor(message = "This resource is no longer available") {
    super(410, message);
  }
}
