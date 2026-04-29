import { defineStore } from "pinia";

import type {
  CreateTaskRequest,
  DeleteTaskResponse,
  Task,
  TaskCollectionResponse,
  UpdateTaskRequest,
} from "~~/shared/types/api";

type ApiErrorPayload = {
  error?: {
    details?: Record<string, unknown>;
    message?: string;
  };
};

type ApiErrorInfo = {
  message: string;
  statusCode: number | null;
};

function extractFieldErrorMessage(
  details?: Record<string, unknown>,
): string | null {
  if (!details) {
    return null;
  }

  for (const value of Object.values(details)) {
    if (!Array.isArray(value)) {
      continue;
    }

    const firstMessage = value.find(
      (item): item is string => typeof item === "string" && item.length > 0,
    );

    if (firstMessage) {
      return firstMessage;
    }
  }

  return null;
}

function extractApiErrorStatusCode(error: unknown): number | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  if ("statusCode" in error && typeof error.statusCode === "number") {
    return error.statusCode;
  }

  if ("status" in error && typeof error.status === "number") {
    return error.status;
  }

  if (
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "status" in error.response &&
    typeof error.response.status === "number"
  ) {
    return error.response.status;
  }

  return null;
}

function extractApiErrorInfo(
  error: unknown,
  fallbackMessage: string,
): ApiErrorInfo {
  let message: string | null = null;

  if (
    error &&
    typeof error === "object" &&
    "data" in error &&
    error.data &&
    typeof error.data === "object"
  ) {
    const apiError = (error.data as ApiErrorPayload).error;

    message =
      extractFieldErrorMessage(apiError?.details) ?? apiError?.message ?? null;
  }

  if (!message && error instanceof Error && error.message) {
    message = error.message;
  }

  return {
    message: message ?? fallbackMessage,
    statusCode: extractApiErrorStatusCode(error),
  };
}

function upsertTask(tasks: Task[], nextTask: Task): Task[] {
  const existingIndex = tasks.findIndex((task) => task.id === nextTask.id);

  if (existingIndex === -1) {
    return [...tasks, nextTask].sort((left, right) =>
      left.createdAt.localeCompare(right.createdAt),
    );
  }

  const nextTasks = [...tasks];
  nextTasks.splice(existingIndex, 1, nextTask);

  return nextTasks;
}

function removeTask(tasks: Task[], id: string): Task[] {
  return tasks.filter((task) => task.id !== id);
}

function omitRecordEntry<TValue>(
  record: Record<string, TValue>,
  key: string,
): Record<string, TValue> {
  const nextRecord = { ...record };

  delete nextRecord[key];

  return nextRecord;
}

function shouldApplyTaskMutation(
  currentListId: string | null,
  mutationListId: string | null,
): mutationListId is string {
  return mutationListId !== null && currentListId === mutationListId;
}

export const useTaskStore = defineStore("tasks", {
  state: () => ({
    createError: null as string | null,
    currentListId: null as string | null,
    deleteErrors: {} as Record<string, string>,
    isCreating: false,
    isDeletingById: {} as Record<string, boolean>,
    isLoading: false,
    isUpdatingById: {} as Record<string, boolean>,
    loadError: null as string | null,
    tasks: [] as Task[],
    updateErrors: {} as Record<string, string>,
  }),
  getters: {
    deleteErrorForTask(state) {
      return (id: string) => state.deleteErrors[id] ?? null;
    },
    hasTasks(state) {
      return state.tasks.length > 0;
    },
    isDeletingTask(state) {
      return (id: string) => state.isDeletingById[id] ?? false;
    },
    isUpdatingTask(state) {
      return (id: string) => state.isUpdatingById[id] ?? false;
    },
    updateErrorForTask(state) {
      return (id: string) => state.updateErrors[id] ?? null;
    },
  },
  actions: {
    clearCreateError() {
      this.createError = null;
    },
    clearDeleteError(taskId?: string) {
      if (!taskId) {
        this.deleteErrors = {};

        return;
      }

      this.deleteErrors = omitRecordEntry(this.deleteErrors, taskId);
    },
    clearLoadError() {
      this.loadError = null;
    },
    clearUpdateError(taskId?: string) {
      if (!taskId) {
        this.updateErrors = {};

        return;
      }

      this.updateErrors = omitRecordEntry(this.updateErrors, taskId);
    },
    resetTasks(listId: string | null = null) {
      this.clearCreateError();
      this.clearDeleteError();
      this.clearLoadError();
      this.clearUpdateError();
      this.currentListId = listId;
      this.isDeletingById = {};
      this.isUpdatingById = {};
      this.tasks = [];
    },
    async loadTasks(listId: string) {
      const requestedListId = listId;

      this.clearLoadError();
      this.currentListId = listId;
      this.isLoading = true;
      this.tasks = [];

      try {
        const response = await $fetch<TaskCollectionResponse>("/api/tasks", {
          query: {
            listId,
          },
        });

        if (this.currentListId !== requestedListId) {
          return this.tasks;
        }

        this.tasks = response.items;

        return response.items;
      } catch (error) {
        if (this.currentListId !== requestedListId) {
          return [];
        }

        this.loadError = extractApiErrorInfo(
          error,
          "The tasks could not be loaded.",
        ).message;

        this.tasks = [];

        return [];
      } finally {
        if (this.currentListId === requestedListId) {
          this.isLoading = false;
        }
      }
    },
    async createTask(input: CreateTaskRequest) {
      const mutationListId = input.listId;

      this.clearCreateError();
      this.isCreating = true;

      try {
        const createdTask = await $fetch<Task>("/api/tasks", {
          body: input,
          method: "POST",
        });

        if (!shouldApplyTaskMutation(this.currentListId, mutationListId)) {
          return null;
        }

        this.tasks = upsertTask(this.tasks, createdTask);

        return createdTask;
      } catch (error) {
        if (!shouldApplyTaskMutation(this.currentListId, mutationListId)) {
          return null;
        }

        this.createError = extractApiErrorInfo(
          error,
          "The task could not be created.",
        ).message;

        return null;
      } finally {
        this.isCreating = false;
      }
    },
    async deleteTask(id: string) {
      const mutationListId = this.currentListId;

      this.clearDeleteError(id);
      this.isDeletingById = {
        ...this.isDeletingById,
        [id]: true,
      };

      try {
        const response = await $fetch<DeleteTaskResponse>(`/api/tasks/${id}`, {
          method: "DELETE",
        });

        if (shouldApplyTaskMutation(this.currentListId, mutationListId)) {
          this.tasks = removeTask(this.tasks, response.id);
        }

        return response;
      } catch (error) {
        const apiError = extractApiErrorInfo(
          error,
          "The task could not be deleted.",
        );

        if (!shouldApplyTaskMutation(this.currentListId, mutationListId)) {
          return null;
        }

        if (apiError.statusCode === 404) {
          this.tasks = removeTask(this.tasks, id);

          return null;
        }

        this.deleteErrors = {
          ...this.deleteErrors,
          [id]: apiError.message,
        };

        return null;
      } finally {
        this.isDeletingById = omitRecordEntry(this.isDeletingById, id);
      }
    },
    async updateTask(id: string, input: UpdateTaskRequest) {
      const mutationListId = this.currentListId;

      this.clearUpdateError(id);
      this.isUpdatingById = {
        ...this.isUpdatingById,
        [id]: true,
      };

      try {
        const updatedTask = await $fetch<Task>(`/api/tasks/${id}`, {
          body: input,
          method: "PATCH",
        });

        if (
          shouldApplyTaskMutation(this.currentListId, mutationListId) &&
          mutationListId === updatedTask.listId
        ) {
          this.tasks = upsertTask(this.tasks, updatedTask);
        }

        return updatedTask;
      } catch (error) {
        const apiError = extractApiErrorInfo(
          error,
          "The task could not be updated.",
        );

        if (!shouldApplyTaskMutation(this.currentListId, mutationListId)) {
          return null;
        }

        if (apiError.statusCode === 404) {
          this.tasks = removeTask(this.tasks, id);

          return null;
        }

        this.updateErrors = {
          ...this.updateErrors,
          [id]: apiError.message,
        };

        return null;
      } finally {
        this.isUpdatingById = omitRecordEntry(this.isUpdatingById, id);
      }
    },
  },
});
