import { z } from "zod";

import { taskTagCollectionSchema, taskTagNameSchema } from "./tag";

export const entityIdSchema = z.string().trim().min(1);
export const isoTimestampSchema = z.string().datetime({ offset: true });
export const nonEmptyTrimmedStringSchema = z.string().trim().min(1);

export const todoListIdSchema = entityIdSchema;

export const todoListNameSchema = z
  .string()
  .trim()
  .min(1, "List name is required")
  .max(80, "List name must be 80 characters or fewer");

export const taskIdSchema = entityIdSchema;

export const taskTitleSchema = z
  .string()
  .trim()
  .min(1, "Task title is required")
  .max(200, "Task title must be 200 characters or fewer");

export const taskDescriptionSchema = z
  .string()
  .trim()
  .max(2000, "Task description must be 2000 characters or fewer");

export const createTodoListRequestSchema = z.object({
  name: todoListNameSchema,
});

export const updateTodoListRequestSchema = z.object({
  name: todoListNameSchema,
});

export const createTaskRequestSchema = z.object({
  description: taskDescriptionSchema.optional(),
  listId: todoListIdSchema,
  title: taskTitleSchema,
});

export const updateTaskRequestSchema = z.object({
  description: taskDescriptionSchema.optional(),
  tags: taskTagCollectionSchema.optional(),
  title: taskTitleSchema,
});

export const taskListFilterTagSchema = taskTagNameSchema.optional();

export const todoListSchema = z.object({
  createdAt: isoTimestampSchema,
  id: todoListIdSchema,
  name: todoListNameSchema,
});

export const taskSchema = z.object({
  createdAt: isoTimestampSchema,
  description: taskDescriptionSchema.nullable(),
  id: taskIdSchema,
  listId: todoListIdSchema,
  tags: taskTagCollectionSchema,
  title: taskTitleSchema,
});

export * from "./tag";
