import type { TodoList } from "~~/shared/types/api";

import type { TodoListRecord } from "~~/db/schema/todoLists";

export function mapTodoListRecordToTodoList(record: TodoListRecord): TodoList {
  return {
    createdAt: record.createdAt,
    id: record.id,
    name: record.name,
  };
}
