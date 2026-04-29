# Story 2.3: Mark Tasks Completed and Separate Active Work

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to mark tasks as completed and keep active tasks visually distinct,
so that I can track progress without losing clarity about what still needs attention.

## Acceptance Criteria

1. Given an active task exists, when the user marks it as completed, then the task state is persisted as completed, and the task is no longer shown as active work in the main active-task view.
2. Given a mix of active and completed tasks exists, when the user views the task workspace, then active tasks are clearly distinguishable from completed tasks, and task state is communicated consistently in the interface.
3. Given completion operations are available to developers, when a completion request is made through the application API, then the task completion state is updated correctly, and the operation returns a consistent response shape.
4. Given a completion request fails, when the failure is returned to the client, then the task remains accurately represented in its last confirmed state, and the user receives clear feedback and retry guidance instead of a misleading completion result.

## Tasks / Subtasks

- [ ] Extend shared task-status contracts and persistence support for completion (AC: 1, 2, 3)
  - [ ] Add additive completion fields to the shared task contract and validation layer so tasks can communicate durable completion state without breaking current tag/filter consumers.
  - [ ] Extend task persistence with the minimum schema support needed for completion, aligning with the architecture guidance around `completed_at` rather than introducing a separate archive model.
  - [ ] Keep the distinction between active, completed, deleted, and missing tasks explicit so later history stories inherit stable semantics.
- [ ] Add developer-accessible completion operations and retrieval semantics (AC: 1, 3, 4)
  - [ ] Introduce a dedicated completion operation under the current API boundaries, aligned with the architecture guidance for `/api/tasks/[id]/complete` or an equally minimal route surface.
  - [ ] Extend task retrieval only as far as needed to separate active and completed work in the current workspace without pulling the dedicated history experience forward from later stories.
  - [ ] Preserve structured validation/error responses and last confirmed task state when completion requests fail.
- [ ] Add completion controls and active/completed separation in the list workspace (AC: 1, 2, 4)
  - [ ] Add a keyboard-accessible completion control and stable hooks such as `task-complete-toggle` so task state changes are explicit and testable.
  - [ ] Keep active tasks visually prominent while completed tasks are clearly separated and status is communicated consistently in the current workspace.
  - [ ] Ensure completion transitions interact safely with current tag filtering, success feedback, and task mutation state without creating misleading empty/error states.
- [ ] Add verification coverage for completion and active-work separation (AC: 1, 2, 3, 4)
  - [ ] Add store/unit coverage for completion transitions, active/completed separation, and stale response safety.
  - [ ] Add API/integration coverage for completion persistence, retrieval semantics, and failure-safe responses.
  - [ ] Extend the serialized browser journey for marking tasks completed, verifying active-work separation, keyboard accessibility, and retry-safe failure handling.

## Dev Notes

- Story 2.3 should stay limited to marking tasks completed and separating active work inside the current list workspace. Do not introduce the dedicated history experience from Story 3.1 in this slice.
- Keep completed tasks durable and distinct from deleted tasks. Completion must never look like removal or missing-data behavior.
- Preserve trustworthy UI semantics from Stories 1.5, 1.6, 2.1, and 2.2: a failed completion request must not misrepresent the task's last confirmed state.
- Prefer additive persistence and API changes. Completion should extend the existing task record model rather than creating a second task-storage path.

### Previous Story Learnings

- Story 2.2 established list-scoped tag filtering with `allTasks`, `activeTagFilter`, request invalidation, and no-store task reads in `useTaskStore`; completion behavior must coexist with that state model without leaking across lists or stale responses.
- Story 2.2 also established filtered-empty, load-error, and filtered-create recovery semantics. Completion must avoid confusing active-empty, filtered-empty, and completed-state transitions.
- Story 2.1 established durable task tags plus failure-safe task editing and retrieval semantics, which completion flows must preserve rather than bypass.
- Story 1.6 established route-scoped success feedback and workspace reset protections. Completion actions must follow the same list-boundary safety.
- Existing mutable browser task coverage already lives in `tests/e2e/list-create-view.spec.ts`; extend that serialized journey unless a focused completion spec is clearly safer.

### Current Repository Baseline

- `shared/types/api.ts` defines `Task` with `createdAt`, `description`, `id`, `listId`, `tags`, and `title` only; there is no completion state in the shared contract yet.
- `shared/schemas/index.ts` and `server/api/tasks/[id].patch.ts` currently validate and update only title/description/tag changes; there is no completion-specific schema or endpoint.
- `db/schema/tasks.ts` currently stores `created_at`, `description`, `id`, `list_id`, and `title`, but no `completed_at` or completion marker.
- `server/lib/repositories/taskRepository.ts` lists every task for a list in created-order and has no active/completed query distinction.
- `server/lib/services/taskService.ts` supports create/read/update/delete and tag-aware retrieval, but has no task-completion operation or completion-aware collection rules.
- `app/stores/useTaskStore.ts` now tracks `tasks`, `allTasks`, and tag-filter state, but it has no completion action or active/completed partitioning.
- `app/components/tasks/TaskItem.vue` currently exposes edit/delete affordances and tag editing only; there is no completion control or status display.
- `app/pages/lists/[id].vue` renders a single task list in the workspace and does not currently distinguish active from completed tasks.
- Current integration and Chromium coverage verify task CRUD, tags, and filtering, but they do not cover completion persistence or active/completed separation.

### Technical Requirements

- Keep completion scope to the currently selected list workspace. Completion results and recovery state must not leak across list navigation.
- Persist completion as task state, not deletion. Completed tasks must remain durable for later stories that expose retained history and dedicated history browsing.
- Keep active work clearly separated from completed work in the current workspace without introducing the full history experience early.
- Preserve current structured error responses `{ error: { code, message, details? } }` and user-safe recovery guidance.
- Define how completion interacts with tag filtering explicitly. Active/completed separation must not break Story 2.2 filter semantics or misclassify filtered empty states.
- Avoid speculative restore/history browsing UX in this story. Story 2.4 and Epic 3 handle retained history and dedicated recall flows.

### Architecture Compliance

- Keep route handlers thin: validate completion input at the API boundary, then delegate completion rules to services and repositories.
- Follow the architecture guidance for task status/history by preferring `server/api/tasks/[id]/complete.post.ts` and additive `db/schema/tasks.ts` updates.
- Keep UI changes inside the existing list workspace and task components unless a minimal supporting component materially clarifies active/completed rendering.
- Preserve existing task service/repository boundaries so completion logic does not get duplicated in route handlers or components.
- Treat task-status visibility, keyboard access, and failure recovery as core correctness rather than optional polish.

### Library / Framework Requirements

- Nuxt file-based routes remain the API surface. Reuse current task routes and add a completion route only where it materially improves contract clarity.
- Use shared Zod validation for completion-related payloads or query semantics instead of route-local parsing.
- Reuse the current Drizzle + SQLite utilities and test DB harness.
- Keep client state in Pinia and continue using `useUiFeedbackStore` for confirmed-success feedback.
- Keep E2E under `tests/e2e/` and Vitest API/store coverage under `tests/integration/`.

### File Structure Requirements

- Existing files expected to be updated in this story:
  - `app/pages/lists/[id].vue`
  - `app/stores/useTaskStore.ts`
  - `app/components/tasks/TaskItem.vue`
  - `app/components/tasks/TaskList.vue`
  - `shared/types/api.ts`
  - `shared/schemas/index.ts`
  - `db/schema/tasks.ts`
  - `server/api/tasks/index.get.ts`
  - `server/api/tasks/[id].patch.ts` if shared task-update semantics change alongside completion support
  - `server/lib/repositories/taskRepository.ts`
  - `server/lib/services/taskService.ts`
  - `tests/integration/api/tasks.spec.ts`
  - `tests/integration/task-store.spec.ts`
  - `tests/e2e/list-create-view.spec.ts`
- New files likely required in this story:
  - `server/api/tasks/[id]/complete.post.ts`
  - A new Drizzle migration for completion-state persistence
  - A minimal completion/status component only if it materially improves clarity without prematurely introducing the full history UI

### Testing Requirements

- Relevant QA references for this story include:
  - `TD-API-003` for completion and history transitions
  - `TD-E2E-001` for the core create -> tag -> filter -> complete journey
  - `TD-E2E-002` for keyboard and accessibility expectations
  - `TD-E2E-003` for save failure and recovery semantics
  - `TD-UNIT-002` for completion/filter boundary behavior
  - `R-001` and `R-002` for persistence integrity and completion/history correctness
- Add unit or store-level coverage for:
  - marking a task completed
  - separating active and completed tasks in store state
  - preserving last confirmed state when completion fails
  - keeping filter and completion state interactions list-scoped and predictable
- Add API or integration coverage for:
  - successful completion persistence
  - retrieving active vs completed task state accurately
  - no duplication or loss across completion transitions
  - actionable validation and not-found recovery paths
- Add browser coverage for:
  - a visible completion control with stable test hooks
  - completed tasks leaving the active-work view
  - active/completed state clarity in the workspace
  - failure-safe completion recovery without misleading status changes

### Existing Files Being Modified - Preserve and Extend

- `app/stores/useTaskStore.ts`
  - Preserve current load/create/update/delete/filter behavior and list scoping while layering in completion transitions and active/completed separation.
- `app/pages/lists/[id].vue`
  - Preserve current workspace restore flow, task composer behavior, filter bar wiring, and route-scoped feedback while adding completion-aware rendering.
- `app/components/tasks/TaskItem.vue`
  - Preserve current edit/delete/tag interactions while adding a completion control and status communication that does not regress accessibility or failure handling.
- `app/components/tasks/TaskList.vue`
  - Preserve the current loading/error/empty/task-list rendering split while supporting clear active/completed status separation in the workspace.
- `server/api/tasks/index.get.ts`
  - Preserve current list-scoped retrieval and tag-filter semantics while extending task-state retrieval only as needed for Story 2.3.
- `server/lib/repositories/taskRepository.ts` and `server/lib/services/taskService.ts`
  - Preserve current tag hydration, ordering, and structured error behavior while extending completion persistence and retrieval rules.

### Latest Technical Information

- Story 2.2 is complete and accepted, so tag filtering plus filtered-create/failure recovery are now baseline behavior for Story 2.3.
- The architecture examples already reserve `completed_at`, `completedOnly`, and `/api/tasks/[id]/complete` as the intended direction for task status/history support.
- The TEA handoff already reserves `task-complete-toggle` as a stable UI hook for automated tests.
- The PRD expects the user to move from task creation to tagging, filtering, completion, and later history retrieval as a coherent product flow, so completion semantics should stay inspectable and stable for later history stories.

### Project Structure Notes

- There is still no standalone UX specification. Use the epics file, architecture, PRD, QA/test handoff, and current runtime code as the source of truth.
- Story 2.3 should preserve the vertical-slice approach used throughout Epic 1 and Stories 2.1-2.2.
- `_bmad/` and `_bmad-output/` remain planning support only and are not part of the runtime application architecture.

### References

- [Source: _bmad-output/planning-artifacts/epics.md - Story 2.3: Mark Tasks Completed and Separate Active Work]
- [Source: _bmad-output/planning-artifacts/architecture.md - Database Naming Conventions]
- [Source: _bmad-output/planning-artifacts/architecture.md - Task Status and History]
- [Source: _bmad-output/planning-artifacts/architecture.md - Integration Points]
- [Source: _bmad-output/planning-artifacts/PRD.md - Product Vision and Goals]
- [Source: _bmad-output/planning-artifacts/PRD.md - Functional Requirements FR18-FR22]
- [Source: _bmad-output/test-artifacts/test-design-qa.md - TD-API-003]
- [Source: _bmad-output/test-artifacts/test-design-qa.md - TD-E2E-001]
- [Source: _bmad-output/test-artifacts/test-design-qa.md - TD-E2E-002]
- [Source: _bmad-output/test-artifacts/test-design-qa.md - TD-E2E-003]
- [Source: _bmad-output/test-artifacts/test-design-qa.md - TD-UNIT-002]
- [Source: _bmad-output/test-artifacts/test-design/aine-bmad-todo-handoff.md - Story-Level Integration Guidance]
- [Source: _bmad-output/implementation-artifacts/2-2-filter-tasks-by-tag.md]
- [Source: app/pages/lists/[id].vue]
- [Source: app/stores/useTaskStore.ts]
- [Source: app/components/tasks/TaskItem.vue]
- [Source: app/components/tasks/TaskList.vue]
- [Source: app/components/tasks/TaskComposer.vue]
- [Source: shared/types/api.ts]
- [Source: shared/schemas/index.ts]
- [Source: db/schema/tasks.ts]
- [Source: server/api/tasks/index.get.ts]
- [Source: server/api/tasks/[id].patch.ts]
- [Source: server/lib/repositories/taskRepository.ts]
- [Source: server/lib/services/taskService.ts]
- [Source: tests/integration/api/tasks.spec.ts]
- [Source: tests/integration/task-store.spec.ts]
- [Source: tests/e2e/list-create-view.spec.ts]

## Dev Agent Record

### Agent Model Used

GPT-5.4

### Debug Log References

- Story 2.3 was selected from `sprint-status.yaml` after Story 2.2 reached `done`.
- Planning context was pulled from the Epic 2 story definition, task status/history architecture guidance, PRD completion requirements, and QA/handoff references for completion and recovery behavior.
- Current runtime baseline was reloaded from the accepted Story 2.2 artifact plus the current task types, task routes, task repository/service flows, task store, and workspace UI before packaging this story.

### Completion Notes List

- Pending implementation.

### File List

- Pending implementation.