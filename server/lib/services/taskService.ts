import type {
  CreateTaskRequest,
  DeleteTaskResponse,
  Task,
  TaskTag,
  UpdateTaskRequest,
} from "~~/shared/types/api";

import { getDb } from "~~/db/client";

import type { DbClient } from "~~/db/client";
import type { NewTaskTagRecord, TaskTagRecord } from "~~/db/schema/taskTags";

import {
  updateTaskRequestSchema,
  normalizeTaskTagName,
  normalizeTaskTagNameForComparison,
} from "~~/shared/schemas/index";

import { AppError } from "../errors/AppError";
import { errorCodes } from "../errors/errorCodes";
import { findTodoListById } from "../repositories/listRepository";
import {
  createTask,
  deleteTaskById,
  findTaskById,
  listTasksByListId,
  listTaskTagsByTaskIds,
  replaceTaskTags,
  updateTaskById,
} from "../repositories/taskRepository";
import { mapTaskRecordToTask } from "../mappers/taskMapper";
import { formatZodIssues } from "../utils/validation";

function createTaskNotFoundError(): AppError {
  return new AppError(errorCodes.NOT_FOUND, "Task not found.", {
    statusCode: 404,
  });
}

function createParentListNotFoundError(): AppError {
  return new AppError(errorCodes.NOT_FOUND, "Todo list not found.", {
    statusCode: 404,
  });
}

function isTaskListForeignKeyConstraintError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    typeof error.code === "string" &&
    error.code.startsWith("SQLITE_CONSTRAINT") &&
    error.message.includes("FOREIGN KEY constraint failed")
  );
}

function normalizeTaskDescription(description?: string): string | null {
  const trimmedDescription = description?.trim() ?? "";

  return trimmedDescription.length > 0 ? trimmedDescription : null;
}

function createTaskPersistenceError(message: string): AppError {
  return new AppError(errorCodes.PERSISTENCE_ERROR, message, {
    statusCode: 500,
  });
}

function createTaskValidationError(details: Record<string, unknown>): AppError {
  return new AppError(
    errorCodes.VALIDATION_ERROR,
    "Please enter valid task details.",
    {
      details,
      statusCode: 400,
    },
  );
}

function groupTaskTagsByTaskId(
  records: TaskTagRecord[],
): Record<string, TaskTag[]> {
  return records.reduce<Record<string, TaskTag[]>>((groupedTags, record) => {
    groupedTags[record.taskId] ??= [];
    groupedTags[record.taskId].push(record.name);

    return groupedTags;
  }, {});
}

function createTaskTagRecords(
  taskId: string,
  tags: TaskTag[],
): NewTaskTagRecord[] {
  const baseTimestamp = Date.now();

  return tags.map((tag, index) => {
    const normalizedTagName = normalizeTaskTagName(tag);

    return {
      createdAt: new Date(baseTimestamp + index).toISOString(),
      name: normalizedTagName,
      nameNormalized: normalizeTaskTagNameForComparison(normalizedTagName),
      taskId,
    };
  });
}

function validateTaskUpdateInput(input: UpdateTaskRequest): UpdateTaskRequest {
  const validationResult = updateTaskRequestSchema.safeParse(input);

  if (!validationResult.success) {
    throw createTaskValidationError(formatZodIssues(validationResult.error));
  }

  return validationResult.data;
}

export async function getTasksByListId(listId: string, database?: DbClient) {
  const parentList = await findTodoListById(listId, database);

  if (!parentList) {
    throw createParentListNotFoundError();
  }

  const records = await listTasksByListId(listId, database);

  if (!records.length) {
    return [];
  }

  const tagsByTaskId = groupTaskTagsByTaskId(
    await listTaskTagsByTaskIds(
      records.map((record) => record.id),
      database,
    ),
  );

  return records.map((record) =>
    mapTaskRecordToTask(record, tagsByTaskId[record.id] ?? []),
  );
}

export async function getTaskById(id: string, database?: DbClient) {
  const record = await findTaskById(id, database);

  if (!record) {
    throw createTaskNotFoundError();
  }

  const tagsByTaskId = groupTaskTagsByTaskId(
    await listTaskTagsByTaskIds([id], database),
  );

  return mapTaskRecordToTask(record, tagsByTaskId[id] ?? []);
}

export async function createTaskRecord(
  input: CreateTaskRequest,
  database?: DbClient,
): Promise<Task> {
  const parentList = await findTodoListById(input.listId, database);

  if (!parentList) {
    throw createParentListNotFoundError();
  }

  try {
    const record = await createTask(
      {
        createdAt: new Date().toISOString(),
        description: normalizeTaskDescription(input.description),
        id: crypto.randomUUID(),
        listId: input.listId,
        title: input.title.trim(),
      },
      database,
    );

    return mapTaskRecordToTask(record, []);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (isTaskListForeignKeyConstraintError(error)) {
      throw createParentListNotFoundError();
    }

    throw createTaskPersistenceError("The task could not be saved.");
  }
}

export async function updateTaskRecord(
  id: string,
  input: UpdateTaskRequest,
  database?: DbClient,
): Promise<Task> {
  const validatedInput = validateTaskUpdateInput(input);
  const client = database ?? getDb();

  try {
    const runInTransaction = (transactionDatabase: DbClient) => {
      const existingTask = findTaskById(id, transactionDatabase);

      if (!existingTask) {
        throw createTaskNotFoundError();
      }

      const updatedRecord = updateTaskById(
        id,
        {
          description: normalizeTaskDescription(validatedInput.description),
          title: validatedInput.title,
        },
        transactionDatabase,
      );

      if (!updatedRecord) {
        throw createTaskNotFoundError();
      }

      if (validatedInput.tags) {
        replaceTaskTags(
          id,
          createTaskTagRecords(id, validatedInput.tags),
          transactionDatabase,
        );
      }

      const tagsByTaskId = groupTaskTagsByTaskId(
        listTaskTagsByTaskIds([id], transactionDatabase),
      );

      return mapTaskRecordToTask(updatedRecord, tagsByTaskId[id] ?? []);
    };

    return client.transaction(runInTransaction);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw createTaskPersistenceError("The task could not be updated.");
  }
}

export async function deleteTaskRecord(
  id: string,
  database?: DbClient,
): Promise<DeleteTaskResponse> {
  const existingTask = await findTaskById(id, database);

  if (!existingTask) {
    throw createTaskNotFoundError();
  }

  try {
    await deleteTaskById(id, database);

    return {
      id,
    };
  } catch {
    throw createTaskPersistenceError("The task could not be deleted.");
  }
}
