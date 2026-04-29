# Story 2.2: Filter Tasks by Tag

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to filter tasks by tag,
so that I can focus on the most relevant subset of work without manually scanning every task.

## Acceptance Criteria

1. Given tasks with one or more tags exist in the selected list, when the user applies a tag filter, then only tasks matching the selected tag criteria are shown in the filtered task view, and the filtered state is visually clear to the user.
2. Given a tag filter is already active, when the user clears that filter, then the unfiltered task view is restored, and no unrelated task state is changed by clearing the filter.
3. Given a tag-filter request fails or returns no matching tasks, when the filtered view is resolved, then the interface shows either actionable recovery guidance or a clear filtered empty state, and the user can change or clear the filter without losing the underlying task context.
4. Given developer-accessible filtering operations exist, when tag-based filtering is requested through the application API, then the returned task set reflects the same semantics used in the UI, and filtering behavior stays consistent across store, API, and persistence.

## Tasks / Subtasks

- [x] Extend shared filter-aware task query contracts and tag-filter semantics (AC: 1, 2, 4)
  - [x] Add shared validation for list-scoped task retrieval with an optional tag filter without breaking existing unfiltered task queries.
  - [x] Reuse the Story 2.1 tag normalization and comparison rules so filter behavior stays aligned across UI, store, API, and persistence.
  - [x] Decide whether a lightweight current-list tag catalog surface is needed to keep filter choices stable after a filter is applied, and keep any new API surface tightly scoped to Story 2.2.
- [x] Add developer-accessible tag filtering operations under current API boundaries (AC: 1, 3, 4)
  - [x] Extend task-list retrieval so list-scoped filtering can be requested through the existing application API while preserving the current `TaskCollectionResponse` contract.
  - [x] Keep no-match filtering as a successful empty response; reserve error states for invalid input or true load failures with actionable recovery guidance.
  - [x] Keep filter semantics aligned across repository joins, service rules, and store expectations; do not pull completion/history behavior forward from later stories.
- [x] Add list workspace tag-filter UI and state management (AC: 1, 2, 3)
  - [x] Introduce a clear, keyboard-accessible filter control that exposes available tag choices, a visible active-filter state, and an explicit clear action.
  - [x] Preserve the underlying task context when filtered results are empty or a filter request fails; changing or clearing the filter must not disturb unrelated task drafts or mutation state.
  - [x] Reset or safely rehydrate filter state on list changes so filters never leak across workspaces.
- [x] Add verification coverage for the tag-filtering slice (AC: 1, 2, 3, 4)
  - [x] Add unit or store-level coverage for filter predicate logic, tag selection, clear-filter behavior, and list scoping.
  - [x] Add API or integration coverage for optional tag-query semantics, normalized matching, empty filtered results, and consistent response shape.
  - [x] Add browser coverage for applying and clearing a filter, visible active-filter state, filtered empty states, and keyboard-accessible filter controls while keeping mutable journeys serialized.

### Review Findings

- [x] [Review][Patch] Prevent new task creation while a tag filter is active so successful creates do not disappear immediately from the filtered task view.
- [x] [Review][Patch] Keep filter-load errors recoverable by exposing a dismiss action even when no filter became active or the available tag set later drops to zero.

## Dev Notes

- Story 2.2 should stay limited to tag-based task filtering inside the selected list workspace. Do not add completion state, history browsing, multi-tag query composition, or cross-list tag browsing in this slice.
- Preserve trustworthy task-state semantics from Stories 1.5, 1.6, and 2.1: a failed filter request must not misrepresent the last confirmed task state, and filtered-empty state must stay distinct from load-error and list-empty states.
- Prefer additive API and state changes. No new persistence schema should be introduced unless the final design truly cannot support Story 2.2 with the existing `task_tags` structure.

### Previous Story Learnings

- Story 2.1 established `Task.tags`, shared tag normalization helpers in `shared/schemas/tag.ts`, and durable `task_tags` persistence with `name_normalized` support.
- Story 2.1 also deferred any separate tag-list API surface until filtering required it, so Story 2.2 may add the minimum viable current-list tag retrieval endpoint if needed to keep filter choices stable.
- `useTaskStore` already scopes task mutations to `currentListId` through `shouldApplyTaskMutation`; filter state and filter-triggered loads must follow the same list-boundary safety.
- Story 1.6 established route-scoped success feedback and safe state resets on workspace changes. Filter state must not leak across list navigation or stale responses.
- Existing mutable browser task coverage already lives in `tests/e2e/list-create-view.spec.ts`; extend the serialized task journey there unless a dedicated filter spec is clearly safer.

### Current Repository Baseline

- `shared/types/api.ts` and `shared/schemas/index.ts` now expose a tag-aware `Task` contract with `tags: TaskTag[]`, but there is no shared task-list query schema for optional tag filtering yet.
- `shared/schemas/tag.ts` already defines `TASK_TAG_MAX_LENGTH`, `normalizeTaskTagName`, and `normalizeTaskTagNameForComparison`, which should remain the canonical filter-comparison helpers.
- `db/schema/taskTags.ts` and the existing Story 2.1 migration persist tags in a separate `task_tags` table with task-scoped uniqueness on `(task_id, name_normalized)`.
- `server/lib/repositories/taskRepository.ts` can list tasks by list and hydrate tags for a known task set, but it has no tag-filtered list query yet.
- `server/lib/services/taskService.ts` can load list-scoped tasks and individual tasks with hydrated tags, but it has no filter-aware list operation.
- `server/api/tasks/index.get.ts` currently validates only `listId` and always returns the full list-scoped task collection.
- `app/stores/useTaskStore.ts` holds `tasks`, `currentListId`, load state, and mutation errors, but it has no active filter state, filtered-task getter, or filter-aware `loadTasks` action.
- `app/pages/lists/[id].vue` restores the selected workspace and loads tasks for that list, but it renders no filter bar or filtered empty state.
- `app/components/tasks/TaskList.vue` renders loading, error, empty, and task-list states for a provided task array; it does not distinguish filtered-empty state yet.
- `app/components/tasks/TaskItem.vue` displays tags and supports tag editing, but tags are not filter controls.
- `app/components/filters/` and `server/api/tags/` still contain only `.gitkeep` placeholders.
- Current integration and Chromium browser coverage verify tag persistence, duplicate-tag rejection, and retry-safe tag updates, but they do not cover tag-filter query semantics or filter UI behavior.

### Technical Requirements

- Keep filter scope to the currently selected list only. Clearing or changing a filter must not affect other lists or unrelated task state.
- Use a single canonical tag-comparison rule based on the existing shared normalization helpers. Filter behavior must match stored tags regardless of case or Unicode-normalization form.
- Keep the existing unfiltered task-list contract intact. Any tag-filter API support must be additive and must continue returning the existing task collection shape.
- Distinguish a filtered empty state from the current "no tasks yet" empty state and from load failures. The UI must make it obvious whether the list has no tasks or the current filter found no matches.
- Preserve the structured error shape `{ error: { code, message, details? } }` and keep user-facing filter failure messages actionable but sanitized.
- Avoid introducing completion/status/history fields or multi-tag AND/OR logic in this story. Those concerns belong to later Epic 2 and Epic 3 slices.

### Architecture Compliance

- Keep route handlers thin: validate `listId` plus any optional tag-filter input at the API boundary, then delegate filter behavior to services and repositories.
- Keep filter logic inside existing feature boundaries: UI controls under `app/components/filters/` and list workspace wiring under `app/pages/lists/[id].vue` or `useTaskStore`.
- Reuse the existing task service/repository boundary rather than introducing duplicate filter logic in route handlers.
- If a dedicated current-list tag surface is needed, keep it minimal and scoped to Story 2.2 rather than creating a broad tag-browsing API.
- Treat active-filter visibility, clear-filter affordances, keyboard access, and filtered empty/error states as feature correctness rather than polish.

### Library / Framework Requirements

- Nuxt file-based routes remain the API surface. Reuse `server/api/tasks/index.get.ts` and only add `server/api/tags/index.get.ts` if a lightweight current-list tag surface is justified.
- Use shared Zod validation for filter inputs instead of route-local parsing.
- Reuse current Drizzle + SQLite utilities and the injected test DB harness.
- Keep client state in Pinia and user feedback in `useUiFeedbackStore`.
- Follow the architecture guidance that reserves `app/components/filters/` and `app/composables/useTaskFilters.ts` for filtering concerns if a composable materially clarifies the implementation.
- Keep E2E under `tests/e2e/` and Vitest API/store coverage under `tests/integration/` or the current equivalent test folders.

### File Structure Requirements

- Existing files expected to be updated in this story:
  - `app/pages/lists/[id].vue`
  - `app/stores/useTaskStore.ts`
  - `app/components/tasks/TaskList.vue`
  - `shared/schemas/index.ts`
  - `shared/schemas/tag.ts` if a shared filter-query helper materially improves reuse
  - `server/api/tasks/index.get.ts`
  - `server/lib/repositories/taskRepository.ts`
  - `server/lib/services/taskService.ts`
  - `tests/integration/api/tasks.spec.ts`
  - `tests/integration/task-store.spec.ts`
  - `tests/e2e/list-create-view.spec.ts`
- New files likely required in this story:
  - `app/components/filters/TaskFilterBar.vue`
  - `app/composables/useTaskFilters.ts` if shared filter derivation or normalization logic materially reduces duplication
  - `server/api/tags/index.get.ts` only if a lightweight current-list tag-list surface is needed to keep filter choices stable while filtered
  - A focused store or filter-specific test file only if the current test files become too overloaded to keep the new coverage readable

### Testing Requirements

- Relevant QA references for this story include:
  - `TD-UNIT-002` for filter predicate logic
  - `TD-API-004` for tag-filter query semantics
  - `TD-E2E-001` for the core list -> task -> tag -> filter user journey
  - `TD-E2E-002` for keyboard/accessibility expectations
  - `TD-E2E-004` for mobile viewport usability
  - `TD-E2E-005` for cross-browser smoke on the main journey
  - `R-003` to keep filter semantics from drifting across store, API, and persistence
- Add unit or store-level coverage for:
  - selecting a tag filter
  - clearing a tag filter
  - normalized filter comparison
  - list-scoped filter reset behavior
- Add API or integration coverage for:
  - successful list-scoped filtering by tag
  - normalized tag matching through the API
  - no-match filtering returning an empty collection without corrupting task state
  - invalid filter input returning actionable validation feedback
- Add browser coverage for:
  - visible filter controls and active-filter state
  - applying a tag filter and seeing only matching tasks
  - clearing the filter and restoring the unfiltered list
  - filtered empty-state guidance distinct from the base list empty state
  - keyboard-only filter interaction and accessible labels
- Keep mutable browser journeys serialized and avoid coupling Story 2.2 coverage to completion/history behavior from later stories.

### Existing Files Being Modified - Preserve and Extend

- `app/stores/useTaskStore.ts`
  - Preserve current load/create/update/delete behavior, list scoping, and late-response protections while layering in filter-aware load and derived state.
- `app/pages/lists/[id].vue`
  - Preserve current workspace restore flow, task composer drafts, and route-scoped feedback while introducing filter UI and filtered state rendering.
- `app/components/tasks/TaskList.vue`
  - Preserve the current loading/error/empty/task-list rendering split while adding a distinct filtered-empty experience if needed.
- `app/components/tasks/TaskItem.vue`
  - Preserve current task tag display and inline edit/delete behavior; do not overload task-row interactions unless making a tag chip filter trigger clearly improves the story without hurting accessibility.
- `server/api/tasks/index.get.ts`
  - Preserve current list-scoped unfiltered retrieval when no filter is provided.
- `server/lib/repositories/taskRepository.ts` and `server/lib/services/taskService.ts`
  - Preserve current tag hydration and task collection ordering while extending list retrieval with filter-aware semantics.
- `tests/integration/api/tasks.spec.ts` and `tests/e2e/list-create-view.spec.ts`
  - Extend the current task/tag coverage instead of creating a second fixture stack unless readability or test isolation clearly requires it.

### Latest Technical Information

- Story 2.1 is complete and accepted, so tag persistence, tag display, and tag-edit failure recovery are now the baseline for Story 2.2.
- The current task-list API returns a `TaskCollectionResponse` containing tag-aware tasks for a given list, but it does not yet accept tag-filter input.
- The architecture explicitly reserves `app/components/filters/`, `app/composables/useTaskFilters.ts`, and `server/api/tags/index.get.ts` for tagging and task-organization concerns.
- The TEA handoff already reserves `tag-filter-bar` and `tag-filter-chip` test IDs, which should guide the naming of new filter UI hooks.
- The PRD treats filtering as a first-class core flow and highlights filtering complexity as a project risk, so Story 2.2 should prefer straightforward, inspectable semantics over clever query composition.

### Project Structure Notes

- There is still no standalone UX specification. Use the epics file, architecture, PRD, QA/test handoff, and current runtime code as the source of truth.
- Story 2.2 should preserve the vertical-slice approach used throughout Epic 1 and Story 2.1.
- `_bmad/` and `_bmad-output/` remain planning support only and are not part of the runtime architecture.

### References

- [Source: _bmad-output/planning-artifacts/epics.md - Story 2.2: Filter Tasks by Tag]
- [Source: _bmad-output/planning-artifacts/architecture.md - Tagging and Task Organization]
- [Source: _bmad-output/planning-artifacts/architecture.md - Integration Points]
- [Source: _bmad-output/planning-artifacts/PRD.md - Tagging and Task Organization]
- [Source: _bmad-output/planning-artifacts/PRD.md - Architecture and Technical Considerations]
- [Source: _bmad-output/test-artifacts/test-design-qa.md - TD-UNIT-002]
- [Source: _bmad-output/test-artifacts/test-design-qa.md - TD-API-004]
- [Source: _bmad-output/test-artifacts/test-design-qa.md - TD-E2E-001]
- [Source: _bmad-output/test-artifacts/test-design-qa.md - TD-E2E-002]
- [Source: _bmad-output/test-artifacts/test-design-qa.md - TD-E2E-004]
- [Source: _bmad-output/test-artifacts/test-design-qa.md - TD-E2E-005]
- [Source: _bmad-output/test-artifacts/test-design/aine-bmad-todo-handoff.md - Story-Level Integration Guidance]
- [Source: _bmad-output/implementation-artifacts/2-1-assign-and-display-tags-on-tasks.md]
- [Source: app/pages/lists/[id].vue]
- [Source: app/stores/useTaskStore.ts]
- [Source: app/components/tasks/TaskList.vue]
- [Source: app/components/tasks/TaskItem.vue]
- [Source: app/components/filters/.gitkeep]
- [Source: server/api/tasks/index.get.ts]
- [Source: server/api/tags/.gitkeep]
- [Source: server/lib/repositories/taskRepository.ts]
- [Source: server/lib/services/taskService.ts]
- [Source: shared/types/api.ts]
- [Source: shared/schemas/index.ts]
- [Source: shared/schemas/tag.ts]
- [Source: db/schema/taskTags.ts]
- [Source: tests/integration/api/tasks.spec.ts]
- [Source: tests/integration/task-store.spec.ts]
- [Source: tests/e2e/list-create-view.spec.ts]

## Dev Agent Record

### Agent Model Used

GPT-5.4

### Debug Log References

- Story 2.2 was selected from `sprint-status.yaml` after Story 2.1 reached `done`.
- Planning context was pulled from the Epic 2 story definition, architecture mappings for tagging and task organization, PRD guidance for filtering as a core workflow, and QA/handoff references for filter semantics and test IDs.
- Current runtime baseline was reloaded from the accepted Story 2.1 artifact, `useTaskStore`, `TaskList.vue`, `app/pages/lists/[id].vue`, shared tag/task schemas, `server/api/tasks/index.get.ts`, and current task service/repository list flows.
- Validation completed with `npm run test:unit`, `npm run test:e2e -- tests/e2e/list-create-view.spec.ts --project=chromium`, and `npm run build`.

### Completion Notes List

- Added shared optional task-filter query validation plus normalized filter helpers so `/api/tasks` now supports additive list-scoped tag filtering without changing the existing collection response shape.
- Added `TaskFilterBar.vue`, `useTaskFilters.ts`, and filter-aware list workspace wiring so users can apply or clear a visible tag filter, see stable available tags, and get a distinct filtered empty state.
- Extended `useTaskStore` with `allTasks`, `activeTagFilter`, request invalidation, and no-store task reads so filter state stays list-scoped, clears safely, and preserves the last confirmed task view on filter failure.
- Extended store, API, and Chromium browser coverage for normalized filtering semantics, invalid tag validation, apply/clear flows, keyboard interaction, and filtered empty-state behavior.
- Review hardening disabled task capture while a tag filter is active and made filter-failure recovery dismissible without requiring a previously active filter.
- Final review hardening keeps the filter bar visible for dismissible filter-load errors even when no active tag remains and no filter chips are left to render.
- Acceptance pass confirmed all four acceptance criteria after the review hardening for filtered-create visibility and filter-load recovery, with the validated behavior remaining aligned across store, API, and UI flows.

### File List

- \_bmad-output/implementation-artifacts/2-2-filter-tasks-by-tag.md
- app/assets/css/main.css
- app/components/filters/TaskFilterBar.vue
- app/components/tasks/TaskComposer.vue
- app/components/tasks/TaskList.vue
- app/composables/useTaskFilters.ts
- app/pages/lists/[id].vue
- app/stores/useTaskStore.ts
- shared/schemas/index.ts
- server/api/tasks/index.get.ts
- server/lib/services/taskService.ts
- tests/e2e/list-create-view.spec.ts
- tests/integration/feedback-state-components.spec.ts
- tests/integration/api/tasks.spec.ts
- tests/integration/task-store.spec.ts

## Change Log

- 2026-04-29: Implemented list-scoped tag filtering across the task API, Pinia store, list workspace UI, and focused validation coverage; Story 2.2 moved to `review`.
- 2026-04-29: Applied review fixes for filtered-create visibility and first-filter failure recovery, then revalidated with full unit, focused Chromium E2E, and production build coverage.
- 2026-04-29: Applied a final review fix so filter-load errors remain dismissible even after the available tag set drops to zero, then revalidated the focused unit slice and production build.
- 2026-04-29: Acceptance pass completed with no findings; Story 2.2 marked `done` after `npm run test:unit`, focused Chromium E2E coverage, and `npm run build`.
