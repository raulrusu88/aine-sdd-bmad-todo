import type { Task } from "~~/shared/types/api";

import type { TaskRecord } from "~~/db/schema/tasks";

export function mapTaskRecordToTask(record: TaskRecord): Task {
  return {
    createdAt: record.createdAt,
    description: record.description,
    id: record.id,
    listId: record.listId,
    title: record.title,
  };
}
