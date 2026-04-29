import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import { ZodError } from "zod";

import { todoListIdSchema } from "~~/shared/schemas/index";

import { errorCodes } from "~~/server/lib/errors/errorCodes";
import { deleteTodoListRecord } from "~~/server/lib/services/listService";
import { getEventDb } from "~~/server/lib/utils/database";
import { createErrorResponse, sendApiError } from "~~/server/lib/utils/http";
import { formatZodIssues } from "~~/server/lib/utils/validation";

export default defineEventHandler(async (event) => {
  try {
    const listId = todoListIdSchema.parse(getRouterParam(event, "id"));

    return await deleteTodoListRecord(listId, getEventDb(event));
  } catch (error) {
    if (error instanceof ZodError) {
      setResponseStatus(event, 400);

      return createErrorResponse(
        errorCodes.VALIDATION_ERROR,
        "Please provide a valid todo list identifier.",
        formatZodIssues(error),
      );
    }

    return sendApiError(event, error, "The todo list could not be deleted.");
  }
});
