import { expect, test } from "@playwright/test";

test("loads the baseline application shell", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "aine-bmad-todo" }),
  ).toBeVisible();
  await expect(page.getByTestId("app-shell")).toBeVisible();
});

test("shows loading feedback while the root workspace is restoring saved lists", async ({
  page,
}) => {
  await page.route("**/api/lists", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    await route.fulfill({
      body: JSON.stringify({
        items: [
          {
            createdAt: "2026-04-28T12:00:00.000Z",
            id: "list-1",
            name: "Work",
          },
        ],
        total: 1,
      }),
      contentType: "application/json",
      status: 200,
    });
  });

  await page.goto("/");

  await expect(page.getByTestId("loading-state")).toBeVisible();
  await expect(page.getByTestId("root-loading-state")).toContainText(
    "Loading saved workspaces...",
  );
  await expect(page.getByTestId("list-sidebar-loading-state")).toContainText(
    "Loading saved lists...",
  );
  await expect(page.getByTestId("list-name-input")).toBeEditable();
});

test("shows loading feedback before a saved list workspace is restored", async ({
  page,
}) => {
  await page.route("**/api/lists", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        items: [
          {
            createdAt: "2026-04-28T12:00:00.000Z",
            id: "list-1",
            name: "Work",
          },
        ],
        total: 1,
      }),
      contentType: "application/json",
      status: 200,
    });
  });

  await page.route("**/api/lists/list-1", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    await route.fulfill({
      body: JSON.stringify({
        createdAt: "2026-04-28T12:00:00.000Z",
        id: "list-1",
        name: "Work",
      }),
      contentType: "application/json",
      status: 200,
    });
  });

  await page.route("**/api/tasks?listId=list-1", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    await route.fulfill({
      body: JSON.stringify({
        items: [
          {
            createdAt: "2026-04-28T12:00:00.000Z",
            description: "Review acceptance criteria",
            id: "task-1",
            listId: "list-1",
            title: "Plan sprint",
          },
        ],
        total: 1,
      }),
      contentType: "application/json",
      status: 200,
    });
  });

  await page.goto("/lists/list-1");

  await expect(page.getByTestId("loading-state")).toBeVisible();
  await expect(page.getByTestId("list-workspace-loading-state")).toContainText(
    "Loading saved workspace details...",
  );
  await expect(page.getByTestId("list-workspace-loading-state")).toHaveCount(0);
  await expect(page.getByTestId("task-item")).toHaveCount(1);
});

test("does not show task empty-state guidance when saved tasks fail to load", async ({
  page,
}) => {
  await page.route("**/api/lists", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        items: [
          {
            createdAt: "2026-04-28T12:00:00.000Z",
            id: "list-1",
            name: "Work",
          },
        ],
        total: 1,
      }),
      contentType: "application/json",
      status: 200,
    });
  });

  await page.route("**/api/lists/list-1", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        createdAt: "2026-04-28T12:00:00.000Z",
        id: "list-1",
        name: "Work",
      }),
      contentType: "application/json",
      status: 200,
    });
  });

  await page.route("**/api/tasks?listId=list-1", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        error: {
          code: "PERSISTENCE_ERROR",
          message: "The tasks could not be loaded.",
        },
      }),
      contentType: "application/json",
      status: 500,
    });
  });

  await page.goto("/lists/list-1");

  await expect(page.getByTestId("task-list-error-banner")).toContainText(
    "The tasks could not be loaded.",
  );
  await expect(page.getByTestId("task-list-empty-state")).toHaveCount(0);
});
