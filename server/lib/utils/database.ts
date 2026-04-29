import type { H3Event } from "h3";

import type { DbClient } from "~~/db/client";

export function getEventDb(event: H3Event): DbClient | undefined {
  return (event.context as { db?: DbClient }).db;
}
