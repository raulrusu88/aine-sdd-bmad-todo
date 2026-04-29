import { defineStore } from "pinia";

import {
  collectAvailableTaskTags,
  filterTasksByTag,
  normalizeTaskFilterTag,
} from "~~/app/composables/useTaskFilters";

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
    activeTagFilter: null as string | null,
    allTasks: [] as Task[],
    completeErrors: {} as Record<string, string>,
    createError: null as string | null,
    currentListId: null as string | null,
    deleteErrors: {} as Record<string, string>,
    isCompletingById: {} as Record<string, boolean>,
    isCreating: false,
    isDeletingById: {} as Record<string, boolean>,
    isLoading: false,
    isUpdatingById: {} as Record<string, boolean>,
    loadError: null as string | null,
    loadRequestId: 0,
    tasks: [] as Task[],
    updateErrors: {} as Record<string, string>,
  }),
  getters: {
    activeTasks(state) {
      return state.tasks.filter((task) => !task.isCompleted);
    },
    availableTaskTags(state) {
      return collectAvailableTaskTags(state.allTasks);
    },
    completeErrorForTask(state) {
      return (id: string) => state.completeErrors[id] ?? null;
    },
    completedTasks(state) {
      return state.tasks.filter((task) => task.isCompleted);
    },
    deleteErrorForTask(state) {
      return (id: string) => state.deleteErrors[id] ?? null;
    },
    hasTasks(state) {
      return state.tasks.length > 0;
    },
    hasActiveTagFilter(state) {
      return state.activeTagFilter !== null;
    },
    isDeletingTask(state) {
      return (id: string) => state.isDeletingById[id] ?? false;
    },
    isCompletingTask(state) {
      return (id: string) => state.isCompletingById[id] ?? false;
    },
    isUpdatingTask(state) {
      return (id: string) => state.isUpdatingById[id] ?? false;
    },
    updateErrorForTask(state) {
      return (id: string) => state.updateErrors[id] ?? null;
    },
  },
  actions: {
    clearCompleteError(taskId?: string) {
      if (!taskId) {
        this.completeErrors = {};

        return;
      }

      this.completeErrors = omitRecordEntry(this.completeErrors, taskId);
    },
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
    clearTagFilter() {
      this.loadRequestId += 1;
      this.clearLoadError();
      this.activeTagFilter = null;
      this.isLoading = false;
      this.tasks = [...this.allTasks];
    },
    clearUpdateError(taskId?: string) {
      if (!taskId) {
        this.updateErrors = {};

        return;
      }

      this.updateErrors = omitRecordEntry(this.updateErrors, taskId);
    },
    resetTasks(listId: string | null = null) {
      this.loadRequestId += 1;
      this.clearCompleteError();
      this.clearCreateError();
      this.clearDeleteError();
      this.clearLoadError();
      this.clearUpdateError();
      this.activeTagFilter = null;
      this.allTasks = [];
      this.completeErrors = {};
      this.currentListId = listId;
      this.isCompletingById = {};
      this.isDeletingById = {};
      this.isLoading = false;
      this.isUpdatingById = {};
      this.tasks = [];
    },
    async loadTasks(listId: string) {
      const requestId = ++this.loadRequestId;
      const requestedListId = listId;

      this.clearLoadError();
      this.activeTagFilter = null;
      this.allTasks = [];
      this.currentListId = listId;
      this.isLoading = true;
      this.tasks = [];

      try {
        const response = await $fetch<TaskCollectionResponse>("/api/tasks", {
          cache: "no-store",
          query: {
            listId,
          },
        });

        if (
          this.currentListId !== requestedListId ||
          this.loadRequestId !== requestId
        ) {
          return this.tasks;
        }

        this.allTasks = response.items;
        this.tasks = response.items;

        return response.items;
      } catch (error) {
        if (
          this.currentListId !== requestedListId ||
          this.loadRequestId !== requestId
        ) {
          return [];
        }

        this.loadError = extractApiErrorInfo(
          error,
          "The tasks could not be loaded.",
        ).message;

        this.allTasks = [];
        this.tasks = [];

        return [];
      } finally {
        if (
          this.currentListId === requestedListId &&
          this.loadRequestId === requestId
        ) {
          this.isLoading = false;
        }
      }
    },
    async applyTagFilter(tag: string) {
      const requestedListId = this.currentListId;

      if (!requestedListId) {
        return [];
      }

      const nextFilter = normalizeTaskFilterTag(tag);

      if (!nextFilter) {
        this.clearTagFilter();

        return this.tasks;
      }

      if (
        this.activeTagFilter &&
        normalizeTaskFilterTag(this.activeTagFilter) === nextFilter &&
        !this.loadError
      ) {
        return this.tasks;
      }

      const requestId = ++this.loadRequestId;

      this.clearLoadError();
      this.isLoading = true;

      try {
        const response = await $fetch<TaskCollectionResponse>("/api/tasks", {
          cache: "no-store",
          query: {
            listId: requestedListId,
            tag: nextFilter,
          },
        });

        if (
          !shouldApplyTaskMutation(this.currentListId, requestedListId) ||
          this.loadRequestId !== requestId
        ) {
          return this.tasks;
        }

        this.activeTagFilter = nextFilter;
        this.tasks = response.items;

        return response.items;
      } catch (error) {
        if (
          !shouldApplyTaskMutation(this.currentListId, requestedListId) ||
          this.loadRequestId !== requestId
        ) {
          return this.tasks;
        }

        this.loadError = extractApiErrorInfo(
          error,
          "The tasks could not be filtered. Clear the filter or try a different tag.",
        ).message;

        return this.tasks;
      } finally {
        if (
          shouldApplyTaskMutation(this.currentListId, requestedListId) &&
          this.loadRequestId === requestId
        ) {
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

        this.allTasks = upsertTask(this.allTasks, createdTask);
        this.tasks = filterTasksByTag(this.allTasks, this.activeTagFilter);

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

      this.clearCompleteError(id);
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
          this.allTasks = removeTask(this.allTasks, response.id);
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
          this.allTasks = removeTask(this.allTasks, id);
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
    async completeTask(id: string) {
      const mutationListId = this.currentListId;

      this.clearCompleteError(id);
      this.isCompletingById = {
        ...this.isCompletingById,
        [id]: true,
      };

      try {
        const completedTask = await $fetch<Task>(`/api/tasks/${id}/complete`, {
          method: "POST",
        });

        if (
          shouldApplyTaskMutation(this.currentListId, mutationListId) &&
          mutationListId === completedTask.listId
        ) {
          this.allTasks = upsertTask(this.allTasks, completedTask);
          this.tasks = filterTasksByTag(this.allTasks, this.activeTagFilter);
        }

        return completedTask;
      } catch (error) {
        const apiError = extractApiErrorInfo(
          error,
          "The task could not be completed. Try again.",
        );

        if (!shouldApplyTaskMutation(this.currentListId, mutationListId)) {
          return null;
        }

        if (apiError.statusCode === 404) {
          this.allTasks = removeTask(this.allTasks, id);
          this.tasks = removeTask(this.tasks, id);

          return null;
        }

        this.completeErrors = {
          ...this.completeErrors,
          [id]: apiError.message,
        };

        return null;
      } finally {
        this.isCompletingById = omitRecordEntry(this.isCompletingById, id);
      }
    },
    async updateTask(id: string, input: UpdateTaskRequest) {
      const mutationListId = this.currentListId;

      this.clearCompleteError(id);
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
          this.allTasks = upsertTask(this.allTasks, updatedTask);
          this.tasks = filterTasksByTag(this.allTasks, this.activeTagFilter);
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
          this.allTasks = removeTask(this.allTasks, id);
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
