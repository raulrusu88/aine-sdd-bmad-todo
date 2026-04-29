import type { H3Event } from "h3";

import { setResponseStatus } from "h3";

import type { ApiErrorCode, ApiErrorResponse } from "~~/shared/types/api";

import { AppError } from "../errors/AppError";
import { errorCodes } from "../errors/errorCodes";
import { logger } from "./logger";

export function createErrorResponse(
  code: ApiErrorCode,
  message: string,
  details?: Record<string, unknown>,
): ApiErrorResponse {
  return {
    error: {
      ...(details ? { details } : {}),
      code,
      message,
    },
  };
}

function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  }

  return {
    value: error,
  };
}

export function sendApiError(
  event: H3Event,
  error: unknown,
  fallbackMessage = "The request could not be completed.",
): ApiErrorResponse {
  if (error instanceof AppError) {
    const log = error.statusCode >= 500 ? logger.error : logger.warn;

    log(error.message, {
      code: error.code,
      details: error.details,
      statusCode: error.statusCode,
    });

    setResponseStatus(event, error.statusCode);

    return createErrorResponse(error.code, error.message, error.details);
  }

  logger.error(fallbackMessage, {
    error: serializeError(error),
  });

  setResponseStatus(event, 500);

  return createErrorResponse(errorCodes.INTERNAL_ERROR, fallbackMessage);
}
