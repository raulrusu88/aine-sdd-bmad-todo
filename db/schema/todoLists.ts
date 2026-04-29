import { sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const todoLists = sqliteTable(
  "todo_lists",
  {
    createdAt: text("created_at").notNull(),
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    nameNormalized: text("name_normalized").notNull(),
  },
  (table) => [
    uniqueIndex("todo_lists_name_normalized_unique").on(table.nameNormalized),
  ],
);

export type NewTodoListRecord = typeof todoLists.$inferInsert;
export type TodoListRecord = typeof todoLists.$inferSelect;
