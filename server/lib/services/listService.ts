import type {
  CreateTodoListRequest,
  DeleteTodoListResponse,
  TodoList,
  UpdateTodoListRequest,
} from "~~/shared/types/api";

import type { DbClient } from "~~/db/client";

import { AppError } from "../errors/AppError";
import { errorCodes } from "../errors/errorCodes";
import { mapTodoListRecordToTodoList } from "../mappers/listMapper";
import {
  createTodoList,
  deleteTodoListById,
  findTodoListById,
  findTodoListByNormalizedName,
  listTodoLists,
  updateTodoListById,
} from "../repositories/listRepository";

function createDuplicateTodoListError(): AppError {
  return new AppError(
    errorCodes.CONFLICT,
    "A todo list with that name already exists.",
    {
      details: {
        field: "name",
      },
      statusCode: 409,
    },
  );
}

function createTodoListNotFoundError(): AppError {
  return new AppError(errorCodes.NOT_FOUND, "Todo list not found.", {
    statusCode: 404,
  });
}

function isTodoListNameUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    typeof error.code === "string" &&
    error.code.startsWith("SQLITE_CONSTRAINT") &&
    error.message.includes("todo_lists.name_normalized")
  );
}

function normalizeTodoListName(name: string): string {
  return name.trim().normalize("NFC").toLowerCase();
}

export async function getTodoLists(database?: DbClient) {
  const records = await listTodoLists(database);

  return records.map(mapTodoListRecordToTodoList);
}

export async function getTodoListById(id: string, database?: DbClient) {
  const record = await findTodoListById(id, database);

  if (!record) {
    throw createTodoListNotFoundError();
  }

  return mapTodoListRecordToTodoList(record);
}

export async function createTodoListRecord(
  input: CreateTodoListRequest,
  database?: DbClient,
): Promise<TodoList> {
  const name = input.name.trim();
  const nameNormalized = normalizeTodoListName(name);
  const existingList = await findTodoListByNormalizedName(
    nameNormalized,
    database,
  );

  if (existingList) {
    throw createDuplicateTodoListError();
  }

  try {
    const record = await createTodoList(
      {
        createdAt: new Date().toISOString(),
        id: crypto.randomUUID(),
        name,
        nameNormalized,
      },
      database,
    );

    return mapTodoListRecordToTodoList(record);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (isTodoListNameUniqueConstraintError(error)) {
      throw createDuplicateTodoListError();
    }

    throw new AppError(
      errorCodes.PERSISTENCE_ERROR,
      "The todo list could not be saved.",
      {
        statusCode: 500,
      },
    );
  }
}

export async function updateTodoListRecord(
  id: string,
  input: UpdateTodoListRequest,
  database?: DbClient,
): Promise<TodoList> {
  const existingList = await findTodoListById(id, database);

  if (!existingList) {
    throw createTodoListNotFoundError();
  }

  const name = input.name.trim();
  const nameNormalized = normalizeTodoListName(name);
  const duplicateList = await findTodoListByNormalizedName(
    nameNormalized,
    database,
  );

  if (duplicateList && duplicateList.id !== id) {
    throw createDuplicateTodoListError();
  }

  try {
    const updatedRecord = await updateTodoListById(
      id,
      {
        name,
        nameNormalized,
      },
      database,
    );

    if (!updatedRecord) {
      throw createTodoListNotFoundError();
    }

    return mapTodoListRecordToTodoList(updatedRecord);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (isTodoListNameUniqueConstraintError(error)) {
      throw createDuplicateTodoListError();
    }

    throw new AppError(
      errorCodes.PERSISTENCE_ERROR,
      "The todo list could not be updated.",
      {
        statusCode: 500,
      },
    );
  }
}

export async function deleteTodoListRecord(
  id: string,
  database?: DbClient,
): Promise<DeleteTodoListResponse> {
  const existingList = await findTodoListById(id, database);

  if (!existingList) {
    throw createTodoListNotFoundError();
  }

  try {
    await deleteTodoListById(id, database);

    return {
      id,
    };
  } catch {
    throw new AppError(
      errorCodes.PERSISTENCE_ERROR,
      "The todo list could not be deleted.",
      {
        statusCode: 500,
      },
    );
  }
}
