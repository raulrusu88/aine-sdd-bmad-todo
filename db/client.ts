import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "./schema";

let databaseState: ReturnType<typeof createDatabaseState> | null = null;

function resolveDatabasePath(
  databaseUrl = process.env.DATABASE_URL ?? ".data/aine-bmad-todo.sqlite",
): string {
  return resolve(process.cwd(), databaseUrl.replace(/^file:/, ""));
}

function createDatabaseState(databaseUrl?: string) {
  const databasePath = resolveDatabasePath(databaseUrl);

  mkdirSync(dirname(databasePath), { recursive: true });

  const sqlite = new Database(databasePath);
  sqlite.pragma("foreign_keys = ON");

  return {
    databasePath,
    db: drizzle(sqlite, { schema }),
    sqlite,
  };
}

function getDatabaseState(databaseUrl?: string) {
  const nextDatabasePath = resolveDatabasePath(databaseUrl);

  if (databaseState && databaseState.databasePath !== nextDatabasePath) {
    databaseState.sqlite.close();
    databaseState = null;
  }

  databaseState ??= createDatabaseState(databaseUrl);

  return databaseState;
}

export function getDb(databaseUrl?: string) {
  return getDatabaseState(databaseUrl).db;
}

export function getSqlite(databaseUrl?: string) {
  return getDatabaseState(databaseUrl).sqlite;
}

export function getDatabasePath(databaseUrl?: string) {
  return getDatabaseState(databaseUrl).databasePath;
}

export function resetDatabaseConnection(): void {
  if (!databaseState) {
    return;
  }

  databaseState.sqlite.close();
  databaseState = null;
}

export const db = getDb();
export const sqlite = getSqlite();
export const databasePath = getDatabasePath();

export type DbClient = typeof db;
