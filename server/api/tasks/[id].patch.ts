import {
  defineEventHandler,
  getRouterParam,
  readBody,
  setResponseStatus,
} from "h3";
import { ZodError } from "zod";

import { taskIdSchema, updateTaskRequestSchema } from "~~/shared/schemas/index";

import { errorCodes } from "~~/server/lib/errors/errorCodes";
import { updateTaskRecord } from "~~/server/lib/services/taskService";
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

    return sendApiError(event, error, "The task could not be updated.");
  }

  try {
    const body = updateTaskRequestSchema.parse(await readBody(event));

    return await updateTaskRecord(taskId, body, getEventDb(event));
  } catch (error) {
    if (error instanceof ZodError) {
      setResponseStatus(event, 400);

      return createErrorResponse(
        errorCodes.VALIDATION_ERROR,
        "Please enter valid task details.",
        formatZodIssues(error),
      );
    }

    if (isBadRequestError(error)) {
      setResponseStatus(event, 400);

      return createErrorResponse(
        errorCodes.VALIDATION_ERROR,
        "Please enter valid task details.",
      );
    }

    return sendApiError(event, error, "The task could not be updated.");
  }
});
