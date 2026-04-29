# Story 2.1: Assign and Display Tags on Tasks

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to add and remove tags on tasks and see those tags clearly,
so that I can classify work in a way that is easy to scan and manage.

## Acceptance Criteria

1. Given an existing task, when the user adds one or more valid tags, then those tags are persisted and displayed with the task, and the same tags are available through developer-accessible task operations.
2. Given a task already has tags, when the user removes a tag, then the removed tag is no longer shown on the task, and the updated tag set is persisted correctly.
3. Given a task has tags assigned, when the task is shown in the interface, then the user can clearly view the tags associated with that task, and tag display remains consistent across relevant task views.
4. Given the user attempts to add an invalid or duplicate tag value, or the tag update fails, when the tag change is submitted, then the task is not shown with a misleading tag state, and the interface explains how to correct or retry the tag change while preserving the current task context.

## Tasks / Subtasks

- [x] Extend shared tag-aware task contracts and persistence support (AC: 1, 2, 3, 4)
  - [x] Add shared tag validation/contracts so task responses expose a stable tag collection and task mutation payloads can carry tag updates without breaking current create/view consumers.
  - [x] Introduce `db/schema/taskTags.ts` and the minimum migration/schema exports needed for durable task-tag persistence, with duplicate-safe storage semantics per task.
  - [x] Extend `taskRepository`, `taskService`, and any task mappers so task get/list/update flows return persisted tags and reject invalid or duplicate tag values with the existing structured error shape.
- [x] Add developer-accessible task tag operations under current API boundaries (AC: 1, 2, 4)
  - [x] Extend the existing task route surface so task retrieval and mutation operations include tag state.
  - [x] Keep Story 2.1 scoped to task retrieval/update operations and defer any separate tag listing endpoint until Story 2.2 requires it.
  - [x] Keep route validation thin, use services/repositories, and preserve last confirmed task state when a tag mutation fails.
- [x] Add task tag UI within the current list workspace (AC: 1, 2, 3, 4)
  - [x] Extend the current task editing/display UI so users can add/remove tags and view them clearly on each task, with accessible labels and stable chip-style display.
  - [x] Preserve current task context and last confirmed tags when a tag edit fails; provide actionable retry/correction guidance.
  - [x] Add stable test hooks such as `task-tag-input` and task-tag display identifiers aligned with the TEA handoff guidance.
- [x] Add verification coverage for the task-tagging slice (AC: 1, 2, 3, 4)
  - [x] Add integration/API coverage for persisted tag add/remove behavior, invalid or duplicate tag rejection, task retrieval with tags, and failure-safe responses.
  - [x] Add browser coverage for adding, removing, and displaying tags in the selected list workspace while keeping mutable journeys serialized.
  - [x] Keep deterministic SQLite isolation and avoid leaking Story 2.2 filter semantics into this story's tests.

### Review Findings

- [x] [Review][Patch] Enforce tag validation in the service layer before replacing persisted task tags [server/lib/services/taskService.ts:109]
- [x] [Review][Patch] Persist case-only tag label changes instead of treating them as a no-op in the edit UI [app/components/tasks/TaskItem.vue:49]
- [x] [Review][Patch] Add non-UI coverage for successful tag removal persistence on an existing task [tests/integration/api/tasks.spec.ts:110]

## Dev Notes

- Story 2.1 starts Epic 2 and should stay limited to assign/remove/display tag behavior. Do not implement tag filtering, completion, history, or broader cross-list tag browsing in this slice.
- Prefer additive schema changes that preserve existing task data and current CRUD flows; tag persistence should not require rewriting current task records.
- Preserve trustworthy UI semantics from Story 1.5: failed tag changes must not silently add or remove chips from the last confirmed task view.

### Previous Story Learnings

- Story 1.5 already established `PATCH /api/tasks/[id]`, per-task update error state, and inline task editing in `TaskItem.vue`.
- `useTaskStore` mutations are scoped to `currentListId` via `shouldApplyTaskMutation`; tag updates must reuse that protection so late responses do not mutate a different list after navigation or reset.
- `useUiFeedbackStore` success feedback is route-scoped and should only fire after confirmed persistence.
- `tests/fixtures/lists.ts` already provides isolated H3/Drizzle harnessing for task routes; extend that seam rather than creating a second server setup.
- Existing mutable browser task coverage already lives in `tests/e2e/list-create-view.spec.ts`; extend the current journey or keep any new mutable tagging spec serialized.

### Current Repository Baseline

- `Task` responses currently include `createdAt`, `description`, `id`, `listId`, and `title` only; there is no tag field in `shared/types/api.ts` or `shared/schemas/index.ts`.
- `db/schema/index.ts` exports only `todoLists` and `tasks`; there is no task-tag persistence schema yet.
- `server/lib/repositories/taskRepository.ts` and `server/lib/services/taskService.ts` list, find, create, update, and delete tasks but have no tag read/write support.
- `server/api/tags/` exists only as an empty placeholder directory with `.gitkeep`.
- `TaskItem.vue` currently supports title/description edits and delete confirmation only; there is no tag display or input UI.
- `app/pages/lists/[id].vue` and `TaskComposer.vue` currently create tasks without tag input.
- `tests/integration/api/tasks.spec.ts` and current Chromium list/task journeys do not cover tag persistence or display yet.
- The TEA handoff already reserves `task-tag-input`, `tag-filter-bar`, and `tag-filter-chip` test ids, which should guide the naming of new UI hooks.

### Technical Requirements

- Keep Story 2.1 focused on add/remove/display tag behavior for tasks in the selected list workspace only; tag filtering belongs to Story 2.2.
- Keep API JSON camelCase and DB/storage snake_case. If tag persistence needs normalization, define one consistent normalization rule and apply it at validation/service boundaries plus any uniqueness constraint.
- Prevent duplicate or empty tag values from reaching persisted task state. Duplicate-safe behavior must be consistent across UI, store, API, and persistence.
- Preserve existing task CRUD contracts while extending them with tag awareness. Existing task load/update flows should continue working for untagged tasks.
- Preserve the existing structured error shape `{ error: { code, message, details? } }` and keep messages actionable but sanitized.
- Avoid speculative status/history/filter fields or broad workspace changes in this story.

### Architecture Compliance

- Keep route handlers thin; validate inputs at the route boundary, then delegate tag-aware task rules to services and persistence to repositories.
- Keep task and tag logic inside existing feature boundaries: task UI under `app/components/tasks/`, API under `server/api/tasks/` and minimally under `server/api/tags/` only if justified, persistence in `db/schema/` and repositories.
- Keep Pinia changes inside `useTaskStore` actions. Components may hold local tag draft state but must not mutate store task records directly.
- Use additive schema changes and migrations only. Do not break existing task/list restart safety or SQLite durability conventions.
- Treat tag visibility, error feedback, and keyboard accessibility as feature correctness, not polish.

### Library / Framework Requirements

- Nuxt file-based routes remain the API surface. Reuse the existing `index.get.ts`, `[id].get.ts`, and `[id].patch.ts` conventions already in the repo.
- Use shared Zod validation rather than route-local tag parsing.
- Reuse current Drizzle + SQLite utilities and the injected test DB harness.
- Keep client state in Pinia and user feedback in `useUiFeedbackStore`.
- Keep E2E under `tests/e2e/` and Vitest API coverage under `tests/integration/`.

### File Structure Requirements

- Existing files expected to be updated in this story:
  - `app/components/tasks/TaskItem.vue`
  - `app/components/tasks/TaskComposer.vue`
  - `app/pages/lists/[id].vue`
  - `app/stores/useTaskStore.ts`
  - `shared/types/api.ts`
  - `shared/schemas/index.ts`
  - `db/schema/index.ts`
  - `server/lib/repositories/taskRepository.ts`
  - `server/lib/services/taskService.ts`
  - `server/api/tasks/index.get.ts`
  - `server/api/tasks/[id].get.ts`
  - `server/api/tasks/[id].patch.ts`
  - `tests/fixtures/lists.ts`
  - `tests/integration/api/tasks.spec.ts`
  - `tests/e2e/list-create-view.spec.ts`
- New files likely required in this story:
  - `db/schema/taskTags.ts`
  - A new Drizzle migration for task-tag persistence
  - `shared/schemas/tag.ts` if splitting tag schemas out of `shared/schemas/index.ts` materially improves reuse
  - A dedicated task-tag input/display component under `app/components/tasks/` if keeping the full tag UX inside `TaskItem.vue` would overcomplicate the file
  - `server/api/tags/index.get.ts` only if a lightweight tag-list surface is needed for reuse in this story without pulling Story 2.2 filter behavior forward

### Testing Requirements

- Relevant QA references for this story include:
  - `TD-API-002` for task CRUD with descriptions and tags
  - `TD-COMP-001` for field accessibility and visible feedback
  - `TD-E2E-002` for keyboard/accessibility expectations
  - `TD-E2E-003` for save failure and retry-safe recovery
  - `R-003` to keep tag semantics from drifting ahead of Story 2.2
- Add API or integration coverage for:
  - successful tag add persistence on an existing task
  - successful tag removal persistence on an existing task
  - task list/detail retrieval including the persisted tag collection
  - invalid or duplicate tag rejection with actionable validation feedback
  - failure paths that keep the last confirmed tag state visible to the client
- Add browser coverage for:
  - adding tags to a task in the active list workspace
  - removing a tag from a task
  - clear visible tag rendering on the task card
  - recovery after a failed tag update without misleading chip state
- Preserve deterministic SQLite isolation and keep mutable browser journeys serialized where needed.

### Existing Files Being Modified - Preserve and Extend

- `app/components/tasks/TaskItem.vue`
  - Preserve current inline edit/delete flows and metadata display while layering in tag display and tag editing affordances.
- `app/stores/useTaskStore.ts`
  - Preserve current load/create/update/delete behavior and list scoping while extending task updates with tag-aware mutation handling.
- `app/pages/lists/[id].vue` and `app/components/tasks/TaskComposer.vue`
  - Preserve the current selected-list workspace and fast task creation flow; only add tag input here if it materially supports the story without creating UX ambiguity.
- `shared/types/api.ts` and `shared/schemas/index.ts`
  - Extend the task contract surface with tag awareness without breaking current list/task consumers.
- `tests/fixtures/lists.ts`
  - Preserve the current isolated API harness and extend it with any new tag-aware routes rather than building a second fixture stack.

### Latest Technical Information

- Current task update flows already preserve the last confirmed task content on failure through local drafts plus `updateErrors[taskId]`; tag editing should reuse that pattern.
- The active workspace route resets task state on list changes and ignores late task mutations. Tag writes must follow the same request/list scoping to avoid cross-list UI leaks.
- `server/api/tags/` exists as a placeholder only, so any new tag endpoint should be deliberately minimal and aligned to Story 2.1's scope.
- Current task persistence is additive and list-scoped. A task-tag schema should preserve that simplicity and avoid unnecessary broad joins or speculative fields.
- Story 2.2 will introduce filtering, so Story 2.1 should establish stable tag storage and display semantics without deciding filter UX prematurely.

### Project Structure Notes

- There is still no standalone UX specification. Use the epics file, PRD, architecture, QA/test handoff, and current runtime code as the source of truth.
- Story 2.1 is the first Epic 2 slice and should preserve the vertical-slice approach already used in Epic 1.
- `_bmad/` and `_bmad-output/` remain planning support only and are not part of the runtime app architecture.

### References

- [Source: _bmad-output/planning-artifacts/epics.md - Story 2.1: Assign and Display Tags on Tasks]
- [Source: _bmad-output/planning-artifacts/architecture.md - Database Naming Conventions]
- [Source: _bmad-output/planning-artifacts/architecture.md - Tagging and Task Organization Mapping]
- [Source: _bmad-output/planning-artifacts/architecture.md - Project Structure]
- [Source: _bmad-output/planning-artifacts/PRD.md - Tagging and Task Organization]
- [Source: _bmad-output/test-artifacts/test-design-qa.md - TD-API-002]
- [Source: _bmad-output/test-artifacts/test-design-qa.md - TD-COMP-001]
- [Source: _bmad-output/test-artifacts/test-design-qa.md - TD-E2E-002]
- [Source: _bmad-output/test-artifacts/test-design-qa.md - TD-E2E-003]
- [Source: _bmad-output/test-artifacts/test-design/aine-bmad-todo-handoff.md - Story-Level Integration Guidance]
- [Source: app/pages/lists/[id].vue]
- [Source: app/stores/useTaskStore.ts]
- [Source: app/components/tasks/TaskComposer.vue]
- [Source: app/components/tasks/TaskItem.vue]
- [Source: shared/types/api.ts]
- [Source: shared/schemas/index.ts]
- [Source: db/schema/index.ts]
- [Source: db/schema/tasks.ts]
- [Source: server/api/tasks/index.get.ts]
- [Source: server/api/tasks/[id].get.ts]
- [Source: server/api/tasks/[id].patch.ts]
- [Source: server/api/tags/.gitkeep]
- [Source: server/lib/repositories/taskRepository.ts]
- [Source: server/lib/services/taskService.ts]
- [Source: tests/fixtures/lists.ts]
- [Source: tests/integration/api/tasks.spec.ts]
- [Source: tests/e2e/list-create-view.spec.ts]

## Dev Agent Record

### Agent Model Used

GPT-5.4

### Debug Log References

- Story 2.1 was selected after Epic 1 closed and the first Epic 2 backlog entry was confirmed from `sprint-status.yaml`.
- Planning context was pulled from the Epic 2 story definition, architecture mappings for tagging/task organization, and QA/handoff references for tag-related coverage and test ids.
- Current runtime baseline was reloaded from the live task store, task item/workspace UI, shared task contracts, DB schema exports, and task service/repository layers before packaging this story.
- Validation completed with `npm run db:generate`, `npm run test:unit`, `npm run test:e2e -- tests/e2e/list-create-view.spec.ts --project=chromium`, and `npm run build`.

### Completion Notes List

- Added shared task tag contracts plus reusable normalization/validation so tasks now expose a stable `tags` array and reject duplicate tag values before persistence.
- Added additive `task_tags` persistence with a generated Drizzle migration, then extended task repository/service flows so task list/detail/update operations read and replace tags safely.
- Extended `TaskItem.vue` with task tag chips, inline add/remove tag editing, and failure-safe draft behavior that preserves the last confirmed tag display when updates fail.
- Extended integration and Chromium E2E coverage for tag persistence, duplicate-tag rejection, and retry-safe tag update failures while keeping the mutable task journey serialized in the existing spec.
- Acceptance pass confirmed all four acceptance criteria after the review hardening for service-boundary validation, case-only tag label persistence, and non-UI tag removal coverage.

### File List

- \_bmad-output/implementation-artifacts/2-1-assign-and-display-tags-on-tasks.md
- app/assets/css/main.css
- app/components/tasks/TaskItem.vue
- db/migrations/0002_nostalgic_christian_walker.sql
- db/migrations/meta/0002_snapshot.json
- db/migrations/meta/\_journal.json
- db/schema/index.ts
- db/schema/taskTags.ts
- shared/schemas/index.ts
- shared/schemas/tag.ts
- shared/types/api.ts
- server/lib/mappers/taskMapper.ts
- server/lib/repositories/taskRepository.ts
- server/lib/services/taskService.ts
- tests/e2e/list-create-view.spec.ts
- tests/integration/api/tasks.spec.ts
- tests/integration/task-store.spec.ts

## Change Log

- 2026-04-29: Review patches applied for service-boundary validation, case-only tag label persistence, and non-UI tag removal coverage.
- 2026-04-29: Acceptance pass completed with no findings; Story 2.1 marked `done` after `npm run test:unit -- tests/integration/api/tasks.spec.ts`, focused Chromium E2E coverage, and `npm run build`.
