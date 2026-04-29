import { afterEach, describe, expect, it } from "vitest";

import { createListApiTestContext } from "~~/tests/fixtures/lists";

type HealthResponse = {
  checks: {
    app: "error" | "ok";
    database?: "error" | "ok";
  };
  environment: string;
  service: string;
  status: "degraded" | "ok";
  timestamp: string;
  uptimeSeconds: number;
};

describe("health API", () => {
  let cleanup: (() => Promise<void>) | null = null;

  afterEach(async () => {
    if (!cleanup) {
      return;
    }

    await cleanup();
    cleanup = null;
  });

  it("returns a liveness response", async () => {
    const context = await createListApiTestContext();
    cleanup = context.cleanup;

    const response = await fetch(`${context.url}/api/health/live`);
    const body = (await response.json()) as HealthResponse;

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      checks: {
        app: "ok",
      },
      service: "aine-bmad-todo",
      status: "ok",
    });
    expect(body.environment).toBeTruthy();
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(body.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });

  it("returns readiness and aggregate health responses", async () => {
    const context = await createListApiTestContext();
    cleanup = context.cleanup;

    const readyResponse = await fetch(`${context.url}/api/health/ready`);
    const readyBody = (await readyResponse.json()) as HealthResponse;
    const aggregateResponse = await fetch(`${context.url}/api/health`);
    const aggregateBody = (await aggregateResponse.json()) as HealthResponse;

    expect(readyResponse.status).toBe(200);
    expect(readyBody).toMatchObject({
      checks: {
        app: "ok",
        database: "ok",
      },
      service: "aine-bmad-todo",
      status: "ok",
    });

    expect(aggregateResponse.status).toBe(200);
    expect(aggregateBody).toMatchObject({
      checks: {
        app: "ok",
        database: "ok",
      },
      service: "aine-bmad-todo",
      status: "ok",
    });
  });
});
