import { afterEach, describe, expect, it } from "vitest";

import { createTaskRequestSchema } from "~~/shared/schemas/index";
import type {
  ApiErrorResponse,
  Task,
  TaskCollectionResponse,
  TodoList,
} from "~~/shared/types/api";

import {
  createTodoListRecord,
  deleteTodoListRecord,
} from "~~/server/lib/services/listService";
import {
  createTaskRecord,
  deleteTaskRecord,
  getTaskById,
  getTasksByListId,
  updateTaskRecord,
} from "~~/server/lib/services/taskService";
import {
  createListApiTestContext,
  createListTestDatabase,
} from "~~/tests/fixtures/lists";

describe("task validation and persistence", () => {
  let cleanup: (() => void) | null = null;

  afterEach(() => {
    cleanup?.();
    cleanup = null;
  });

  it("rejects blank task titles at the schema boundary", () => {
    expect(() =>
      createTaskRequestSchema.parse({
        listId: "list-1",
        title: "   ",
      }),
    ).toThrowError("Task title is required");
  });

  it("persists created tasks through the service layer", async () => {
    const testDatabase = createListTestDatabase();
    cleanup = testDatabase.cleanup;

    const parentList = await createTodoListRecord(
      {
        name: "Work",
      },
      testDatabase.db,
    );
    const createdTask = await createTaskRecord(
      {
        description: "Review acceptance criteria",
        listId: parentList.id,
        title: "Plan sprint",
      },
      testDatabase.db,
    );
    const tasks = await getTasksByListId(parentList.id, testDatabase.db);
    const fetchedTask = await getTaskById(createdTask.id, testDatabase.db);

    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toMatchObject({
      description: "Review acceptance criteria",
      id: createdTask.id,
      listId: parentList.id,
      title: "Plan sprint",
    });
    expect(fetchedTask).toMatchObject({
      description: "Review acceptance criteria",
      id: createdTask.id,
      listId: parentList.id,
      title: "Plan sprint",
    });
  });

  it("stores blank descriptions as null", async () => {
    const testDatabase = createListTestDatabase();
    cleanup = testDatabase.cleanup;

    const parentList = await createTodoListRecord(
      {
        name: "Work",
      },
      testDatabase.db,
    );

    await expect(
      createTaskRecord(
        {
          description: "   ",
          listId: parentList.id,
          title: "Call vendor",
        },
        testDatabase.db,
      ),
    ).resolves.toMatchObject({
      description: null,
      listId: parentList.id,
      title: "Call vendor",
    });
  });

  it("updates and deletes tasks through the service layer", async () => {
    const testDatabase = createListTestDatabase();
    cleanup = testDatabase.cleanup;

    const parentList = await createTodoListRecord(
      {
        name: "Work",
      },
      testDatabase.db,
    );
    const createdTask = await createTaskRecord(
      {
        description: "Review acceptance criteria",
        listId: parentList.id,
        title: "Plan sprint",
      },
      testDatabase.db,
    );

    await expect(
      updateTaskRecord(
        createdTask.id,
        {
          description: "   ",
          title: "Finalize sprint plan",
        },
        testDatabase.db,
      ),
    ).resolves.toMatchObject({
      description: null,
      id: createdTask.id,
      title: "Finalize sprint plan",
    });

    await expect(
      deleteTaskRecord(createdTask.id, testDatabase.db),
    ).resolves.toEqual({
      id: createdTask.id,
    });

    await expect(
      getTaskById(createdTask.id, testDatabase.db),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      statusCode: 404,
    });
  });

  it("rejects task creates for missing lists", async () => {
    const testDatabase = createListTestDatabase();
    cleanup = testDatabase.cleanup;

    await expect(
      createTaskRecord(
        {
          listId: "missing-list",
          title: "Plan sprint",
        },
        testDatabase.db,
      ),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      statusCode: 404,
    });
  });

  it("removes child tasks when the parent list is deleted", async () => {
    const testDatabase = createListTestDatabase();
    cleanup = testDatabase.cleanup;

    const parentList = await createTodoListRecord(
      {
        name: "Work",
      },
      testDatabase.db,
    );
    const createdTask = await createTaskRecord(
      {
        listId: parentList.id,
        title: "Plan sprint",
      },
      testDatabase.db,
    );

    await deleteTodoListRecord(parentList.id, testDatabase.db);

    await expect(
      getTaskById(createdTask.id, testDatabase.db),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      statusCode: 404,
    });
  });
});

describe("task API", () => {
  let cleanup: (() => Promise<void>) | null = null;

  afterEach(async () => {
    if (!cleanup) {
      return;
    }

    await cleanup();
    cleanup = null;
  });

  it("creates a task, returns the list-scoped collection, and fetches the task by id", async () => {
    const context = await createListApiTestContext();
    cleanup = context.cleanup;

    const listResponse = await fetch(`${context.url}/api/lists`, {
      body: JSON.stringify({
        name: "Work",
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });
    const parentList = (await listResponse.json()) as TodoList;

    const createResponse = await fetch(`${context.url}/api/tasks`, {
      body: JSON.stringify({
        description: "Review acceptance criteria",
        listId: parentList.id,
        title: "Plan sprint",
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });
    const createdTask = (await createResponse.json()) as Task;
    const collectionResponse = await fetch(
      `${context.url}/api/tasks?listId=${parentList.id}`,
    );
    const collectionBody =
      (await collectionResponse.json()) as TaskCollectionResponse;
    const itemResponse = await fetch(
      `${context.url}/api/tasks/${createdTask.id}`,
    );
    const itemBody = (await itemResponse.json()) as Task;

    expect(createResponse.status).toBe(201);
    expect(createdTask).toMatchObject({
      description: "Review acceptance criteria",
      id: expect.any(String),
      listId: parentList.id,
      title: "Plan sprint",
    });
    expect(createdTask.createdAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
    );
    expect(collectionResponse.status).toBe(200);
    expect(collectionBody.total).toBe(1);
    expect(collectionBody.items).toEqual([createdTask]);
    expect(itemResponse.status).toBe(200);
    expect(itemBody).toEqual(createdTask);
  });

  it("scopes task retrieval to the selected list", async () => {
    const context = await createListApiTestContext();
    cleanup = context.cleanup;

    const workResponse = await fetch(`${context.url}/api/lists`, {
      body: JSON.stringify({
        name: "Work",
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });
    const workList = (await workResponse.json()) as TodoList;

    const errandsResponse = await fetch(`${context.url}/api/lists`, {
      body: JSON.stringify({
        name: "Errands",
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });
    const errandsList = (await errandsResponse.json()) as TodoList;

    await fetch(`${context.url}/api/tasks`, {
      body: JSON.stringify({
        listId: workList.id,
        title: "Plan sprint",
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });
    await fetch(`${context.url}/api/tasks`, {
      body: JSON.stringify({
        listId: errandsList.id,
        title: "Buy milk",
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });

    const response = await fetch(
      `${context.url}/api/tasks?listId=${workList.id}`,
    );
    const body = (await response.json()) as TaskCollectionResponse;

    expect(response.status).toBe(200);
    expect(body.total).toBe(1);
    expect(body.items[0]).toMatchObject({
      listId: workList.id,
      title: "Plan sprint",
    });
  });

  it("updates and deletes tasks through the API", async () => {
    const context = await createListApiTestContext();
    cleanup = context.cleanup;

    const listResponse = await fetch(`${context.url}/api/lists`, {
      body: JSON.stringify({
        name: "Work",
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });
    const parentList = (await listResponse.json()) as TodoList;

    const createResponse = await fetch(`${context.url}/api/tasks`, {
      body: JSON.stringify({
        description: "Review acceptance criteria",
        listId: parentList.id,
        title: "Plan sprint",
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });
    const createdTask = (await createResponse.json()) as Task;

    const updateResponse = await fetch(
      `${context.url}/api/tasks/${createdTask.id}`,
      {
        body: JSON.stringify({
          description: "Share the revised agenda",
          title: "Finalize sprint plan",
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "PATCH",
      },
    );
    const updatedTask = (await updateResponse.json()) as Task;
    const collectionResponse = await fetch(
      `${context.url}/api/tasks?listId=${parentList.id}`,
    );
    const collectionBody =
      (await collectionResponse.json()) as TaskCollectionResponse;

    const deleteResponse = await fetch(
      `${context.url}/api/tasks/${createdTask.id}`,
      {
        method: "DELETE",
      },
    );
    const deleteBody = (await deleteResponse.json()) as { id: string };
    const postDeleteCollectionResponse = await fetch(
      `${context.url}/api/tasks?listId=${parentList.id}`,
    );
    const postDeleteCollectionBody =
      (await postDeleteCollectionResponse.json()) as TaskCollectionResponse;

    expect(updateResponse.status).toBe(200);
    expect(updatedTask).toMatchObject({
      description: "Share the revised agenda",
      id: createdTask.id,
      listId: parentList.id,
      title: "Finalize sprint plan",
    });
    expect(collectionResponse.status).toBe(200);
    expect(collectionBody.items).toEqual([updatedTask]);
    expect(deleteResponse.status).toBe(200);
    expect(deleteBody).toEqual({
      id: createdTask.id,
    });
    expect(postDeleteCollectionResponse.status).toBe(200);
    expect(postDeleteCollectionBody).toEqual({
      items: [],
      total: 0,
    });
  });

  it("returns actionable errors for invalid task input and missing parent lists", async () => {
    const context = await createListApiTestContext();
    cleanup = context.cleanup;

    const invalidResponse = await fetch(`${context.url}/api/tasks`, {
      body: JSON.stringify({
        listId: "list-1",
        title: "   ",
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });
    const invalidBody = (await invalidResponse.json()) as ApiErrorResponse;

    const missingListResponse = await fetch(`${context.url}/api/tasks`, {
      body: JSON.stringify({
        listId: "missing-list",
        title: "Plan sprint",
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });
    const missingListBody =
      (await missingListResponse.json()) as ApiErrorResponse;

    expect(invalidResponse.status).toBe(400);
    expect(invalidBody).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        details: {
          title: ["Task title is required"],
        },
        message: "Please enter valid task details.",
      },
    });
    expect(missingListResponse.status).toBe(404);
    expect(missingListBody).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "Todo list not found.",
      },
    });
  });

  it("treats malformed task JSON bodies as validation errors", async () => {
    const context = await createListApiTestContext();
    cleanup = context.cleanup;

    const response = await fetch(`${context.url}/api/tasks`, {
      body: '{"title":',
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });
    const body = (await response.json()) as ApiErrorResponse;

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Please enter valid task details.",
      },
    });
  });

  it("returns actionable errors for invalid task queries and missing tasks", async () => {
    const context = await createListApiTestContext();
    cleanup = context.cleanup;

    const invalidListQueryResponse = await fetch(
      `${context.url}/api/tasks?listId=`,
    );
    const invalidListQueryBody =
      (await invalidListQueryResponse.json()) as ApiErrorResponse;

    const missingTaskResponse = await fetch(
      `${context.url}/api/tasks/missing-task`,
    );
    const missingTaskBody =
      (await missingTaskResponse.json()) as ApiErrorResponse;

    expect(invalidListQueryResponse.status).toBe(400);
    expect(invalidListQueryBody).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        details: {
          root: ["Too small: expected string to have >=1 characters"],
        },
        message: "Please provide a valid todo list identifier.",
      },
    });
    expect(missingTaskResponse.status).toBe(404);
    expect(missingTaskBody).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "Task not found.",
      },
    });
  });

  it("returns actionable errors for invalid task updates and deletes", async () => {
    const context = await createListApiTestContext();
    cleanup = context.cleanup;

    const invalidUpdateResponse = await fetch(
      `${context.url}/api/tasks/task-1`,
      {
        body: JSON.stringify({
          title: "   ",
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "PATCH",
      },
    );
    const invalidUpdateBody =
      (await invalidUpdateResponse.json()) as ApiErrorResponse;

    const missingTaskUpdateResponse = await fetch(
      `${context.url}/api/tasks/missing-task`,
      {
        body: JSON.stringify({
          title: "Finalize sprint plan",
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "PATCH",
      },
    );
    const missingTaskUpdateBody =
      (await missingTaskUpdateResponse.json()) as ApiErrorResponse;

    const malformedUpdateResponse = await fetch(
      `${context.url}/api/tasks/task-1`,
      {
        body: '{"title":',
        headers: {
          "content-type": "application/json",
        },
        method: "PATCH",
      },
    );
    const malformedUpdateBody =
      (await malformedUpdateResponse.json()) as ApiErrorResponse;

    const missingTaskDeleteResponse = await fetch(
      `${context.url}/api/tasks/missing-task`,
      {
        method: "DELETE",
      },
    );
    const missingTaskDeleteBody =
      (await missingTaskDeleteResponse.json()) as ApiErrorResponse;

    expect(invalidUpdateResponse.status).toBe(400);
    expect(invalidUpdateBody).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        details: {
          title: ["Task title is required"],
        },
        message: "Please enter valid task details.",
      },
    });
    expect(missingTaskUpdateResponse.status).toBe(404);
    expect(missingTaskUpdateBody).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "Task not found.",
      },
    });
    expect(malformedUpdateResponse.status).toBe(400);
    expect(malformedUpdateBody).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Please enter valid task details.",
      },
    });
    expect(missingTaskDeleteResponse.status).toBe(404);
    expect(missingTaskDeleteBody).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "Task not found.",
      },
    });
  });
});
