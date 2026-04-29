import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
      "~": fileURLToPath(new URL("./", import.meta.url)),
      "~~": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    exclude: ["tests/e2e/**"],
    environment: "node",
    include: ["**/*.spec.ts"],
    setupFiles: ["./tests/setup/vitest.setup.ts"],
  },
});
