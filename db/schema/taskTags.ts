import { index, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import { tasks } from "./tasks";

export const taskTags = sqliteTable(
  "task_tags",
  {
    createdAt: text("created_at").notNull(),
    name: text("name").notNull(),
    nameNormalized: text("name_normalized").notNull(),
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("idx_task_tags_name_normalized").on(table.nameNormalized),
    index("idx_task_tags_task_id").on(table.taskId),
    uniqueIndex("task_tags_task_id_name_normalized_unique").on(
      table.taskId,
      table.nameNormalized,
    ),
  ],
);

export type NewTaskTagRecord = typeof taskTags.$inferInsert;
export type TaskTagRecord = typeof taskTags.$inferSelect;
