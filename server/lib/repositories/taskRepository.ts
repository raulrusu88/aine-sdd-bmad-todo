import { asc, eq } from "drizzle-orm";

import type { DbClient } from "~~/db/client";
import type { NewTaskRecord, TaskRecord } from "~~/db/schema/tasks";

import { getDb } from "~~/db/client";
import { tasks } from "~~/db/schema/tasks";

export async function listTasksByListId(
  listId: string,
  database: DbClient = getDb(),
) {
  return database
    .select()
    .from(tasks)
    .where(eq(tasks.listId, listId))
    .orderBy(asc(tasks.createdAt));
}

export async function findTaskById(
  id: string,
  database: DbClient = getDb(),
): Promise<TaskRecord | undefined> {
  return database.query.tasks.findFirst({
    where: eq(tasks.id, id),
  });
}

export async function createTask(
  record: NewTaskRecord,
  database: DbClient = getDb(),
): Promise<TaskRecord> {
  await database.insert(tasks).values(record);

  const createdRecord = await findTaskById(record.id, database);

  if (!createdRecord) {
    throw new Error("Created task could not be reloaded.");
  }

  return createdRecord;
}

export async function updateTaskById(
  id: string,
  updates: Pick<NewTaskRecord, "description" | "title">,
  database: DbClient = getDb(),
): Promise<TaskRecord | undefined> {
  await database.update(tasks).set(updates).where(eq(tasks.id, id));

  return findTaskById(id, database);
}

export async function deleteTaskById(
  id: string,
  database: DbClient = getDb(),
): Promise<void> {
  await database.delete(tasks).where(eq(tasks.id, id));
}
