import type { ApiErrorCode } from "~~/shared/types/api";

export class AppError extends Error {
  readonly code: ApiErrorCode;
  readonly details?: Record<string, unknown>;
  readonly statusCode: number;

  constructor(
    code: ApiErrorCode,
    message: string,
    options: {
      details?: Record<string, unknown>;
      statusCode?: number;
    } = {},
  ) {
    super(message);

    this.code = code;
    this.details = options.details;
    this.name = "AppError";
    this.statusCode = options.statusCode ?? 500;
  }
}
