import type { ApiErrorCode } from "~~/shared/types/api";

export const errorCodes = {
  CONFLICT: "CONFLICT",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  NOT_FOUND: "NOT_FOUND",
  PERSISTENCE_ERROR: "PERSISTENCE_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
} as const satisfies Record<ApiErrorCode, ApiErrorCode>;

export type AppErrorCode = keyof typeof errorCodes;
