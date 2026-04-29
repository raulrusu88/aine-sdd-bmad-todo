# Story 1.4: Create and View Tasks Within a List

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to create tasks with a short title, an optional description, and visible metadata inside a selected list,
so that I can capture work with enough context to act on it later.

## Acceptance Criteria

1. Given a todo list is selected, when the user creates a task with a valid short title, then the task is saved inside that list and displayed in the active task view, and the user can immediately recognize the task in the list.
2. Given the user provides an optional description, when the task is saved, then the description is stored and can be viewed as part of the task details, and the description remains associated with the correct task.
3. Given the user submits invalid task data or the create request fails, when the application attempts to save the task, then no misleading new task is shown as persisted, and the interface preserves enough context for the user to correct the input or retry the action.
4. Given a task has been created, when the task is shown in the interface, then the user can see its basic metadata, including creation time, and developer-accessible operations exist to create, retrieve, and list tasks for a selected list through the application API.

## Tasks / Subtasks

- [x] Add the first task domain contracts, schema, and migration support (AC: 1, 2, 4)
  - [x] Extend the shared API contracts and Zod schemas for task create, task read, and task collection responses without breaking the existing list error envelope.
  - [x] Add the first `tasks` persistence model under `db/schema/` with snake_case columns, a `list_id` foreign key, and an index that supports list-scoped task queries.
  - [x] Commit the matching Drizzle migration and keep the migration flow aligned with the existing `db:migrate` and test-fixture setup.
- [x] Implement the first task API handlers and server domain layer (AC: 1, 2, 3, 4)
  - [x] Add `POST /api/tasks`, `GET /api/tasks?listId=<id>`, and `GET /api/tasks/[id]` handlers under `server/api/tasks/`.
  - [x] Add `taskRepository`, `taskService`, and `taskMapper` modules so task handlers stay thin and consistent with the list domain structure.
  - [x] Validate task input at the API boundary, keep structured validation/not-found/persistence failures, and prevent invalid or failed creates from being represented as saved tasks.
- [x] Add list-scoped task state management in Pinia (AC: 1, 2, 3, 4)
  - [x] Create `app/stores/useTaskStore.ts` with action-led state transitions such as `loadTasks`, `createTask`, and a clear way to reset or reload tasks when the active list changes.
  - [x] Keep task state scoped to the selected list and avoid leaking tasks across route transitions between `/lists/[id]` workspaces.
  - [x] Preserve enough draft or error context after failed creates so the user can correct input or retry without unnecessary re-entry.
- [x] Replace the task placeholder in the active-list page with the first usable task UI (AC: 1, 2, 3, 4)
  - [x] Add the task creation surface under `app/components/tasks/` using a short title, optional description, and clear submit/error states.
  - [x] Add the active task list display with visible metadata, including creation time, and a clear empty state when no tasks exist for the selected list.
  - [x] Keep the existing list workspace shell, rename/delete controls, and sidebar behavior intact while the task area becomes real.
- [x] Add verification coverage for the first task feature slice (AC: 1, 2, 3, 4)
  - [x] Add API or integration coverage for valid task creation, optional description persistence, invalid task input, list-scoped retrieval, and task fetch by id.
  - [x] Add browser coverage for creating and viewing tasks inside a selected list, including recovery after a failed save attempt.
  - [x] Reuse deterministic SQLite isolation through injected per-test databases and keep mutable browser task journeys serialized to avoid E2E database contention.

## Dev Notes

- Story 1.4 is the first task-domain slice. Keep the scope tight: create and view tasks within the selected list only.
- Do not implement task editing, deletion, tags, filtering, completion, or completed-task history in this story. Those belong to Stories 1.5 and Epics 2-3.
- Preserve the existing list-management shell and extend it with task functionality rather than introducing a separate workspace flow.

### Previous Story Learnings

- Story 1.2 established the baseline persisted list slice, the shared error envelope, and the injected-db testing seam through `event.context.db` and `getEventDb(event)`.
- Story 1.3 extended the list workspace shell with rename/delete controls and safe fallback behavior when the active list becomes unavailable.
- Use the `~~/` alias for project-root imports from app and server files.
- SSR-rendered controls may appear before hydration; for client-side submit handlers, keep interactive task controls hydration-safe the same way the list form is gated today.
- Playwright currently runs with `fullyParallel: true` against one mutable SQLite E2E database. Keep mutating task journeys in a single spec or otherwise serialize them to avoid cross-test contention.
- `tests/fixtures/lists.ts` already enables `PRAGMA foreign_keys = ON`; the task schema and tests should respect that database behavior rather than bypassing it.

### Current Repository Baseline

- `app/pages/lists/[id].vue` now renders the active list workspace shell with list create/sidebar support plus rename/delete controls, but the task body is still a Story 1.4 placeholder.
- `app/stores/useListStore.ts` manages list state only; there is no `useTaskStore.ts` yet.
- `app/components/tasks/` exists only as `.gitkeep`; there are no task UI components yet.
- `server/api/tasks/` exists only as `.gitkeep`; there are no task handlers yet.
- There is no `server/lib/services/taskService.ts`, `server/lib/repositories/taskRepository.ts`, or `server/lib/mappers/taskMapper.ts` in the repo yet.
- `shared/types/api.ts` and `shared/schemas/index.ts` currently define list-oriented contracts only; there are no task request/response shapes yet.
- `db/schema/index.ts` currently exports only `todoLists`; there is no `tasks` schema yet.
- `tests/fixtures/lists.ts` already provides the reusable per-test SQLite + H3 API setup and should be extended rather than replaced.
- Current browser coverage in `tests/e2e/list-create-view.spec.ts` exercises the list workspace shell and safe fallback flows but does not yet touch tasks.

### Technical Requirements

- Use the approved Nuxt full-stack architecture and extend the current list workspace route rather than creating a parallel task page.
- Add the first task persistence model in SQLite through Drizzle using the `tasks` table with snake_case columns and a durable foreign key back to `todo_lists`.
- Keep the initial task model aligned with the accepted requirements for this story: list association, short title, optional description, and visible creation metadata.
- Implement the first task API as REST-style Nuxt server routes under `server/api/tasks/`:
  - `POST /api/tasks`
  - `GET /api/tasks?listId=<id>`
  - `GET /api/tasks/[id]`
- Validate task input at the API boundary with Zod before persistence logic runs.
- Return direct success payloads and preserve the existing `{ error: { code, message, details? } }` structure on failures.
- Prevent failed create requests from rendering phantom persisted tasks in the UI.
- Because tasks introduce a foreign-key relationship with lists, confirm the chosen schema behavior does not silently orphan tasks when a list is deleted later.

### Architecture Compliance

- Keep API handlers thin; route files validate input, call services, then return structured JSON.
- Keep domain rules in `server/lib/services/` and persistence access in `server/lib/repositories/`.
- Continue using camelCase at API boundaries and snake_case only in the database layer.
- All Pinia state changes must happen through store actions; components may read store state and dispatch actions but must not mutate it directly.
- Follow the architecture naming patterns with task-focused actions such as `loadTasks` and `createTask`.
- Keep task creation and viewing under the task feature boundary in `app/components/tasks/`, with the route shell in `app/pages/lists/[id].vue`.
- Treat accessibility, empty states, loading states, and recovery messaging as part of feature correctness rather than optional polish.

### Library / Framework Requirements

- Nuxt routing remains file-based; use route filenames consistent with the architecture examples for task operations.
- Use Pinia through `@pinia/nuxt` for task state and keep the store under `app/stores/useTaskStore.ts`.
- Use Zod for request validation at the API boundary and keep the shared schemas importable from the shared schema layer.
- Reuse the existing Drizzle setup, migration flow, and database client; do not bypass the established persistence bootstrap.
- Keep Playwright browser tests under `tests/e2e/` and Vitest API/integration coverage under `tests/integration/`.

### File Structure Requirements

- Existing files expected to be updated in this story:
  - `app/pages/lists/[id].vue`
  - `shared/types/api.ts`
  - `shared/schemas/index.ts`
  - `db/schema/index.ts`
  - `tests/fixtures/lists.ts`
- New files likely required in this story:
  - `db/schema/tasks.ts`
  - `server/api/tasks/index.get.ts`
  - `server/api/tasks/index.post.ts`
  - `server/api/tasks/[id].get.ts`
  - `server/lib/repositories/taskRepository.ts`
  - `server/lib/services/taskService.ts`
  - `server/lib/mappers/taskMapper.ts`
  - `app/stores/useTaskStore.ts`
  - `app/components/tasks/TaskComposer.vue`
  - `app/components/tasks/TaskList.vue`
  - `app/components/tasks/TaskItem.vue`
  - `app/components/tasks/TaskMetadataBadge.vue`
  - `tests/integration/api/tasks.spec.ts`
  - `tests/e2e/task-create-view.spec.ts`
- A new task fixture helper may be added if it meaningfully extends the existing list fixture pattern, but prefer reusing the current isolated SQLite setup rather than inventing a second testing approach.

### Testing Requirements

- Relevant QA references for this story include:
  - `TD-API-002` for task CRUD with descriptions
  - `TD-E2E-001` for the core list-to-task user journey
  - `TD-E2E-003` for create-failure recovery behavior
  - `TD-COMP-001` and `TD-E2E-002` for task-form accessibility and keyboard-safe flows
- Add API/integration coverage for:
  - valid task creation within a selected list
  - optional description persistence
  - invalid task title or malformed payload rejection
  - list-scoped task retrieval
  - task fetch by id
  - create failure or missing-list handling that does not misrepresent persisted state
- Add browser coverage for creating tasks inside a selected list, seeing the created task immediately, viewing task metadata, and recovering from a failed save attempt.
- Preserve deterministic SQLite isolation, keep migrations part of test setup, and keep browser mutation coverage serialized where needed.

### Existing Files Being Modified - Preserve and Extend

- `app/pages/lists/[id].vue`
  - Preserve the current list workspace shell, route watching, sidebar behavior, and rename/delete list controls while replacing the placeholder task body with real task creation and viewing UI.
- `app/stores/useListStore.ts`
  - Reuse its active-list and fallback behavior as the context boundary for task loading, but keep task state in a dedicated task store.
- `shared/types/api.ts`
  - Extend the shared API contracts for tasks without breaking the existing list or error types.
- `shared/schemas/index.ts`
  - Extend the shared validation surface with task schemas using the same server-boundary discipline as the list layer.
- `tests/fixtures/lists.ts`
  - Preserve the current injected-db and isolated API harness patterns; extend them for task routes instead of creating a separate global-database test path.

### Latest Technical Information

- The architecture maps task creation and maintenance directly to `app/components/tasks/`, `app/pages/lists/[id].vue`, `server/api/tasks/`, `server/lib/services/taskService.ts`, `server/lib/repositories/taskRepository.ts`, and `db/schema/tasks.ts`.
- Architecture naming examples already expect a task store and components such as `useTaskStore.ts`, `TaskComposer.vue`, `TaskList.vue`, `TaskItem.vue`, and `TaskMetadataBadge.vue`.
- The current active-list page still contains the explicit placeholder text that Story 1.4 will replace with task creation and viewing behavior.
- The current test fixture already enables SQLite foreign keys and runs migrations per isolated database, which should be reused by the first task API tests.
- Once tasks exist, the current list-delete behavior from Story 1.3 must not silently leave the database in an inconsistent state; treat that as a cross-story constraint while introducing the task foreign key.

### Project Structure Notes

- There is still no standalone UX specification. Use the epics file, PRD, architecture, TEA handoff, and current runtime code as the source of truth.
- Task runtime folders exist only as placeholders today, so Story 1.4 will establish the first real task UI, server, and persistence files in the repo.
- `_bmad/` and `_bmad-output/` remain planning support only and are not part of the runtime architecture.

### References

- [Source: _bmad-output/planning-artifacts/epics.md - Story 1.4: Create and View Tasks Within a List]
- [Source: _bmad-output/planning-artifacts/architecture.md - Database Naming Conventions]
- [Source: _bmad-output/planning-artifacts/architecture.md - API Naming Conventions]
- [Source: _bmad-output/planning-artifacts/architecture.md - Task Creation and Maintenance Mapping]
- [Source: _bmad-output/planning-artifacts/architecture.md - Project Structure]
- [Source: _bmad-output/planning-artifacts/PRD.md - Task Creation and Maintenance]
- [Source: _bmad-output/test-artifacts/test-design-qa.md - TD-API-002]
- [Source: _bmad-output/test-artifacts/test-design-qa.md - TD-E2E-001]
- [Source: _bmad-output/test-artifacts/test-design-qa.md - TD-E2E-003]
- [Source: _bmad-output/test-artifacts/test-design/aine-bmad-todo-handoff.md - Story-Level Integration Guidance]
- [Source: app/pages/lists/[id].vue]
- [Source: app/stores/useListStore.ts]
- [Source: shared/types/api.ts]
- [Source: shared/schemas/index.ts]
- [Source: db/schema/index.ts]
- [Source: tests/fixtures/lists.ts]
- [Source: tests/e2e/list-create-view.spec.ts]

## Dev Agent Record

### Agent Model Used

GPT-5.4

### Debug Log References

- Story auto-selected from `sprint-status.yaml` as the next backlog item while Story 1.3 remained in `review`.
- Planning context loaded from `epics.md`, `architecture.md`, `PRD.md`, and the TEA test-design handoff artifacts.
- Runtime baseline verified against the current post-Story-1.3 list workspace shell, shared contract layer, schema barrel, and test fixtures.
- Validation commands completed successfully: `npm run db:generate`, `npm run test:unit`, `npm run test:e2e -- tests/e2e/list-create-view.spec.ts --project=chromium`, and `npm run build`.

### Completion Notes List

- Added the first task domain contracts, validation, Drizzle schema, and generated migration for list-scoped task persistence.
- Implemented `POST /api/tasks`, `GET /api/tasks?listId=<id>`, and `GET /api/tasks/[id]` with thin Nuxt handlers backed by task service, mapper, and repository modules.
- Added `useTaskStore`, task UI components, and active-list page integration so tasks can be created, viewed with metadata, and retried safely after invalid input.
- Chose a cascading foreign key from `tasks.list_id` to `todo_lists.id` so Story 1.3 list deletes remain consistent once tasks exist.
- Extended the isolated API fixture, added task integration coverage, and folded browser task coverage into the existing mutable Chromium workspace journey to avoid E2E database contention.
- Validation passed with `npm run db:generate`, `npm run test:unit`, focused Chromium Playwright coverage, and `npm run build`; story status is now `review`.

### File List

- \_bmad-output/implementation-artifacts/1-4-create-and-view-tasks-within-a-list.md
- \_bmad-output/implementation-artifacts/sprint-status.yaml
- app/assets/css/main.css
- app/components/tasks/TaskComposer.vue
- app/components/tasks/TaskItem.vue
- app/components/tasks/TaskList.vue
- app/components/tasks/TaskMetadataBadge.vue
- app/pages/lists/[id].vue
- app/stores/useTaskStore.ts
- db/migrations/0001_crazy_ezekiel_stane.sql
- db/migrations/meta/0001_snapshot.json
- db/migrations/meta/\_journal.json
- db/schema/index.ts
- db/schema/tasks.ts
- server/api/tasks/[id].get.ts
- server/api/tasks/index.get.ts
- server/api/tasks/index.post.ts
- server/lib/mappers/taskMapper.ts
- server/lib/repositories/taskRepository.ts
- server/lib/services/taskService.ts
- shared/schemas/index.ts
- shared/types/api.ts
- tests/e2e/list-create-view.spec.ts
- tests/fixtures/lists.ts
- tests/integration/api/tasks.spec.ts

## Change Log

- 2026-04-28: Story created and marked `ready-for-dev`.
- 2026-04-28: Implemented first task create/view support, generated the task migration, completed validation, and moved story to `review`.
- 2026-04-28: Focused Epic 1 closeout validation passed with `npm run test:unit`, focused Chromium E2E coverage, and `npm run build`; story marked `done`.
