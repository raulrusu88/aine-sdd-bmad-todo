import { afterEach, describe, expect, it } from "vitest";

import {
  createTodoListRequestSchema,
  updateTodoListRequestSchema,
} from "~~/shared/schemas/index";
import type {
  ApiErrorResponse,
  DeleteTodoListResponse,
  TodoList,
  TodoListCollectionResponse,
} from "~~/shared/types/api";

import {
  createTodoListRecord,
  deleteTodoListRecord,
  getTodoListById,
  getTodoLists,
  updateTodoListRecord,
} from "~~/server/lib/services/listService";
import {
  createListApiTestContext,
  createListTestDatabase,
} from "~~/tests/fixtures/lists";

describe("todo list validation and persistence", () => {
  let cleanup: (() => void) | null = null;

  afterEach(() => {
    cleanup?.();
    cleanup = null;
  });

  it("rejects blank list names at the schema boundary", () => {
    expect(() =>
      createTodoListRequestSchema.parse({
        name: "   ",
      }),
    ).toThrowError("List name is required");
  });

  it("rejects blank renamed list names at the schema boundary", () => {
    expect(() =>
      updateTodoListRequestSchema.parse({
        name: "   ",
      }),
    ).toThrowError("List name is required");
  });

  it("persists created lists through the service layer", async () => {
    const testDatabase = createListTestDatabase();
    cleanup = testDatabase.cleanup;

    const createdList = await createTodoListRecord(
      {
        name: "Work",
      },
      testDatabase.db,
    );
    const lists = await getTodoLists(testDatabase.db);
    const fetchedList = await getTodoListById(createdList.id, testDatabase.db);

    expect(lists).toHaveLength(1);
    expect(lists[0]).toMatchObject({
      id: createdList.id,
      name: "Work",
    });
    expect(fetchedList).toMatchObject({
      id: createdList.id,
      name: "Work",
    });
  });

  it("normalizes equivalent Unicode names before duplicate checks", async () => {
    const testDatabase = createListTestDatabase();
    cleanup = testDatabase.cleanup;

    await createTodoListRecord(
      {
        name: "Cafe\u0301",
      },
      testDatabase.db,
    );

    await expect(
      createTodoListRecord(
        {
          name: "Café",
        },
        testDatabase.db,
      ),
    ).rejects.toMatchObject({
      code: "CONFLICT",
      statusCode: 409,
    });
  });

  it("maps duplicate create races to a conflict error", async () => {
    const testDatabase = createListTestDatabase();
    cleanup = testDatabase.cleanup;

    const results = await Promise.allSettled([
      createTodoListRecord(
        {
          name: "Work",
        },
        testDatabase.db,
      ),
      createTodoListRecord(
        {
          name: "work",
        },
        testDatabase.db,
      ),
    ]);
    const rejectedResult = results.find(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );

    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(rejectedResult).toBeDefined();
    expect(rejectedResult?.reason).toMatchObject({
      code: "CONFLICT",
      message: "A todo list with that name already exists.",
      statusCode: 409,
    });
    expect(await getTodoLists(testDatabase.db)).toHaveLength(1);
  });

  it("renames persisted lists through the service layer", async () => {
    const testDatabase = createListTestDatabase();
    cleanup = testDatabase.cleanup;

    const createdList = await createTodoListRecord(
      {
        name: "Work",
      },
      testDatabase.db,
    );

    const renamedList = await updateTodoListRecord(
      createdList.id,
      {
        name: "Home",
      },
      testDatabase.db,
    );
    const fetchedList = await getTodoListById(createdList.id, testDatabase.db);

    expect(renamedList).toMatchObject({
      createdAt: createdList.createdAt,
      id: createdList.id,
      name: "Home",
    });
    expect(fetchedList).toMatchObject({
      id: createdList.id,
      name: "Home",
    });
  });

  it("rejects renames that collide with another normalized list name", async () => {
    const testDatabase = createListTestDatabase();
    cleanup = testDatabase.cleanup;

    await createTodoListRecord(
      {
        name: "Work",
      },
      testDatabase.db,
    );
    const personalList = await createTodoListRecord(
      {
        name: "Personal",
      },
      testDatabase.db,
    );

    await expect(
      updateTodoListRecord(
        personalList.id,
        {
          name: "work",
        },
        testDatabase.db,
      ),
    ).rejects.toMatchObject({
      code: "CONFLICT",
      statusCode: 409,
    });
  });

  it("deletes persisted lists through the service layer", async () => {
    const testDatabase = createListTestDatabase();
    cleanup = testDatabase.cleanup;

    const createdList = await createTodoListRecord(
      {
        name: "Work",
      },
      testDatabase.db,
    );

    await expect(
      deleteTodoListRecord(createdList.id, testDatabase.db),
    ).resolves.toEqual({
      id: createdList.id,
    });
    await expect(
      getTodoListById(createdList.id, testDatabase.db),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      statusCode: 404,
    });
    expect(await getTodoLists(testDatabase.db)).toHaveLength(0);
  });
});

describe("todo list API", () => {
  let cleanup: (() => Promise<void>) | null = null;

  afterEach(async () => {
    if (!cleanup) {
      return;
    }

    await cleanup();
    cleanup = null;
  });

  it("creates a list, returns the collection, and fetches the list by id", async () => {
    const context = await createListApiTestContext();
    cleanup = context.cleanup;

    const createResponse = await fetch(`${context.url}/api/lists`, {
      body: JSON.stringify({
        name: "Work",
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });
    const createdList = (await createResponse.json()) as TodoList;
    const collectionResponse = await fetch(`${context.url}/api/lists`);
    const collectionBody =
      (await collectionResponse.json()) as TodoListCollectionResponse;
    const itemResponse = await fetch(
      `${context.url}/api/lists/${createdList.id}`,
    );
    const itemBody = (await itemResponse.json()) as TodoList;

    expect(createResponse.status).toBe(201);
    expect(createdList).toMatchObject({
      id: expect.any(String),
      name: "Work",
    });
    expect(createdList.createdAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
    );
    expect(collectionResponse.status).toBe(200);
    expect(collectionBody.total).toBe(1);
    expect(collectionBody.items).toEqual([createdList]);
    expect(itemResponse.status).toBe(200);
    expect(itemBody).toEqual(createdList);
  });

  it("returns actionable errors for invalid and duplicate list names", async () => {
    const context = await createListApiTestContext();
    cleanup = context.cleanup;

    const invalidResponse = await fetch(`${context.url}/api/lists`, {
      body: JSON.stringify({
        name: "   ",
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });
    const invalidBody = (await invalidResponse.json()) as ApiErrorResponse;

    await fetch(`${context.url}/api/lists`, {
      body: JSON.stringify({
        name: "Work",
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });

    const duplicateResponse = await fetch(`${context.url}/api/lists`, {
      body: JSON.stringify({
        name: "work",
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });
    const duplicateBody = (await duplicateResponse.json()) as ApiErrorResponse;

    expect(invalidResponse.status).toBe(400);
    expect(invalidBody).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        details: {
          name: ["List name is required"],
        },
        message: "Please enter a valid todo list name.",
      },
    });
    expect(duplicateResponse.status).toBe(409);
    expect(duplicateBody).toEqual({
      error: {
        code: "CONFLICT",
        details: {
          field: "name",
        },
        message: "A todo list with that name already exists.",
      },
    });
  });

  it("treats malformed JSON bodies as validation errors", async () => {
    const context = await createListApiTestContext();
    cleanup = context.cleanup;

    const response = await fetch(`${context.url}/api/lists`, {
      body: '{"name":',
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
        message: "Please enter a valid todo list name.",
      },
    });
  });

  it("renames a list, returns the updated resource, and persists the new name", async () => {
    const context = await createListApiTestContext();
    cleanup = context.cleanup;

    const createResponse = await fetch(`${context.url}/api/lists`, {
      body: JSON.stringify({
        name: "Work",
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });
    const createdList = (await createResponse.json()) as TodoList;

    const renameResponse = await fetch(
      `${context.url}/api/lists/${createdList.id}`,
      {
        body: JSON.stringify({
          name: "Home",
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "PATCH",
      },
    );
    const renamedList = (await renameResponse.json()) as TodoList;
    const itemResponse = await fetch(
      `${context.url}/api/lists/${createdList.id}`,
    );
    const itemBody = (await itemResponse.json()) as TodoList;
    const collectionResponse = await fetch(`${context.url}/api/lists`);
    const collectionBody =
      (await collectionResponse.json()) as TodoListCollectionResponse;

    expect(renameResponse.status).toBe(200);
    expect(renamedList).toEqual({
      ...createdList,
      name: "Home",
    });
    expect(itemResponse.status).toBe(200);
    expect(itemBody).toEqual(renamedList);
    expect(collectionResponse.status).toBe(200);
    expect(collectionBody.items).toEqual([renamedList]);
  });

  it("returns actionable errors for invalid, duplicate, and missing rename requests", async () => {
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

    const personalResponse = await fetch(`${context.url}/api/lists`, {
      body: JSON.stringify({
        name: "Personal",
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });
    const personalList = (await personalResponse.json()) as TodoList;

    const invalidResponse = await fetch(
      `${context.url}/api/lists/${personalList.id}`,
      {
        body: JSON.stringify({
          name: "   ",
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "PATCH",
      },
    );
    const invalidBody = (await invalidResponse.json()) as ApiErrorResponse;

    const duplicateResponse = await fetch(
      `${context.url}/api/lists/${personalList.id}`,
      {
        body: JSON.stringify({
          name: workList.name.toLowerCase(),
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "PATCH",
      },
    );
    const duplicateBody = (await duplicateResponse.json()) as ApiErrorResponse;

    const missingResponse = await fetch(
      `${context.url}/api/lists/does-not-exist`,
      {
        body: JSON.stringify({
          name: "Errands",
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "PATCH",
      },
    );
    const missingBody = (await missingResponse.json()) as ApiErrorResponse;

    expect(invalidResponse.status).toBe(400);
    expect(invalidBody).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        details: {
          name: ["List name is required"],
        },
        message: "Please enter a valid todo list name.",
      },
    });
    expect(duplicateResponse.status).toBe(409);
    expect(duplicateBody).toEqual({
      error: {
        code: "CONFLICT",
        details: {
          field: "name",
        },
        message: "A todo list with that name already exists.",
      },
    });
    expect(missingResponse.status).toBe(404);
    expect(missingBody).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "Todo list not found.",
      },
    });
  });

  it("deletes a list and keeps the remaining collection stable", async () => {
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

    const personalResponse = await fetch(`${context.url}/api/lists`, {
      body: JSON.stringify({
        name: "Personal",
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });
    const personalList = (await personalResponse.json()) as TodoList;

    const deleteResponse = await fetch(
      `${context.url}/api/lists/${personalList.id}`,
      {
        method: "DELETE",
      },
    );
    const deleteBody = (await deleteResponse.json()) as DeleteTodoListResponse;
    const collectionResponse = await fetch(`${context.url}/api/lists`);
    const collectionBody =
      (await collectionResponse.json()) as TodoListCollectionResponse;
    const deletedItemResponse = await fetch(
      `${context.url}/api/lists/${personalList.id}`,
    );
    const deletedItemBody =
      (await deletedItemResponse.json()) as ApiErrorResponse;

    expect(deleteResponse.status).toBe(200);
    expect(deleteBody).toEqual({
      id: personalList.id,
    });
    expect(collectionResponse.status).toBe(200);
    expect(collectionBody.total).toBe(1);
    expect(collectionBody.items).toEqual([workList]);
    expect(deletedItemResponse.status).toBe(404);
    expect(deletedItemBody).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "Todo list not found.",
      },
    });
  });

  it("returns a not-found error when deleting a missing list", async () => {
    const context = await createListApiTestContext();
    cleanup = context.cleanup;

    const response = await fetch(`${context.url}/api/lists/does-not-exist`, {
      method: "DELETE",
    });
    const body = (await response.json()) as ApiErrorResponse;

    expect(response.status).toBe(404);
    expect(body).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "Todo list not found.",
      },
    });
  });
});
