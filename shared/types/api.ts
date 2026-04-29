export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "PERSISTENCE_ERROR"
  | "INTERNAL_ERROR";

export interface ApiError {
  code: ApiErrorCode;
  details?: Record<string, unknown>;
  message: string;
}

export interface ApiErrorResponse {
  error: ApiError;
}

export interface CollectionResponse<T> {
  items: T[];
  total: number;
}

export interface TodoList {
  createdAt: string;
  id: string;
  name: string;
}

export interface CreateTodoListRequest {
  name: string;
}

export interface UpdateTodoListRequest {
  name: string;
}

export interface DeleteTodoListResponse {
  id: string;
}

export type TaskTag = string;

export interface Task {
  createdAt: string;
  description: string | null;
  id: string;
  listId: string;
  tags: TaskTag[];
  title: string;
}

export interface CreateTaskRequest {
  description?: string;
  listId: string;
  title: string;
}

export interface UpdateTaskRequest {
  description?: string;
  tags?: TaskTag[];
  title: string;
}

export interface DeleteTaskResponse {
  id: string;
}

export type TodoListCollectionResponse = CollectionResponse<TodoList>;
export type TaskCollectionResponse = CollectionResponse<Task>;
