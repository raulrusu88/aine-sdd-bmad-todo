import {
  defineEventHandler,
  getRouterParam,
  readBody,
  setResponseStatus,
} from "h3";
import { ZodError } from "zod";

import {
  todoListIdSchema,
  updateTodoListRequestSchema,
} from "~~/shared/schemas/index";

import { errorCodes } from "~~/server/lib/errors/errorCodes";
import { updateTodoListRecord } from "~~/server/lib/services/listService";
import { getEventDb } from "~~/server/lib/utils/database";
import { createErrorResponse, sendApiError } from "~~/server/lib/utils/http";
import { formatZodIssues } from "~~/server/lib/utils/validation";

function isBadRequestError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  if ("statusCode" in error && typeof error.statusCode === "number") {
    return error.statusCode === 400;
  }

  if ("status" in error && typeof error.status === "number") {
    return error.status === 400;
  }

  return false;
}

export default defineEventHandler(async (event) => {
  let listId: string;

  try {
    listId = todoListIdSchema.parse(getRouterParam(event, "id"));
  } catch (error) {
    if (error instanceof ZodError) {
      setResponseStatus(event, 400);

      return createErrorResponse(
        errorCodes.VALIDATION_ERROR,
        "Please provide a valid todo list identifier.",
        formatZodIssues(error),
      );
    }

    return sendApiError(event, error, "The todo list could not be updated.");
  }

  try {
    const body = updateTodoListRequestSchema.parse(await readBody(event));

    return await updateTodoListRecord(listId, body, getEventDb(event));
  } catch (error) {
    if (error instanceof ZodError) {
      setResponseStatus(event, 400);

      return createErrorResponse(
        errorCodes.VALIDATION_ERROR,
        "Please enter a valid todo list name.",
        formatZodIssues(error),
      );
    }

    if (isBadRequestError(error)) {
      setResponseStatus(event, 400);

      return createErrorResponse(
        errorCodes.VALIDATION_ERROR,
        "Please enter a valid todo list name.",
      );
    }

    return sendApiError(event, error, "The todo list could not be updated.");
  }
});
