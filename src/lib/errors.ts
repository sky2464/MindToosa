/**
 * MindToosa Error Hierarchy
 *
 * Provides consistent error handling across the application.
 */

export class AppError extends Error {
  public readonly isOperational = true;

  constructor(
    message: string,
    public readonly code: string = "INTERNAL_ERROR",
    public readonly metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class ApiError extends AppError {
  constructor(
    message: string,
    public readonly status: number = 500,
    code: string = "API_ERROR",
    metadata?: Record<string, unknown>
  ) {
    super(message, code, metadata);
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly field?: string,
    metadata?: Record<string, unknown>
  ) {
    super(message, "VALIDATION_ERROR", { ...metadata, field });
  }
}

export class AuthError extends AppError {
  constructor(message: string = "Not authenticated") {
    super(message, "UNAUTHENTICATED");
  }
}
