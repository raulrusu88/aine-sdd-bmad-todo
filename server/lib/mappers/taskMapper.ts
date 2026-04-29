import type { Task, TaskTag } from "~~/shared/types/api";

import type { TaskRecord } from "~~/db/schema/tasks";

export function mapTaskRecordToTask(
  record: TaskRecord,
  tags: TaskTag[] = [],
): Task {
  return {
    createdAt: record.createdAt,
    description: record.description,
    id: record.id,
    listId: record.listId,
    tags,
    title: record.title,
  };
}
