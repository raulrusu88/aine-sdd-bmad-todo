const host = process.env.HEALTHCHECK_HOST ?? "127.0.0.1";
const port = process.env.PORT ?? process.env.NITRO_PORT ?? "3000";
const path = process.env.HEALTHCHECK_PATH ?? "/api/health/ready";
const target = `http://${host}:${port}${path}`;

try {
  const response = await fetch(target, {
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    console.error(
      `Health check failed with status ${response.status} for ${target}`,
    );
    process.exit(1);
  }

  const payload = await response.json().catch(() => null);

  if (payload && typeof payload === "object" && "status" in payload) {
    if (payload.status !== "ok") {
      console.error(`Health check returned a non-ok status for ${target}`);
      process.exit(1);
    }
  }
} catch (error) {
  console.error(`Health check request failed for ${target}`, error);
  process.exit(1);
}
