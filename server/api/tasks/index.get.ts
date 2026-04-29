import { defineEventHandler, getQuery, setResponseStatus } from "h3";
import { ZodError } from "zod";

import { todoListIdSchema } from "~~/shared/schemas/index";

import { errorCodes } from "~~/server/lib/errors/errorCodes";
import { getTasksByListId } from "~~/server/lib/services/taskService";
import { getEventDb } from "~~/server/lib/utils/database";
import { createErrorResponse, sendApiError } from "~~/server/lib/utils/http";
import { formatZodIssues } from "~~/server/lib/utils/validation";

export default defineEventHandler(async (event) => {
  try {
    const listId = todoListIdSchema.parse(getQuery(event).listId);
    const items = await getTasksByListId(listId, getEventDb(event));

    return {
      items,
      total: items.length,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      setResponseStatus(event, 400);

      return createErrorResponse(
        errorCodes.VALIDATION_ERROR,
        "Please provide a valid todo list identifier.",
        formatZodIssues(error),
      );
    }

    return sendApiError(event, error, "The tasks could not be loaded.");
  }
});
