import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

export default defineConfig({
  fullyParallel: true,
  reporter: [["html", { open: "never" }]],
  testDir: "./tests/e2e",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command:
      "rm -f .data/aine-bmad-todo.e2e.sqlite && DATABASE_URL=.data/aine-bmad-todo.e2e.sqlite npm run db:migrate && DATABASE_URL=.data/aine-bmad-todo.e2e.sqlite npm run dev -- --host 127.0.0.1 --port 3000",
    reuseExistingServer: false,
    timeout: 120_000,
    url: baseURL,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
});
