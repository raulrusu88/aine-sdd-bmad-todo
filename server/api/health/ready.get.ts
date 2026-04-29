import { defineEventHandler, setResponseStatus } from "h3";

import { getEventDb } from "~~/server/lib/utils/database";
import { getReadinessHealth } from "~~/server/lib/utils/health";

export default defineEventHandler(async (event) => {
  const health = await getReadinessHealth(getEventDb(event));

  if (health.status !== "ok") {
    setResponseStatus(event, 503);
  }

  return health;
});
