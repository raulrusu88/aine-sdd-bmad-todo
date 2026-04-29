import { asc, eq } from "drizzle-orm";

import type { DbClient } from "~~/db/client";
import type { NewTodoListRecord, TodoListRecord } from "~~/db/schema/todoLists";

import { getDb } from "~~/db/client";
import { todoLists } from "~~/db/schema/todoLists";

export async function listTodoLists(database: DbClient = getDb()) {
  return database.select().from(todoLists).orderBy(asc(todoLists.createdAt));
}

export async function findTodoListById(
  id: string,
  database: DbClient = getDb(),
): Promise<TodoListRecord | undefined> {
  return database.query.todoLists.findFirst({
    where: eq(todoLists.id, id),
  });
}

export async function findTodoListByNormalizedName(
  normalizedName: string,
  database: DbClient = getDb(),
): Promise<TodoListRecord | undefined> {
  return database.query.todoLists.findFirst({
    where: eq(todoLists.nameNormalized, normalizedName),
  });
}

export async function createTodoList(
  record: NewTodoListRecord,
  database: DbClient = getDb(),
): Promise<TodoListRecord> {
  await database.insert(todoLists).values(record);

  const createdRecord = await findTodoListById(record.id, database);

  if (!createdRecord) {
    throw new Error("Created todo list could not be reloaded.");
  }

  return createdRecord;
}

export async function updateTodoListById(
  id: string,
  updates: Pick<NewTodoListRecord, "name" | "nameNormalized">,
  database: DbClient = getDb(),
): Promise<TodoListRecord | undefined> {
  await database.update(todoLists).set(updates).where(eq(todoLists.id, id));

  return findTodoListById(id, database);
}

export async function deleteTodoListById(
  id: string,
  database: DbClient = getDb(),
): Promise<void> {
  await database.delete(todoLists).where(eq(todoLists.id, id));
}
