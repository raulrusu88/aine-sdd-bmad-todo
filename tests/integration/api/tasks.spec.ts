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
  completeTaskRecord,
  createTaskRecord,
  deleteTaskRecord,
  getTaskById,
  getTasksByListIdAndTag,
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
      tags: [],
      title: "Plan sprint",
    });
    expect(fetchedTask).toMatchObject({
      description: "Review acceptance criteria",
      id: createdTask.id,
      listId: parentList.id,
      tags: [],
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
      tags: [],
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
          tags: ["urgent", "Calls"],
          title: "Finalize sprint plan",
        },
        testDatabase.db,
      ),
    ).resolves.toMatchObject({
      description: null,
      id: createdTask.id,
      tags: ["urgent", "Calls"],
      title: "Finalize sprint plan",
    });

    await expect(
      updateTaskRecord(
        createdTask.id,
        {
          description: "   ",
          tags: ["Calls"],
          title: "Finalize sprint plan",
        },
        testDatabase.db,
      ),
    ).resolves.toMatchObject({
      description: null,
      id: createdTask.id,
      tags: ["Calls"],
      title: "Finalize sprint plan",
    });

    await expect(
      getTaskById(createdTask.id, testDatabase.db),
    ).resolves.toMatchObject({
      description: null,
      id: createdTask.id,
      tags: ["Calls"],
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

  it("marks tasks completed through the service layer without removing them from list retrieval", async () => {
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

    const completedTask = await completeTaskRecord(
      createdTask.id,
      testDatabase.db,
    );
    const listTasks = await getTasksByListId(parentList.id, testDatabase.db);
    const fetchedTask = await getTaskById(createdTask.id, testDatabase.db);

    expect(completedTask).toMatchObject({
      completedAt: expect.any(String),
      id: createdTask.id,
      isCompleted: true,
      listId: parentList.id,
      title: createdTask.title,
    });
    expect(listTasks).toHaveLength(1);
    expect(listTasks[0]).toMatchObject({
      completedAt: completedTask.completedAt,
      id: createdTask.id,
      isCompleted: true,
      title: createdTask.title,
    });
    expect(fetchedTask).toMatchObject({
      completedAt: completedTask.completedAt,
      id: createdTask.id,
      isCompleted: true,
      title: createdTask.title,
    });
  });

  it("filters tasks by tag through the service layer", async () => {
    const testDatabase = createListTestDatabase();
    cleanup = testDatabase.cleanup;

    const workList = await createTodoListRecord(
      {
        name: "Work",
      },
      testDatabase.db,
    );
    const errandsList = await createTodoListRecord(
      {
        name: "Errands",
      },
      testDatabase.db,
    );
    const urgentTask = await createTaskRecord(
      {
        listId: workList.id,
        title: "Finalize sprint plan",
      },
      testDatabase.db,
    );
    const callsTask = await createTaskRecord(
      {
        listId: workList.id,
        title: "Call vendor",
      },
      testDatabase.db,
    );
    const errandsTask = await createTaskRecord(
      {
        listId: errandsList.id,
        title: "Call plumber",
      },
      testDatabase.db,
    );

    await updateTaskRecord(
      urgentTask.id,
      {
        description: urgentTask.description ?? undefined,
        tags: ["urgent"],
        title: urgentTask.title,
      },
      testDatabase.db,
    );
    await updateTaskRecord(
      callsTask.id,
      {
        description: callsTask.description ?? undefined,
        tags: ["Calls"],
        title: callsTask.title,
      },
      testDatabase.db,
    );
    await updateTaskRecord(
      errandsTask.id,
      {
        description: errandsTask.description ?? undefined,
        tags: ["urgent"],
        title: errandsTask.title,
      },
      testDatabase.db,
    );

    await expect(
      getTasksByListIdAndTag(workList.id, "URGENT", testDatabase.db),
    ).resolves.toMatchObject([
      {
        id: urgentTask.id,
        listId: workList.id,
        tags: ["urgent"],
        title: urgentTask.title,
      },
    ]);
    await expect(
      getTasksByListIdAndTag(workList.id, "calls", testDatabase.db),
    ).resolves.toMatchObject([
      {
        id: callsTask.id,
        listId: workList.id,
        tags: ["Calls"],
        title: callsTask.title,
      },
    ]);
  });

  it("rejects invalid task tag updates before persistence", async () => {
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

    await expect(
      updateTaskRecord(
        createdTask.id,
        {
          tags: ["urgent", "Urgent"],
          title: "Plan sprint",
        },
        testDatabase.db,
      ),
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      details: {
        "tags.1": ["Duplicate tags are not allowed."],
      },
      statusCode: 400,
    });

    await expect(
      getTaskById(createdTask.id, testDatabase.db),
    ).resolves.toMatchObject({
      id: createdTask.id,
      tags: [],
      title: "Plan sprint",
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
      tags: [],
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

  it("filters tasks by tag through the API and returns empty collections when nothing matches", async () => {
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

    const workTaskResponse = await fetch(`${context.url}/api/tasks`, {
      body: JSON.stringify({
        listId: workList.id,
        title: "Plan sprint",
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });
    const workTask = (await workTaskResponse.json()) as Task;

    const errandsTaskResponse = await fetch(`${context.url}/api/tasks`, {
      body: JSON.stringify({
        listId: errandsList.id,
        title: "Plan errands",
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });
    const errandsTask = (await errandsTaskResponse.json()) as Task;

    await fetch(`${context.url}/api/tasks/${workTask.id}`, {
      body: JSON.stringify({
        description: workTask.description ?? undefined,
        tags: ["urgent", "Calls"],
        title: workTask.title,
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "PATCH",
    });
    await fetch(`${context.url}/api/tasks/${errandsTask.id}`, {
      body: JSON.stringify({
        description: errandsTask.description ?? undefined,
        tags: ["urgent"],
        title: errandsTask.title,
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "PATCH",
    });

    const urgentResponse = await fetch(
      `${context.url}/api/tasks?listId=${workList.id}&tag=URGENT`,
    );
    const urgentBody = (await urgentResponse.json()) as TaskCollectionResponse;

    const noMatchResponse = await fetch(
      `${context.url}/api/tasks?listId=${workList.id}&tag=weekend`,
    );
    const noMatchBody =
      (await noMatchResponse.json()) as TaskCollectionResponse;

    expect(urgentResponse.status).toBe(200);
    expect(urgentBody).toEqual({
      items: [
        expect.objectContaining({
          id: workTask.id,
          listId: workList.id,
          tags: ["urgent", "Calls"],
          title: "Plan sprint",
        }),
      ],
      total: 1,
    });
    expect(noMatchResponse.status).toBe(200);
    expect(noMatchBody).toEqual({
      items: [],
      total: 0,
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
          tags: ["urgent", "calls"],
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
    const reducedTagResponse = await fetch(
      `${context.url}/api/tasks/${createdTask.id}`,
      {
        body: JSON.stringify({
          description: "Share the revised agenda",
          tags: ["urgent"],
          title: "Finalize sprint plan",
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "PATCH",
      },
    );
    const reducedTagTask = (await reducedTagResponse.json()) as Task;
    const reducedCollectionResponse = await fetch(
      `${context.url}/api/tasks?listId=${parentList.id}`,
    );
    const reducedCollectionBody =
      (await reducedCollectionResponse.json()) as TaskCollectionResponse;

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
      tags: ["urgent", "calls"],
      title: "Finalize sprint plan",
    });
    expect(collectionResponse.status).toBe(200);
    expect(collectionBody.items).toEqual([updatedTask]);
    expect(reducedTagResponse.status).toBe(200);
    expect(reducedTagTask).toMatchObject({
      description: "Share the revised agenda",
      id: createdTask.id,
      listId: parentList.id,
      tags: ["urgent"],
      title: "Finalize sprint plan",
    });
    expect(reducedCollectionResponse.status).toBe(200);
    expect(reducedCollectionBody.items).toEqual([reducedTagTask]);
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

  it("completes a task through the API and keeps it in the list collection as completed work", async () => {
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

    const completeResponse = await fetch(
      `${context.url}/api/tasks/${createdTask.id}/complete`,
      {
        method: "POST",
      },
    );
    const completedTask = (await completeResponse.json()) as Task;
    const collectionResponse = await fetch(
      `${context.url}/api/tasks?listId=${parentList.id}`,
    );
    const collectionBody =
      (await collectionResponse.json()) as TaskCollectionResponse;

    expect(completeResponse.status).toBe(200);
    expect(completedTask).toMatchObject({
      completedAt: expect.any(String),
      id: createdTask.id,
      isCompleted: true,
      listId: parentList.id,
      title: createdTask.title,
    });
    expect(collectionResponse.status).toBe(200);
    expect(collectionBody).toEqual({
      items: [completedTask],
      total: 1,
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

    const invalidListQueryResponse = await fetch(
      `${context.url}/api/tasks?listId=`,
    );
    const invalidListQueryBody =
      (await invalidListQueryResponse.json()) as ApiErrorResponse;

    const invalidTagQueryResponse = await fetch(
      `${context.url}/api/tasks?listId=${parentList.id}&tag=${"x".repeat(41)}`,
    );
    const invalidTagQueryBody =
      (await invalidTagQueryResponse.json()) as ApiErrorResponse;

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
    expect(invalidTagQueryResponse.status).toBe(400);
    expect(invalidTagQueryBody).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        details: {
          tag: ["Tag must be 40 characters or fewer"],
        },
        message: "Please provide a valid task filter.",
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
          tags: ["urgent", "Urgent"],
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
          "tags.1": ["Duplicate tags are not allowed."],
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
