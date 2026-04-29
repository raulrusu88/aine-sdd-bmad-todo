import { defineEventHandler, getQuery, setResponseStatus } from "h3";
import { ZodError } from "zod";

import {
  taskListFilterTagSchema,
  todoListIdSchema,
} from "~~/shared/schemas/index";

import { errorCodes } from "~~/server/lib/errors/errorCodes";
import {
  getTasksByListId,
  getTasksByListIdAndTag,
} from "~~/server/lib/services/taskService";
import { getEventDb } from "~~/server/lib/utils/database";
import { createErrorResponse, sendApiError } from "~~/server/lib/utils/http";
import { formatZodIssues } from "~~/server/lib/utils/validation";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  try {
    const listId = todoListIdSchema.parse(query.listId);
    const tagValidation = taskListFilterTagSchema.safeParse(query.tag);

    if (!tagValidation.success) {
      setResponseStatus(event, 400);

      return createErrorResponse(
        errorCodes.VALIDATION_ERROR,
        "Please provide a valid task filter.",
        {
          tag: tagValidation.error.issues.map((issue) => issue.message),
        },
      );
    }

    const items = tagValidation.data
      ? await getTasksByListIdAndTag(
          listId,
          tagValidation.data,
          getEventDb(event),
        )
      : await getTasksByListId(listId, getEventDb(event));

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
