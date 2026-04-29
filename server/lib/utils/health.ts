import { sql } from "drizzle-orm";

import type { DbClient } from "~~/db/client";
import { getDb } from "~~/db/client";

import { logger } from "./logger";

type CheckStatus = "error" | "ok";
type HealthStatus = "degraded" | "ok";

type HealthResponse = {
  checks: {
    app: CheckStatus;
    database?: CheckStatus;
  };
  environment: string;
  service: "aine-bmad-todo";
  status: HealthStatus;
  timestamp: string;
  uptimeSeconds: number;
};

function getEnvironment(): string {
  return process.env.APP_ENV ?? process.env.NODE_ENV ?? "development";
}

function createBaseHealthResponse(): Omit<HealthResponse, "checks" | "status"> {
  return {
    environment: getEnvironment(),
    service: "aine-bmad-todo",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
  };
}

export function getLivenessHealth(): HealthResponse {
  return {
    ...createBaseHealthResponse(),
    checks: {
      app: "ok",
    },
    status: "ok",
  };
}

export async function getReadinessHealth(
  dbClient?: DbClient,
): Promise<HealthResponse> {
  const db = dbClient ?? getDb();

  try {
    await db.get(sql`select 1 as result`);

    return {
      ...createBaseHealthResponse(),
      checks: {
        app: "ok",
        database: "ok",
      },
      status: "ok",
    };
  } catch (error) {
    logger.error("Database readiness check failed.", {
      error:
        error instanceof Error
          ? {
              message: error.message,
              name: error.name,
            }
          : {
              value: error,
            },
    });

    return {
      ...createBaseHealthResponse(),
      checks: {
        app: "ok",
        database: "error",
      },
      status: "degraded",
    };
  }
}
