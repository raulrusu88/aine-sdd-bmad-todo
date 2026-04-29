import type { Task, TaskTag } from "~~/shared/types/api";

import type { TaskRecord } from "~~/db/schema/tasks";

export function mapTaskRecordToTask(
  record: TaskRecord,
  tags: TaskTag[] = [],
): Task {
  return {
    completedAt: record.completedAt,
    createdAt: record.createdAt,
    description: record.description,
    id: record.id,
    isCompleted: Boolean(record.completedAt),
    listId: record.listId,
    tags,
    title: record.title,
  };
}
