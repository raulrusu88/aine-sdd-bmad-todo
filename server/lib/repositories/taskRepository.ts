import { asc, eq, inArray } from "drizzle-orm";

import type { DbClient } from "~~/db/client";
import type { NewTaskTagRecord, TaskTagRecord } from "~~/db/schema/taskTags";
import type { NewTaskRecord, TaskRecord } from "~~/db/schema/tasks";

import { getDb } from "~~/db/client";
import { taskTags } from "~~/db/schema/taskTags";
import { tasks } from "~~/db/schema/tasks";

export function listTasksByListId(
  listId: string,
  database: DbClient = getDb(),
) {
  return database
    .select()
    .from(tasks)
    .where(eq(tasks.listId, listId))
    .orderBy(asc(tasks.createdAt))
    .all();
}

export function findTaskById(
  id: string,
  database: DbClient = getDb(),
): TaskRecord | undefined {
  return database.select().from(tasks).where(eq(tasks.id, id)).get();
}

export function createTask(
  record: NewTaskRecord,
  database: DbClient = getDb(),
): TaskRecord {
  database.insert(tasks).values(record).run();

  const createdRecord = findTaskById(record.id, database);

  if (!createdRecord) {
    throw new Error("Created task could not be reloaded.");
  }

  return createdRecord;
}

export function updateTaskById(
  id: string,
  updates: Pick<NewTaskRecord, "description" | "title">,
  database: DbClient = getDb(),
): TaskRecord | undefined {
  database.update(tasks).set(updates).where(eq(tasks.id, id)).run();

  return findTaskById(id, database);
}

export function markTaskCompletedById(
  id: string,
  completedAt: string,
  database: DbClient = getDb(),
): TaskRecord | undefined {
  database.update(tasks).set({ completedAt }).where(eq(tasks.id, id)).run();

  return findTaskById(id, database);
}

export function listTaskTagsByTaskIds(
  taskIds: string[],
  database: DbClient = getDb(),
): TaskTagRecord[] {
  if (!taskIds.length) {
    return [];
  }

  return database
    .select()
    .from(taskTags)
    .where(inArray(taskTags.taskId, taskIds))
    .orderBy(asc(taskTags.taskId), asc(taskTags.createdAt))
    .all();
}

export function replaceTaskTags(
  taskId: string,
  records: NewTaskTagRecord[],
  database: DbClient = getDb(),
): void {
  database.delete(taskTags).where(eq(taskTags.taskId, taskId)).run();

  if (!records.length) {
    return;
  }

  database.insert(taskTags).values(records).run();
}

export function deleteTaskById(id: string, database: DbClient = getDb()): void {
  database.delete(tasks).where(eq(tasks.id, id)).run();
}
