import "dotenv/config";

import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL ?? ".data/aine-bmad-todo.sqlite";

export default defineConfig({
  dbCredentials: {
    url: databaseUrl,
  },
  dialect: "sqlite",
  out: "./db/migrations",
  schema: "./db/schema/index.ts",
  strict: true,
});
