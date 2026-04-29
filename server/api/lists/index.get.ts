import { defineEventHandler } from "h3";

import { getTodoLists } from "~~/server/lib/services/listService";
import { getEventDb } from "~~/server/lib/utils/database";
import { sendApiError } from "~~/server/lib/utils/http";

export default defineEventHandler(async (event) => {
  try {
    const items = await getTodoLists(getEventDb(event));

    return {
      items,
      total: items.length,
    };
  } catch (error) {
    return sendApiError(event, error, "The todo lists could not be loaded.");
  }
});
