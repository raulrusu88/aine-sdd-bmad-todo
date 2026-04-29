import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { todoLists } from "./todoLists";

export const tasks = sqliteTable(
  "tasks",
  {
    completedAt: text("completed_at"),
    createdAt: text("created_at").notNull(),
    description: text("description"),
    id: text("id").primaryKey(),
    listId: text("list_id")
      .notNull()
      .references(() => todoLists.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
  },
  (table) => [index("idx_tasks_list_id").on(table.listId)],
);

export type NewTaskRecord = typeof tasks.$inferInsert;
export type TaskRecord = typeof tasks.$inferSelect;
