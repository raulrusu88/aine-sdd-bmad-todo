import { once } from "node:events";
import { mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import {
  createApp,
  createRouter,
  defineEventHandler,
  toNodeListener,
  useBase,
} from "h3";

import * as schema from "~~/db/schema";
import deleteTodoListHandler from "~~/server/api/lists/[id].delete";
import getTodoListByIdHandler from "~~/server/api/lists/[id].get";
import updateTodoListHandler from "~~/server/api/lists/[id].patch";
import deleteTaskHandler from "~~/server/api/tasks/[id].delete";
import getTodoListsHandler from "~~/server/api/lists/index.get";
import createTodoListHandler from "~~/server/api/lists/index.post";
import getTaskByIdHandler from "~~/server/api/tasks/[id].get";
import updateTaskHandler from "~~/server/api/tasks/[id].patch";
import getTasksHandler from "~~/server/api/tasks/index.get";
import createTaskHandler from "~~/server/api/tasks/index.post";

function createDatabasePath(): string {
  const directory = mkdtempSync(join(tmpdir(), "aine-bmad-todo-"));

  return join(directory, "test.sqlite");
}

function cleanupDatabasePath(databasePath: string): void {
  rmSync(join(databasePath, ".."), { force: true, recursive: true });
}

export function createListTestDatabase() {
  const databasePath = createDatabasePath();
  const sqlite = new Database(databasePath);

  sqlite.pragma("foreign_keys = ON");

  const db = drizzle(sqlite, { schema });
  migrate(db, {
    migrationsFolder: join(process.cwd(), "db", "migrations"),
  });

  return {
    cleanup() {
      sqlite.close();
      cleanupDatabasePath(databasePath);
    },
    databasePath,
    db,
  };
}

async function closeServer(server: ReturnType<typeof createServer>) {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);

        return;
      }

      resolve();
    });
  });
}

export async function createListApiTestContext() {
  const testDatabase = createListTestDatabase();
  const router = createRouter()
    .get("/lists", getTodoListsHandler)
    .post("/lists", createTodoListHandler)
    .get("/lists/:id", getTodoListByIdHandler)
    .patch("/lists/:id", updateTodoListHandler)
    .delete("/lists/:id", deleteTodoListHandler)
    .get("/tasks", getTasksHandler)
    .post("/tasks", createTaskHandler)
    .get("/tasks/:id", getTaskByIdHandler)
    .patch("/tasks/:id", updateTaskHandler)
    .delete("/tasks/:id", deleteTaskHandler);
  const app = createApp();

  app.use(
    defineEventHandler((event) => {
      (event.context as { db?: typeof testDatabase.db }).db = testDatabase.db;
    }),
  );
  app.use(useBase("/api", router.handler));

  const server = createServer(toNodeListener(app));
  server.listen(0, "127.0.0.1");

  await once(server, "listening");

  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("The list API test server could not be started.");
  }

  return {
    async cleanup() {
      await closeServer(server);
      testDatabase.cleanup();
    },
    db: testDatabase.db,
    url: `http://127.0.0.1:${address.port}`,
  };
}
