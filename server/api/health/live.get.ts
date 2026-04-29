import { defineEventHandler } from "h3";

import { getLivenessHealth } from "~~/server/lib/utils/health";

export default defineEventHandler(() => getLivenessHealth());
