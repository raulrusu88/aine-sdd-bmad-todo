# Story 1.5: Edit and Delete Tasks

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to update or remove tasks in a selected list,
so that my active workspace stays current and trustworthy.

## Acceptance Criteria

1. Given an existing task, when the user edits the title, then the updated title is shown in the interface and persisted, and the task remains associated with the same list.
2. Given an existing task with a description, when the user edits the description, then the updated description is shown in the interface and persisted, and the user can confirm the new details in the task view.
3. Given an existing task, when the user deletes it and confirms the action, then the task is removed from the active view and persistence layer, and developer-accessible operations exist to update and delete tasks through the application API.
4. Given a task update or delete operation fails, when the failure is returned to the client, then the interface keeps the last confirmed task state visible, and the user receives clear guidance to retry or correct the problem.

## Tasks / Subtasks

- [x] Extend shared task contracts and server domain support for update/delete operations (AC: 1, 2, 3, 4)
  - [x] Add shared task API contracts and Zod schemas for task updates and delete success responses without breaking the current create/view task slice.
  - [x] Extend `taskRepository`, `taskService`, and `taskMapper` support for update and delete operations while preserving task/list association and consistent structured error handling.
  - [x] Add `PATCH /api/tasks/[id]` and `DELETE /api/tasks/[id]` handlers under `server/api/tasks/` with validation, not-found handling, and failure-safe responses.
- [x] Add list-scoped task edit/delete state management in Pinia (AC: 1, 2, 3, 4)
  - [x] Extend `app/stores/useTaskStore.ts` with action-led mutations such as `updateTask` and `deleteTask`, while preserving the last confirmed task state on failures.
  - [x] Keep task mutation state scoped to the currently selected list and avoid forcing full workspace resets for per-task mutation failures.
  - [x] Preserve enough draft or retry context after failed edits/deletes so the user can correct input or retry without misleading task changes.
- [x] Add task editing and deletion UI to the current list workspace (AC: 1, 2, 3, 4)
  - [x] Extend the current task components with editing controls for title and description, plus accessible labels, keyboard-safe submission, and visible mutation feedback.
  - [x] Add delete confirmation UX that removes tasks from the active list only after successful persistence.
  - [x] Keep the existing task composer, task list shell, and list workspace controls intact while adding edit/delete affordances.
- [x] Add verification coverage for the task edit/delete feature slice (AC: 1, 2, 3, 4)
  - [x] Add API or integration coverage for valid task title/description updates, delete success, invalid task updates, and missing-task mutation failures.
  - [x] Add browser or component coverage for accessible task editing, confirmation-driven deletion, and recovery after failed update/delete attempts.
  - [x] Reuse deterministic SQLite isolation and keep mutable browser task journeys serialized inside the existing list/task workspace coverage.

## Dev Notes

- Story 1.5 builds directly on the new task slice from Story 1.4. Keep the scope limited to editing and deletion inside the selected list workspace only.
- Do not implement tags, completion, completed-task history, list reassignment, or broader workspace persistence in this story. Those belong to later stories and epics.
- Preserve trustworthy UI semantics: failed edits or deletes must leave the last confirmed task state visible, avoid phantom removals, and preserve enough context for retry.

### Previous Story Learnings

- Story 1.4 already established the `tasks` table, current task REST handlers, task store load/create actions, and the active task workspace UI.
- Keep using the `~~/` alias for project-root imports from app and server files.
- Follow the same thin-handler plus service/repository split used in the current list and task domain layers.
- Playwright currently runs with `fullyParallel: true` against one mutable SQLite E2E database. Extend the existing Chromium mutation journey rather than adding competing mutable task specs.
- `tests/fixtures/lists.ts` already injects a per-test Drizzle client through `event.context.db` / `getEventDb(event)` and enables `PRAGMA foreign_keys = ON`; task mutation tests should keep using that seam.
- `tasks.list_id` now cascades on list deletion. Story 1.5 must preserve that relationship and avoid introducing orphaned or cross-list task mutations.

### Current Repository Baseline

- `app/pages/lists/[id].vue` now renders the live list workspace with task creation and task list display through `useTaskStore`, but there are no task edit or delete controls yet.
- `app/stores/useTaskStore.ts` supports `loadTasks`, `createTask`, `resetTasks`, and error clearing only; no task update/delete actions exist.
- `app/components/tasks/TaskComposer.vue` is add-only, while `TaskList.vue` and `TaskItem.vue` render view-only task content and metadata.
- `shared/types/api.ts` and `shared/schemas/index.ts` define create/view task contracts only; there is no update-task request or delete-response surface yet.
- `server/lib/repositories/taskRepository.ts` and `server/lib/services/taskService.ts` only list, find, and create tasks today; there is no update/delete repository or service support yet.
- `server/api/tasks/` currently exposes `POST /api/tasks`, `GET /api/tasks?listId=<id>`, and `GET /api/tasks/[id]`; no patch or delete handlers exist.
- `db/schema/tasks.ts` currently stores `id`, `list_id`, `title`, `description`, and `created_at` only.
- `tests/fixtures/lists.ts` mounts the current list and task create/view handlers, and `tests/e2e/list-create-view.spec.ts` currently covers task creation/viewing within the existing mutable Chromium journey.

### Technical Requirements

- Extend the existing task slice with task update and delete support inside the selected list workspace; do not create a parallel page or a separate workspace flow.
- Implement REST-style task mutation routes under `server/api/tasks/[id].*`, using `PATCH` for update and `DELETE` for removal to stay consistent with the current list mutation surface.
- Allow editing of task title and optional description while keeping the task bound to the same list; do not introduce list reassignment, tags, completion state, or history in this story.
- Use failure-safe UI semantics: the last confirmed task state remains visible until the server confirms an edit or delete, and failed operations surface actionable, sanitized feedback.
- Preserve direct success payloads and the existing `{ error: { code, message, details? } }` failure structure across the new task mutation routes.
- Keep confirmation before destructive task removal and ensure deleted tasks disappear from the active list only after successful persistence.
- Reuse the current task schema unless a truly minimal schema change is required; do not add speculative columns for later stories.

### Architecture Compliance

- Keep API handlers thin; validate input in route files, call task services, then return structured JSON.
- Keep task domain rules in `server/lib/services/` and persistence access in `server/lib/repositories/`.
- Continue using camelCase at API boundaries and snake_case only in the database layer.
- All Pinia state changes must happen through `useTaskStore` actions; components may hold local draft state but must not mutate store task records directly.
- Keep edit/delete UI inside the current task feature boundary under `app/components/tasks/`, with the existing route shell in `app/pages/lists/[id].vue`.
- Treat accessibility, confirmation UX, inline or panel editing affordances, and recovery messaging as feature correctness rather than optional polish.

### Library / Framework Requirements

- Nuxt routing remains file-based; task mutation handlers should use filenames consistent with the existing list/task route patterns.
- Use Pinia through `@pinia/nuxt` for task mutation state and keep store changes in `app/stores/useTaskStore.ts`.
- Use Zod for request validation at the API boundary and extend the shared schema layer rather than defining route-local task contracts.
- Reuse the existing Drizzle setup, migration flow, and better-sqlite3 persistence bootstrap; do not bypass current DB utilities or fixture setup.
- Keep browser coverage under `tests/e2e/` and Vitest API/integration coverage under `tests/integration/`. Add component-level coverage only if it fits the existing test tooling already in the repo.

### File Structure Requirements

- Existing files expected to be updated in this story:
  - `app/pages/lists/[id].vue`
  - `app/stores/useTaskStore.ts`
  - `app/components/tasks/TaskItem.vue`
  - `app/components/tasks/TaskList.vue`
  - `shared/types/api.ts`
  - `shared/schemas/index.ts`
  - `server/lib/repositories/taskRepository.ts`
  - `server/lib/services/taskService.ts`
  - `tests/fixtures/lists.ts`
  - `tests/integration/api/tasks.spec.ts`
  - `tests/e2e/list-create-view.spec.ts`
- New files likely required in this story:
  - `server/api/tasks/[id].patch.ts`
  - `server/api/tasks/[id].delete.ts`
  - A dedicated task edit UI component under `app/components/tasks/` if adding edit controls would otherwise overcomplicate `TaskItem.vue`

### Testing Requirements

- Relevant QA references for this story include:
  - `TD-API-002` for task CRUD with descriptions
  - `TD-API-005` for rename/delete semantics
  - `TD-COMP-001` for task form or editor accessibility and field feedback
  - `TD-E2E-002` for keyboard and accessibility journey expectations
  - `TD-E2E-003` for save failure and recovery behavior
- Add API or integration coverage for:
  - valid task title edits within a selected list
  - valid task description edits within a selected list
  - delete success with stable list-scoped persistence semantics
  - invalid task update rejection and actionable validation feedback
  - missing-task mutation failures
  - failure paths that keep the last confirmed task state visible to the client
- Add browser coverage for editing and deleting tasks inside a selected list, including retry-safe recovery after failed update/delete attempts.
- Preserve deterministic SQLite isolation, keep the injected per-test database harness, and keep mutable browser mutation coverage serialized where needed.

### Existing Files Being Modified - Preserve and Extend

- `app/pages/lists/[id].vue`
  - Preserve the current list workspace shell, route watching, rename/delete list controls, and task composer integration while adding task edit/delete affordances.
- `app/stores/useTaskStore.ts`
  - Preserve current load/create behavior and selected-list scoping while adding mutation actions that keep confirmed task state stable on failures.
- `app/components/tasks/TaskItem.vue` and `TaskList.vue`
  - Preserve current task rendering and metadata display while layering in editing controls, delete confirmation entry points, and mutation feedback.
- `shared/types/api.ts` and `shared/schemas/index.ts`
  - Extend the task contract surface with update/delete shapes without breaking existing create/view consumers.
- `tests/fixtures/lists.ts`
  - Preserve the current isolated API harness and extend it with task patch/delete routes rather than creating a second server path.

### Latest Technical Information

- Current task records are returned through `mapTaskRecordToTask` plus the shared task service/repository split; Story 1.5 should extend that surface rather than introducing route-specific task shaping.
- The current task schema stores only `createdAt`, `description`, `id`, `listId`, and `title`; there is no updated timestamp or completion/status field yet.
- Task retrieval is explicitly list-scoped via `GET /api/tasks?listId=<id>`, and current store state tracks `currentListId`; task edit/delete behavior should keep that list scoping intact.
- Current task UI is add-only plus read-only render: `TaskComposer.vue` captures new tasks, `TaskList.vue` handles loading/error/empty states, and `TaskItem.vue` renders title, description, and created metadata with no controls.
- Current browser coverage already performs task creation inside the mutable list workspace journey. Extend that path rather than creating a competing mutable task-mutation spec.
- List deletion continues to cascade to tasks at the database level; do not regress that relationship while adding per-task removal.

### Project Structure Notes

- There is still no standalone UX specification. Use the epics file, PRD, architecture, TEA handoff, and current runtime code as the source of truth.
- Story 1.5 should extend the first real task runtime established in Story 1.4 rather than re-planning task foundations.
- `_bmad/` and `_bmad-output/` remain planning support only and are not part of the runtime architecture.

### References

- [Source: _bmad-output/planning-artifacts/epics.md - Story 1.5: Edit and Delete Tasks]
- [Source: _bmad-output/planning-artifacts/architecture.md - Database Naming Conventions]
- [Source: _bmad-output/planning-artifacts/architecture.md - API Naming Conventions]
- [Source: _bmad-output/planning-artifacts/architecture.md - Task Creation and Maintenance Mapping]
- [Source: _bmad-output/planning-artifacts/architecture.md - Project Structure]
- [Source: _bmad-output/planning-artifacts/PRD.md - Task Creation and Maintenance]
- [Source: _bmad-output/test-artifacts/test-design-qa.md - TD-API-002]
- [Source: _bmad-output/test-artifacts/test-design-qa.md - TD-API-005]
- [Source: _bmad-output/test-artifacts/test-design-qa.md - TD-COMP-001]
- [Source: _bmad-output/test-artifacts/test-design-qa.md - TD-E2E-002]
- [Source: _bmad-output/test-artifacts/test-design-qa.md - TD-E2E-003]
- [Source: _bmad-output/test-artifacts/test-design/aine-bmad-todo-handoff.md - Story-Level Integration Guidance]
- [Source: app/pages/lists/[id].vue]
- [Source: app/stores/useTaskStore.ts]
- [Source: app/components/tasks/TaskComposer.vue]
- [Source: app/components/tasks/TaskItem.vue]
- [Source: app/components/tasks/TaskList.vue]
- [Source: shared/types/api.ts]
- [Source: shared/schemas/index.ts]
- [Source: db/schema/tasks.ts]
- [Source: server/lib/mappers/taskMapper.ts]
- [Source: server/lib/repositories/taskRepository.ts]
- [Source: server/lib/services/taskService.ts]
- [Source: server/api/tasks/index.post.ts]
- [Source: server/api/tasks/index.get.ts]
- [Source: server/api/tasks/[id].get.ts]
- [Source: tests/fixtures/lists.ts]
- [Source: tests/integration/api/tasks.spec.ts]
- [Source: tests/e2e/list-create-view.spec.ts]

## Dev Agent Record

### Agent Model Used

GPT-5.4

### Debug Log References

- Story 1.5 was selected from `sprint-status.yaml` as the next backlog item while Story 1.4 remained in `review`.
- Planning context was pulled from the epics file, architecture references, and QA/test handoff artifacts for task edit/delete coverage expectations.
- Runtime baseline was reloaded from the live task schema, task API handlers, task store, task components, current list workspace route, and current task integration/browser coverage before packaging this story.

### Completion Notes List

- Added shared task update/delete contracts, repository/service mutations, and new `PATCH /api/tasks/[id]` plus `DELETE /api/tasks/[id]` handlers with the existing structured error shape.
- Extended `useTaskStore` with scoped per-task update/delete state so failed mutations keep the confirmed task visible and surface retryable inline errors.
- Hardened `useTaskStore` so task mutations ignore late responses after list resets/navigation and remove stale task cards when the backend reports a missing task.
- Updated `TaskItem.vue` and shared task styling to provide inline edit and delete confirmation panels without changing the existing route shell or task composer flow.
- Added integration, focused store, and Chromium browser coverage for successful updates/deletes plus failed update/delete recovery.
- Validation completed with `npm run test:unit`, `npm run test:e2e -- tests/e2e/list-create-view.spec.ts --project=chromium`, and `npm run build`.

### File List

- app/assets/css/main.css
- app/components/tasks/TaskItem.vue
- app/stores/useTaskStore.ts
- shared/schemas/index.ts
- shared/types/api.ts
- server/api/tasks/[id].delete.ts
- server/api/tasks/[id].patch.ts
- server/lib/repositories/taskRepository.ts
- server/lib/services/taskService.ts
- tests/e2e/list-create-view.spec.ts
- tests/fixtures/lists.ts
- tests/integration/api/tasks.spec.ts
- tests/integration/task-store.spec.ts
- \_bmad-output/implementation-artifacts/1-5-edit-and-delete-tasks.md
- \_bmad-output/implementation-artifacts/sprint-status.yaml

## Change Log

- 2026-04-28: Story created and marked `ready-for-dev`.
- 2026-04-28: Task edit/delete support implemented, validated, and moved to `review`.
- 2026-04-28: Review follow-up hardened task mutation race handling and missing-task client recovery.
- 2026-04-28: Focused Epic 1 closeout validation passed with `npm run test:unit`, focused Chromium E2E coverage, and `npm run build`; story marked `done`.
