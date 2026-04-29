import type {
  CreateTaskRequest,
  DeleteTaskResponse,
  Task,
  UpdateTaskRequest,
} from "~~/shared/types/api";

import type { DbClient } from "~~/db/client";

import { AppError } from "../errors/AppError";
import { errorCodes } from "../errors/errorCodes";
import { findTodoListById } from "../repositories/listRepository";
import {
  createTask,
  deleteTaskById,
  findTaskById,
  listTasksByListId,
  updateTaskById,
} from "../repositories/taskRepository";
import { mapTaskRecordToTask } from "../mappers/taskMapper";

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

export async function getTasksByListId(listId: string, database?: DbClient) {
  const parentList = await findTodoListById(listId, database);

  if (!parentList) {
    throw createParentListNotFoundError();
  }

  const records = await listTasksByListId(listId, database);

  return records.map(mapTaskRecordToTask);
}

export async function getTaskById(id: string, database?: DbClient) {
  const record = await findTaskById(id, database);

  if (!record) {
    throw createTaskNotFoundError();
  }

  return mapTaskRecordToTask(record);
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

    return mapTaskRecordToTask(record);
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
  const existingTask = await findTaskById(id, database);

  if (!existingTask) {
    throw createTaskNotFoundError();
  }

  try {
    const updatedRecord = await updateTaskById(
      id,
      {
        description: normalizeTaskDescription(input.description),
        title: input.title.trim(),
      },
      database,
    );

    if (!updatedRecord) {
      throw createTaskNotFoundError();
    }

    return mapTaskRecordToTask(updatedRecord);
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
