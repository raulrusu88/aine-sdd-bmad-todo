import type {
  CreateTodoListRequest,
  DeleteTodoListResponse,
  TodoList,
  TodoListCollectionResponse,
  UpdateTodoListRequest,
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

function upsertTodoList(lists: TodoList[], nextList: TodoList): TodoList[] {
  const existingIndex = lists.findIndex((list) => list.id === nextList.id);

  if (existingIndex === -1) {
    return [...lists, nextList].sort((left, right) =>
      left.createdAt.localeCompare(right.createdAt),
    );
  }

  const nextLists = [...lists];
  nextLists.splice(existingIndex, 1, nextList);

  return nextLists;
}

function removeTodoList(lists: TodoList[], id: string): TodoList[] {
  return lists.filter((list) => list.id !== id);
}

export const useListStore = defineStore("lists", {
  state: () => ({
    activeListId: null as string | null,
    createError: null as string | null,
    deleteError: null as string | null,
    isCreating: false,
    isDeleting: false,
    isLoading: false,
    isRenaming: false,
    lists: [] as TodoList[],
    loadError: null as string | null,
    renameError: null as string | null,
  }),
  getters: {
    activeList(state) {
      return state.lists.find((list) => list.id === state.activeListId) ?? null;
    },
    getListById(state) {
      return (id: string) => state.lists.find((list) => list.id === id) ?? null;
    },
    hasLists(state) {
      return state.lists.length > 0;
    },
  },
  actions: {
    clearCreateError() {
      this.createError = null;
    },
    clearDeleteError() {
      this.deleteError = null;
    },
    clearLoadError() {
      this.loadError = null;
    },
    clearRenameError() {
      this.renameError = null;
    },
    selectList(id: string | null) {
      this.activeListId = id;
    },
    async createList(input: CreateTodoListRequest | string) {
      const payload = typeof input === "string" ? { name: input } : input;

      this.clearCreateError();
      this.isCreating = true;

      try {
        const createdList = await $fetch<TodoList>("/api/lists", {
          body: payload,
          method: "POST",
        });

        this.lists = upsertTodoList(this.lists, createdList);
        this.activeListId = createdList.id;

        return createdList;
      } catch (error) {
        this.createError = extractApiErrorInfo(
          error,
          "The todo list could not be created.",
        ).message;

        return null;
      } finally {
        this.isCreating = false;
      }
    },
    async loadList(id: string) {
      this.clearLoadError();
      this.activeListId = id;

      try {
        const todoList = await $fetch<TodoList>(`/api/lists/${id}`);

        this.lists = upsertTodoList(this.lists, todoList);
        this.activeListId = todoList.id;

        return todoList;
      } catch (error) {
        const apiError = extractApiErrorInfo(
          error,
          "The requested todo list could not be loaded.",
        );

        if (apiError.statusCode === 404) {
          this.lists = this.lists.filter((list) => list.id !== id);

          if (this.activeListId === id) {
            this.activeListId = null;
          }
        }

        this.loadError = apiError.message;

        return null;
      }
    },
    async loadLists() {
      this.clearLoadError();
      this.isLoading = true;

      try {
        const response = await $fetch<TodoListCollectionResponse>("/api/lists");

        this.lists = response.items;

        if (
          this.activeListId &&
          !response.items.some((list) => list.id === this.activeListId)
        ) {
          this.activeListId = null;
        }

        return response.items;
      } catch (error) {
        this.loadError = extractApiErrorInfo(
          error,
          "The todo lists could not be loaded.",
        ).message;

        return [];
      } finally {
        this.isLoading = false;
      }
    },
    async renameList(id: string, input: UpdateTodoListRequest | string) {
      const payload = typeof input === "string" ? { name: input } : input;

      this.clearRenameError();
      this.isRenaming = true;

      try {
        const renamedList = await $fetch<TodoList>(`/api/lists/${id}`, {
          body: payload,
          method: "PATCH",
        });

        this.lists = upsertTodoList(this.lists, renamedList);

        return renamedList;
      } catch (error) {
        const apiError = extractApiErrorInfo(
          error,
          "The todo list could not be renamed.",
        );

        if (apiError.statusCode === 404) {
          this.lists = removeTodoList(this.lists, id);

          if (this.activeListId === id) {
            this.activeListId = null;
          }
        }

        this.renameError = apiError.message;

        return null;
      } finally {
        this.isRenaming = false;
      }
    },
    async deleteList(id: string) {
      this.clearDeleteError();
      this.isDeleting = true;

      try {
        const response = await $fetch<DeleteTodoListResponse>(
          `/api/lists/${id}`,
          {
            method: "DELETE",
          },
        );

        this.lists = removeTodoList(this.lists, response.id);

        if (this.activeListId === response.id) {
          this.activeListId = null;
        }

        return response;
      } catch (error) {
        const apiError = extractApiErrorInfo(
          error,
          "The todo list could not be deleted.",
        );

        if (apiError.statusCode === 404) {
          this.lists = removeTodoList(this.lists, id);

          if (this.activeListId === id) {
            this.activeListId = null;
          }
        }

        this.deleteError = apiError.message;

        return null;
      } finally {
        this.isDeleting = false;
      }
    },
  },
});
