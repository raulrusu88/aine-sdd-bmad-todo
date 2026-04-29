import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useTaskStore } from "~~/app/stores/useTaskStore";

import type { Task, TaskCollectionResponse } from "~~/shared/types/api";

function createTask(overrides: Partial<Task> = {}): Task {
  return {
    createdAt: "2026-04-28T12:00:00.000Z",
    description: "Review acceptance criteria",
    id: "task-1",
    listId: "list-1",
    tags: [],
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

  it("applies and clears tag filters without losing the full task list", async () => {
    const store = useTaskStore();
    const urgentTask = createTask({
      tags: ["urgent"],
    });
    const callsTask = createTask({
      createdAt: "2026-04-28T12:01:00.000Z",
      id: "task-2",
      tags: ["Calls"],
      title: "Call vendor",
    });

    fetchMock.mockResolvedValueOnce({
      items: [urgentTask, callsTask],
      total: 2,
    } satisfies TaskCollectionResponse);

    await expect(store.loadTasks(urgentTask.listId)).resolves.toEqual([
      urgentTask,
      callsTask,
    ]);

    fetchMock.mockResolvedValueOnce({
      items: [urgentTask],
      total: 1,
    } satisfies TaskCollectionResponse);

    await expect(store.applyTagFilter("urgent")).resolves.toEqual([urgentTask]);

    expect(fetchMock).toHaveBeenLastCalledWith("/api/tasks", {
      cache: "no-store",
      query: {
        listId: urgentTask.listId,
        tag: "urgent",
      },
    });
    expect(store.activeTagFilter).toBe("urgent");
    expect(store.availableTaskTags).toEqual(["Calls", "urgent"]);
    expect(store.tasks).toEqual([urgentTask]);

    store.clearTagFilter();

    expect(store.activeTagFilter).toBeNull();
    expect(store.loadError).toBeNull();
    expect(store.tasks).toEqual([urgentTask, callsTask]);
  });

  it("preserves the last confirmed task view when a filter request fails", async () => {
    const store = useTaskStore();
    const urgentTask = createTask({
      tags: ["urgent"],
    });
    const callsTask = createTask({
      createdAt: "2026-04-28T12:01:00.000Z",
      id: "task-2",
      tags: ["Calls"],
      title: "Call vendor",
    });

    fetchMock.mockResolvedValueOnce({
      items: [urgentTask, callsTask],
      total: 2,
    } satisfies TaskCollectionResponse);

    await store.loadTasks(urgentTask.listId);

    fetchMock.mockRejectedValueOnce(
      createApiError(
        500,
        "The tasks could not be filtered. Clear the filter or try a different tag.",
      ),
    );

    await expect(store.applyTagFilter("urgent")).resolves.toEqual([
      urgentTask,
      callsTask,
    ]);

    expect(store.activeTagFilter).toBeNull();
    expect(store.loadError).toBe(
      "The tasks could not be filtered. Clear the filter or try a different tag.",
    );
    expect(store.tasks).toEqual([urgentTask, callsTask]);

    store.clearTagFilter();

    expect(store.activeTagFilter).toBeNull();
    expect(store.loadError).toBeNull();
    expect(store.tasks).toEqual([urgentTask, callsTask]);
  });

  it("keeps filtered task visibility aligned after tag updates", async () => {
    const store = useTaskStore();
    const task = createTask({
      tags: ["urgent"],
    });
    const updatedTask = createTask({
      tags: ["weekend"],
      title: "Finalize sprint plan",
    });

    store.$patch({
      activeTagFilter: "urgent",
      allTasks: [task],
      currentListId: task.listId,
      tasks: [task],
    });

    fetchMock.mockResolvedValueOnce(updatedTask);

    await expect(
      store.updateTask(task.id, {
        description: task.description ?? undefined,
        tags: ["weekend"],
        title: updatedTask.title,
      }),
    ).resolves.toEqual(updatedTask);

    expect(store.allTasks).toEqual([updatedTask]);
    expect(store.tasks).toEqual([]);
  });

  it("applies persisted tag updates to the active task list", async () => {
    const store = useTaskStore();
    const task = createTask();
    const updatedTask = createTask({
      tags: ["urgent", "calls"],
      title: "Finalize sprint plan",
    });

    store.$patch({
      currentListId: task.listId,
      tasks: [task],
    });

    fetchMock.mockResolvedValueOnce(updatedTask);

    await expect(
      store.updateTask(task.id, {
        description: task.description ?? undefined,
        tags: ["urgent", "calls"],
        title: updatedTask.title,
      }),
    ).resolves.toEqual(updatedTask);

    expect(store.tasks).toEqual([updatedTask]);
    expect(store.updateErrorForTask(task.id)).toBeNull();
  });
});
