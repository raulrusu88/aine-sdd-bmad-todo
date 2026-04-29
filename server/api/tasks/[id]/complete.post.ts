import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import { ZodError } from "zod";

import { taskIdSchema } from "~~/shared/schemas/index";

import { errorCodes } from "~~/server/lib/errors/errorCodes";
import { completeTaskRecord } from "~~/server/lib/services/taskService";
import { getEventDb } from "~~/server/lib/utils/database";
import { createErrorResponse, sendApiError } from "~~/server/lib/utils/http";
import { formatZodIssues } from "~~/server/lib/utils/validation";

export default defineEventHandler(async (event) => {
  let taskId: string;

  try {
    taskId = taskIdSchema.parse(getRouterParam(event, "id"));
  } catch (error) {
    if (error instanceof ZodError) {
      setResponseStatus(event, 400);

      return createErrorResponse(
        errorCodes.VALIDATION_ERROR,
        "Please provide a valid task identifier.",
        formatZodIssues(error),
      );
    }

    return sendApiError(event, error, "The task could not be completed.");
  }

  try {
    return await completeTaskRecord(taskId, getEventDb(event));
  } catch (error) {
    return sendApiError(event, error, "The task could not be completed.");
  }
});
