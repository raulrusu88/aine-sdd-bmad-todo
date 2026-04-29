import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useTaskStore } from "~~/app/stores/useTaskStore";

import type { Task } from "~~/shared/types/api";

function createTask(overrides: Partial<Task> = {}): Task {
  return {
    createdAt: "2026-04-28T12:00:00.000Z",
    description: "Review acceptance criteria",
    id: "task-1",
    listId: "list-1",
    title: "Plan sprint",
    ...overrides,
  };
}

function createApiError(statusCode: number, message: string) {
  return {
    data: {
      error: {
        message,
      },
    },
    response: {
      status: statusCode,
    },
  };
}

function createDeferred<TValue>() {
  let reject!: (reason?: unknown) => void;
  let resolve!: (value: TValue | PromiseLike<TValue>) => void;

  const promise = new Promise<TValue>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return {
    promise,
    reject,
    resolve,
  };
}

describe("useTaskStore", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    setActivePinia(createPinia());
    vi.stubGlobal("$fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("removes a missing task from the active list when update returns 404", async () => {
    const store = useTaskStore();
    const task = createTask();

    store.$patch({
      currentListId: task.listId,
      tasks: [task],
    });

    fetchMock.mockRejectedValueOnce(createApiError(404, "Task not found."));

    await expect(
      store.updateTask(task.id, {
        description: task.description ?? undefined,
        title: "Finalize sprint plan",
      }),
    ).resolves.toBeNull();

    expect(store.tasks).toEqual([]);
    expect(store.updateErrorForTask(task.id)).toBeNull();
    expect(store.isUpdatingTask(task.id)).toBe(false);
  });

  it("removes a missing task from the active list when delete returns 404", async () => {
    const store = useTaskStore();
    const task = createTask();

    store.$patch({
      currentListId: task.listId,
      tasks: [task],
    });

    fetchMock.mockRejectedValueOnce(createApiError(404, "Task not found."));

    await expect(store.deleteTask(task.id)).resolves.toBeNull();

    expect(store.tasks).toEqual([]);
    expect(store.deleteErrorForTask(task.id)).toBeNull();
    expect(store.isDeletingTask(task.id)).toBe(false);
  });

  it("ignores late update responses after the task workspace resets", async () => {
    const store = useTaskStore();
    const task = createTask();
    const pendingUpdate = createDeferred<Task>();

    store.$patch({
      currentListId: task.listId,
      tasks: [task],
    });

    fetchMock.mockReturnValueOnce(pendingUpdate.promise);

    const updatePromise = store.updateTask(task.id, {
      description: "Share the revised agenda",
      title: "Finalize sprint plan",
    });

    store.resetTasks();
    pendingUpdate.resolve(
      createTask({
        description: "Share the revised agenda",
        title: "Finalize sprint plan",
      }),
    );

    await expect(updatePromise).resolves.toMatchObject({
      id: task.id,
      title: "Finalize sprint plan",
    });

    expect(store.currentListId).toBeNull();
    expect(store.tasks).toEqual([]);
    expect(store.updateErrorForTask(task.id)).toBeNull();
  });

  it("ignores late create responses after the task workspace resets", async () => {
    const store = useTaskStore();
    const task = createTask();
    const pendingCreate = createDeferred<Task>();

    store.$patch({
      currentListId: task.listId,
      tasks: [],
    });

    fetchMock.mockReturnValueOnce(pendingCreate.promise);

    const createPromise = store.createTask({
      description: task.description ?? undefined,
      listId: task.listId,
      title: task.title,
    });

    store.resetTasks();
    pendingCreate.resolve(task);

    await expect(createPromise).resolves.toBeNull();

    expect(store.createError).toBeNull();
    expect(store.currentListId).toBeNull();
    expect(store.isCreating).toBe(false);
    expect(store.tasks).toEqual([]);
  });
});
