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

  await page.getByTestId("task-title-input").fill("Buy groceries");
  await page.getByTestId("task-create-button").click();
  await expect(page.getByTestId("success-notice")).toContainText(
    'Created task "Buy groceries".',
  );

  const secondTask = page.getByTestId("task-item").filter({
    hasText: "Buy groceries",
  });

  await expect(secondTask).toHaveCount(1);

  await page.getByRole("link", { name: "Workspace" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByTestId("success-notice")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Open a saved list to continue" }),
  ).toBeVisible();

  await page.getByTestId("list-nav-item").filter({ hasText: "Work" }).click();

  await expect(page.getByRole("heading", { name: /^Work$/ })).toBeVisible();
  await expect(page.getByTestId("tag-filter-bar")).toBeVisible();
  await expect(
    page.getByTestId("tag-filter-chip").filter({ hasText: "urgent" }),
  ).toHaveCount(1);
  await page
    .getByTestId("tag-filter-chip")
    .filter({ hasText: "urgent" })
    .focus();
  await page
    .getByTestId("tag-filter-chip")
    .filter({ hasText: "urgent" })
    .press("Enter");

  await expect(page.getByTestId("tag-filter-status")).toContainText(
    'Showing tasks tagged "urgent".',
  );
  await expect(createdTask).toHaveCount(1);
  await expect(secondTask).toHaveCount(0);
  await expect(page.getByTestId("task-title-input")).toBeDisabled();
  await expect(page.getByTestId("task-create-button")).toBeDisabled();
  await expect(
    page.getByText(/Clear the "urgent" tag filter before adding a new task/),
  ).toBeVisible();

  await page.getByTestId("tag-filter-clear").click();
  await expect(page.getByTestId("tag-filter-status")).toHaveCount(0);
  await expect(createdTask).toHaveCount(1);
  await expect(secondTask).toHaveCount(1);
  await expect(page.getByTestId("task-title-input")).toBeEditable();
  await expect(page.getByTestId("task-create-button")).toBeEnabled();

  let shouldReturnEmptyFilteredList = true;

  await page.route("**/api/tasks*", async (route) => {
    const url = new URL(route.request().url());

    if (
      route.request().method() !== "GET" ||
      url.pathname !== "/api/tasks" ||
      url.searchParams.get("tag") !== "calls" ||
      !shouldReturnEmptyFilteredList
    ) {
      await route.continue();

      return;
    }

    shouldReturnEmptyFilteredList = false;

    await route.fulfill({
      body: JSON.stringify({
        items: [],
        total: 0,
      }),
      contentType: "application/json",
      status: 200,
    });
  });

  await page
    .getByTestId("tag-filter-chip")
    .filter({ hasText: "Calls" })
    .click();

  await expect(page.getByTestId("tag-filter-status")).toContainText(
    'Showing tasks tagged "calls".',
  );
  await expect(page.getByTestId("task-list-filter-empty-state")).toContainText(
    'No tasks match the "calls" tag yet.',
  );

  await page.getByTestId("tag-filter-clear").click();
  await expect(page.getByTestId("tag-filter-status")).toHaveCount(0);
  await expect(createdTask).toHaveCount(1);
  await expect(secondTask).toHaveCount(1);

  await page.unroute("**/api/tasks*");

  let shouldDelayCompletion = true;

  await page.route("**/api/tasks/*/complete", async (route) => {
    if (route.request().method() !== "POST" || !shouldDelayCompletion) {
      await route.continue();

      return;
    }

    shouldDelayCompletion = false;

    await new Promise((resolve) => setTimeout(resolve, 250));
    await route.continue();
  });

  const delayedCompleteResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      /\/api\/tasks\/[^/]+\/complete$/.test(new URL(response.url()).pathname),
  );

  await secondTask.getByTestId("task-complete-toggle").click();
  await page.getByRole("link", { name: "Workspace" }).click();

  await expect(page).toHaveURL("/");

  await delayedCompleteResponse;

  await expect(page.getByTestId("success-notice")).toHaveCount(0);

  await page.unroute("**/api/tasks/*/complete");

  await page.getByTestId("list-nav-item").filter({ hasText: "Work" }).click();

  await expect(page.getByRole("heading", { name: /^Work$/ })).toBeVisible();
  await expect(page.getByTestId("active-task-list")).not.toContainText(
    "Buy groceries",
  );
  await expect(page.getByTestId("completed-task-list")).toContainText(
    "Buy groceries",
  );

  await page.getByTestId("task-title-input").fill("Pay vendor");
  await page.getByTestId("task-create-button").click();
  await expect(page.getByTestId("success-notice")).toContainText(
    'Created task "Pay vendor".',
  );

  const completionCandidate = page.getByTestId("task-item").filter({
    hasText: "Pay vendor",
  });

  let shouldFailCompletion = true;

  await page.route("**/api/tasks/*/complete", async (route) => {
    if (route.request().method() !== "POST" || !shouldFailCompletion) {
      await route.continue();

      return;
    }

    shouldFailCompletion = false;

    await route.fulfill({
      body: JSON.stringify({
        error: {
          code: "PERSISTENCE_ERROR",
          message: "The task could not be completed. Try again.",
        },
      }),
      contentType: "application/json",
      status: 500,
    });
  });

  await completionCandidate.getByTestId("task-complete-toggle").click();

  await expect(
    completionCandidate.getByTestId("task-complete-error-banner"),
  ).toContainText("The task could not be completed. Try again.");
  await expect(page.getByTestId("active-task-list")).toContainText(
    "Pay vendor",
  );
  await completionCandidate.getByTestId("task-delete-toggle").click();
  await expect(
    completionCandidate.getByTestId("task-complete-error-banner"),
  ).toHaveCount(0);
  await expect(
    completionCandidate.getByTestId("task-delete-panel"),
  ).toBeVisible();
  await completionCandidate.getByTestId("task-delete-cancel").click();
  await expect(
    completionCandidate.getByTestId("task-delete-panel"),
  ).toHaveCount(0);

  await completionCandidate.getByTestId("task-complete-toggle").click();

  await expect(page.getByTestId("success-notice")).toContainText(
    'Completed task "Pay vendor".',
  );
  await expect(page.getByTestId("active-task-list")).not.toContainText(
    "Pay vendor",
  );
  await expect(page.getByTestId("completed-task-list")).toContainText(
    "Pay vendor",
  );
  await expect(
    completionCandidate.getByTestId("task-status-badge"),
  ).toContainText("Completed");
  await expect(
    completionCandidate.getByTestId("task-completion-metadata"),
  ).toContainText("Completed");

  await page.unroute("**/api/tasks/*/complete");

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
  await expect(page.getByTestId("active-task-list")).not.toContainText(
    "Finalize sprint plan",
  );
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
