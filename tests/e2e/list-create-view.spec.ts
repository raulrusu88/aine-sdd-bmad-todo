import { expect, test } from "@playwright/test";

test("creates, renames, deletes, and safely recovers list workspaces", async ({
  browserName,
  page,
}) => {
  test.skip(
    browserName !== "chromium",
    "This mutable list-creation journey runs once against the isolated Chromium database.",
  );

  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Create your first todo list" }),
  ).toBeVisible();
  await expect(page.getByTestId("list-name-input").first()).toBeEditable();

  await page.getByTestId("list-name-input").first().fill("Work");
  await page.getByTestId("list-create-button").first().click();

  await expect(page).toHaveURL(/\/lists\//);
  await expect(page.getByTestId("success-notice")).toContainText(
    'Created list "Work".',
  );
  await expect(page.getByTestId("list-workspace")).toBeVisible();
  await expect(page.getByRole("heading", { name: /^Work$/ })).toBeVisible();
  await expect(
    page.getByTestId("list-nav-item").filter({ hasText: "Work" }),
  ).toHaveCount(1);
  await expect(page.getByTestId("list-name-input").first()).toBeEditable();
  await expect(page.getByTestId("task-list-empty-state")).toBeVisible();

  await page.getByTestId("task-title-input").fill("Plan sprint");
  await page
    .getByTestId("task-description-input")
    .fill("Review acceptance criteria");
  await page.getByTestId("task-create-button").click();
  await expect(page.getByTestId("success-notice")).toContainText(
    'Created task "Plan sprint".',
  );

  await page.reload();
  await expect(page).toHaveURL(/\/lists\//);
  await expect(page.getByRole("heading", { name: /^Work$/ })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Active tasks" }),
  ).toBeVisible();

  const createdTask = page.getByTestId("task-item").first();

  await expect(createdTask).toHaveCount(1);
  await expect(createdTask).toContainText("Plan sprint");
  await expect(createdTask).toContainText("Review acceptance criteria");
  await expect(createdTask.getByTestId("task-metadata")).toContainText(
    "Created",
  );

  await createdTask.getByTestId("task-edit-toggle").click();
  await expect(createdTask.getByTestId("task-edit-form")).toBeVisible();
  await expect(createdTask).toContainText("Plan sprint");

  await createdTask
    .getByTestId("task-edit-title-input")
    .fill("Finalize sprint plan");
  await createdTask
    .getByTestId("task-edit-description-input")
    .fill("Share the revised agenda");
  await createdTask.getByTestId("task-tag-input").fill("urgent");
  await createdTask.getByTestId("task-tag-add-button").click();
  await createdTask.getByTestId("task-tag-input").fill("calls");
  await createdTask.getByTestId("task-tag-input").press("Enter");
  await expect(createdTask.getByTestId("task-tag-draft-list")).toContainText(
    "urgent",
  );
  await expect(createdTask.getByTestId("task-tag-draft-list")).toContainText(
    "calls",
  );
  await createdTask.getByTestId("task-edit-submit").click();

  await expect(page.getByTestId("success-notice")).toContainText(
    'Updated task "Finalize sprint plan".',
  );
  await expect(createdTask.getByTestId("task-edit-form")).toHaveCount(0);
  await expect(createdTask).toContainText("Finalize sprint plan");
  await expect(createdTask).toContainText("Share the revised agenda");
  await expect(createdTask.getByTestId("task-tag-list")).toContainText(
    "urgent",
  );
  await expect(createdTask.getByTestId("task-tag-list")).toContainText("calls");

  await page.getByRole("link", { name: "Workspace" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByTestId("success-notice")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Open a saved list to continue" }),
  ).toBeVisible();

  await page.getByTestId("list-nav-item").filter({ hasText: "Work" }).click();

  await expect(page.getByRole("heading", { name: /^Work$/ })).toBeVisible();

  await createdTask.getByTestId("task-edit-toggle").click();
  await createdTask.getByRole("button", { name: "Remove calls tag" }).click();
  await createdTask.getByTestId("task-tag-input").fill("Calls");
  await createdTask.getByTestId("task-tag-input").press("Enter");
  await createdTask.getByTestId("task-edit-submit").click();

  await expect(page.getByTestId("success-notice")).toContainText(
    'Updated task "Finalize sprint plan".',
  );
  await expect(createdTask.getByTestId("task-tag-list")).toContainText(
    "urgent",
  );
  await expect(createdTask.getByTestId("task-tag-list")).toContainText("Calls");
  await expect(createdTask.getByTestId("task-tag-list")).not.toContainText(
    "calls",
  );

  await createdTask.getByTestId("task-edit-toggle").click();
  await createdTask.getByTestId("task-tag-input").fill("URGENT");
  await createdTask.getByTestId("task-tag-input").press("Enter");
  await expect(createdTask.getByTestId("task-edit-error-banner")).toContainText(
    "Duplicate tags are not allowed.",
  );
  await expect(createdTask.getByTestId("task-tag-draft-list")).toContainText(
    "urgent",
  );
  await expect(createdTask.getByTestId("task-tag-draft-list")).toContainText(
    "Calls",
  );
  await createdTask.getByTestId("task-tag-input").fill("");
  await createdTask
    .getByTestId("task-edit-title-input")
    .evaluate((element) => element.removeAttribute("maxlength"));
  await createdTask.getByTestId("task-edit-title-input").fill("T".repeat(201));
  await createdTask.getByTestId("task-edit-submit").click();

  await expect(createdTask.getByTestId("task-edit-error-banner")).toContainText(
    "Task title must be 200 characters or fewer",
  );
  await expect(createdTask).toContainText("Finalize sprint plan");
  await expect(createdTask).toContainText("Share the revised agenda");
  await expect(createdTask.getByTestId("task-tag-list")).toContainText(
    "urgent",
  );
  await expect(createdTask.getByTestId("task-tag-list")).toContainText("Calls");
  await createdTask.getByTestId("task-edit-cancel").click();

  let shouldFailTagUpdate = true;

  await page.route("**/api/tasks/*", async (route) => {
    if (route.request().method() !== "PATCH" || !shouldFailTagUpdate) {
      await route.continue();

      return;
    }

    shouldFailTagUpdate = false;

    await route.fulfill({
      body: JSON.stringify({
        error: {
          code: "PERSISTENCE_ERROR",
          message: "The task could not be updated.",
        },
      }),
      contentType: "application/json",
      status: 500,
    });
  });

  await createdTask.getByTestId("task-edit-toggle").click();
  await createdTask.getByRole("button", { name: "Remove Calls tag" }).click();
  await expect(
    createdTask.getByTestId("task-tag-draft-list"),
  ).not.toContainText("Calls");
  await createdTask.getByTestId("task-edit-submit").click();

  await expect(createdTask.getByTestId("task-edit-error-banner")).toContainText(
    "The task could not be updated.",
  );
  await expect(createdTask.getByTestId("task-tag-list")).toContainText(
    "urgent",
  );
  await expect(createdTask.getByTestId("task-tag-list")).toContainText("Calls");

  await createdTask.getByTestId("task-edit-submit").click();
  await expect(page.getByTestId("success-notice")).toContainText(
    'Updated task "Finalize sprint plan".',
  );
  await expect(createdTask.getByTestId("task-tag-list")).toContainText(
    "urgent",
  );
  await expect(createdTask.getByTestId("task-tag-list")).not.toContainText(
    "Calls",
  );

  await page.unroute("**/api/tasks/*");

  let shouldFailDelete = true;

  await page.route("**/api/tasks/*", async (route) => {
    if (route.request().method() !== "DELETE" || !shouldFailDelete) {
      await route.continue();

      return;
    }

    shouldFailDelete = false;

    await route.fulfill({
      body: JSON.stringify({
        error: {
          code: "PERSISTENCE_ERROR",
          message: "The task could not be deleted.",
        },
      }),
      contentType: "application/json",
      status: 500,
    });
  });

  await createdTask.getByTestId("task-delete-toggle").click();
  await expect(createdTask.getByTestId("task-delete-panel")).toBeVisible();
  await createdTask.getByTestId("task-delete-confirm").click();

  await expect(
    createdTask.getByTestId("task-delete-error-banner"),
  ).toContainText("The task could not be deleted.");
  await expect(createdTask).toContainText("Finalize sprint plan");

  await createdTask.getByTestId("task-delete-confirm").click();
  await expect(page.getByTestId("success-notice")).toContainText(
    'Deleted task "Finalize sprint plan".',
  );
  await expect(createdTask).toHaveCount(0);
  await expect(page.getByTestId("task-list-empty-state")).toBeVisible();

  await page.getByRole("link", { name: "Workspace" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByTestId("success-notice")).toHaveCount(0);

  await page.getByTestId("list-nav-item").filter({ hasText: "Work" }).click();

  await expect(page.getByRole("heading", { name: /^Work$/ })).toBeVisible();

  await page
    .getByTestId("task-description-input")
    .fill("Keep this draft detail visible");
  await page.getByTestId("task-create-button").click();

  await expect(page.getByTestId("task-error-banner")).toContainText(
    "Task title is required.",
  );
  await expect(page.getByTestId("task-description-input")).toHaveValue(
    "Keep this draft detail visible",
  );

  await page.getByTestId("list-rename-toggle").click();
  await expect(page.getByTestId("list-rename-input")).toBeEditable();
  await page.getByTestId("list-rename-input").fill("Home");
  await page.getByTestId("list-rename-submit").click();

  await expect(page.getByTestId("success-notice")).toContainText(
    'Renamed list to "Home".',
  );
  await expect(page.getByRole("heading", { name: /^Home$/ })).toBeVisible();
  await expect(
    page.getByTestId("list-nav-item").filter({ hasText: "Home" }),
  ).toHaveCount(1);
  await expect(page.getByTestId("task-list-empty-state")).toBeVisible();

  await page.getByRole("link", { name: "Workspace" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByTestId("success-notice")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Open a saved list to continue" }),
  ).toBeVisible();

  await page.getByTestId("list-nav-item").filter({ hasText: "Home" }).click();

  await expect(page.getByRole("heading", { name: /^Home$/ })).toBeVisible();

  await page.getByTestId("list-name-input").first().fill("Errands");
  await page.getByTestId("list-create-button").first().click();

  await expect(page.getByTestId("success-notice")).toContainText(
    'Created list "Errands".',
  );
  await expect(page.getByRole("heading", { name: /^Errands$/ })).toBeVisible();
  await expect(
    page.getByTestId("list-nav-item").filter({ hasText: "Errands" }),
  ).toHaveCount(1);
  await expect(page.getByTestId("task-list-empty-state")).toBeVisible();

  await page.getByTestId("list-nav-item").filter({ hasText: "Home" }).click();

  await expect(page.getByRole("heading", { name: /^Home$/ })).toBeVisible();
  await expect(page.getByTestId("success-notice")).toHaveCount(0);

  let shouldDelayTaskCreate = true;

  await page.route("**/api/tasks", async (route) => {
    if (route.request().method() !== "POST" || !shouldDelayTaskCreate) {
      await route.continue();

      return;
    }

    shouldDelayTaskCreate = false;

    await new Promise((resolve) => setTimeout(resolve, 250));
    await route.continue();
  });

  const delayedCreateResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      response.url().includes("/api/tasks"),
  );

  await page
    .getByTestId("task-title-input")
    .fill("Follow up with stakeholders");
  await page.getByTestId("task-create-button").click();
  await page
    .getByTestId("list-nav-item")
    .filter({ hasText: "Errands" })
    .click();

  await expect(page.getByRole("heading", { name: /^Errands$/ })).toBeVisible();

  await delayedCreateResponse;

  await expect(page.getByTestId("success-notice")).toHaveCount(0);
  await expect(page.getByTestId("task-item")).toHaveCount(0);

  await page.unroute("**/api/tasks");

  await page.getByTestId("list-delete-toggle").click();
  await expect(page.getByTestId("list-delete-panel")).toBeVisible();
  await page.getByTestId("list-delete-cancel").click();
  await expect(page.getByTestId("list-delete-panel")).toHaveCount(0);

  await page.getByTestId("list-delete-toggle").click();
  await page.getByTestId("list-delete-confirm").click();

  await expect(page).toHaveURL("/");
  await expect(page.getByTestId("success-notice")).toContainText(
    'Deleted list "Errands".',
  );
  await expect(
    page.getByTestId("list-nav-item").filter({ hasText: "Home" }),
  ).toHaveCount(1);
  await expect(
    page.getByTestId("list-nav-item").filter({ hasText: "Errands" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Open a saved list to continue" }),
  ).toBeVisible();

  await page.getByTestId("list-name-input").first().fill("home");
  await page.getByTestId("list-create-button").first().click();

  await expect(page.getByTestId("error-banner").first()).toContainText(
    "A todo list with that name already exists.",
  );

  await page.goto("/lists/does-not-exist");

  await expect(page.getByTestId("error-banner").first()).toContainText(
    "Todo list not found.",
  );
  await expect(
    page.getByTestId("list-nav-item").filter({ hasText: "Home" }),
  ).toHaveCount(1);
  await expect(
    page.locator('[data-testid="list-nav-item"].list-nav__link--active'),
  ).toHaveCount(0);

  await page.goto("/");
  await page
    .getByTestId("list-name-input")
    .first()
    .evaluate((element) => element.removeAttribute("maxlength"));
  await page.getByTestId("list-name-input").first().fill("W".repeat(81));
  await page.getByTestId("list-create-button").first().click();

  await expect(page.getByTestId("error-banner").first()).toContainText(
    "List name must be 80 characters or fewer",
  );
});
