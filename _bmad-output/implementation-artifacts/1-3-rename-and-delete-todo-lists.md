# Story 1.3: Rename and Delete Todo Lists

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to rename or remove todo lists I no longer need,
so that my workspace stays accurate and manageable.

## Acceptance Criteria

1. Given an existing todo list, when the user renames it with a valid new name, then the updated name is shown in the interface and persisted, and the list remains available for selection and task management.
2. Given an existing todo list, when the user chooses to delete it and confirms the action, then the list is removed from the interface and persistence layer, and any resulting state transition leaves the user in a safe fallback view.
3. Given the deleted list was the active list, when deletion completes, then the application returns the user to a safe fallback state without a broken selection, and developer-accessible operations exist to update and delete todo lists through the application API.

## Tasks / Subtasks

- [x] Extend the list mutation contracts and validation needed for rename/delete flows (AC: 1, 2, 3)
  - [x] Add shared API request types and Zod schemas for list rename/update input without breaking the existing error payload contract.
  - [x] Reuse the Story 1.2 list-name normalization and duplicate-detection rules so create and rename behavior cannot drift.
  - [x] Keep this story scoped to todo-list mutations only; do not invent task-cascade or later-story behavior.
- [x] Implement list update/delete API routes and service or repository support (AC: 1, 2, 3)
  - [x] Add `PATCH /api/lists/[id]` and `DELETE /api/lists/[id]` handlers under `server/api/lists/`.
  - [x] Extend `listRepository` and `listService` with rename and delete operations, not-found handling, and conflict-safe error mapping.
  - [x] Return direct success payloads for rename and a safe success response for delete while preserving `{ error: { code, message, details? } }` on failure.
- [x] Add client-side list mutation actions and fallback behavior in the Pinia boundary (AC: 1, 2, 3)
  - [x] Add `renameList` and `deleteList` store actions with explicit mutation/loading/error state.
  - [x] When the active list is deleted, clear the stale selection and transition the route or store to a safe fallback state.
  - [x] Keep sidebar and workspace data in sync after rename or delete without requiring a full-page reload.
- [x] Add accessible rename/delete UI affordances for saved lists (AC: 1, 2)
  - [x] Add minimal rename and delete interaction surfaces in `app/components/lists/` and `app/pages/lists/[id].vue` that fit the existing visual language.
  - [x] Require explicit confirmation before destructive delete and keep cancel flows side-effect free.
  - [x] Show user-safe validation, conflict, and failure feedback without leaving ambiguous UI state.
- [x] Add verification coverage for list mutation and recovery paths (AC: 1, 2, 3)
  - [x] Extend Vitest integration/API coverage for rename success, duplicate rename conflict, delete success, and not-found handling.
  - [x] Add browser coverage for renaming a list, deleting a list, cancelling delete, and recovering safely after deleting the active list.
  - [x] Preserve deterministic SQLite isolation for all new tests using the Story 1.2 injected-db pattern.

## Dev Notes

- Story 1.3 extends the first persisted list slice from Story 1.2. Keep scope tight: rename and delete todo lists only.
- Do not implement task CRUD, tags, completion history, cross-session active-list restoration, or a broad shared feedback system in this story.
- Preserve the current list-management API, store, error, and testing conventions so Story 1.4 can build on a stable CRUD boundary.

### Previous Story Learnings

- Story 1.2 established the persisted todo-list slice, including the list schema, repository/service split, list store, create/view flows, and focused Vitest/Playwright coverage.
- Use the `~~/` alias for project-root imports from app and server code.
- For isolated API/integration tests, inject a per-test Drizzle client through `event.context.db` via `getEventDb(event)` rather than mutating global `DATABASE_URL` or the shared DB singleton.
- List-name normalization must remain `name.trim().normalize("NFC").toLowerCase()` so duplicate detection behaves consistently across create and rename flows.
- Duplicate-name persistence errors must map to `409 CONFLICT` with user-safe messages and field-specific details.
- Failed or missing active-list loads must clear stale selection safely, and the sidebar should remain visible while the user recovers from a bad route or missing list.
- If rename/delete UI adds client-only interaction controls, keep hydration timing in mind the same way Story 1.2 did for create-list form interactions.

### Current Repository Baseline

- `app/pages/index.vue` already renders the create-list form, saved-list sidebar, and first-list empty-state guidance.
- `app/pages/lists/[id].vue` loads the selected list, renders the same create/sidebar shell, and still shows a placeholder workspace body for Story 1.4 task work.
- `app/components/lists/ListCreateForm.vue` and `app/components/lists/ListSidebar.vue` exist, but there are no rename/delete dialogs or controls yet.
- `app/stores/useListStore.ts` currently supports `loadLists`, `createList`, `loadList`, and `selectList`; there are no list mutation actions beyond create.
- `server/api/lists/` currently contains `index.get.ts`, `index.post.ts`, and `[id].get.ts`; there are no update/delete handlers yet.
- `server/lib/repositories/listRepository.ts` currently supports list retrieval and creation only.
- `server/lib/services/listService.ts` currently exposes list retrieval and create flows, including duplicate-name conflict handling and not-found behavior.
- `shared/types/api.ts` currently defines `TodoList`, `CreateTodoListRequest`, collection types, and shared error contracts only.
- `shared/schemas/index.ts` currently defines `todoListNameSchema`, `createTodoListRequestSchema`, and the basic list boundary schemas; there is no rename/update schema yet.
- `tests/integration/api/lists.spec.ts` and `tests/e2e/list-create-view.spec.ts` currently cover create/view behavior only.

### Technical Requirements

- Use the approved Nuxt full-stack architecture and extend the existing list domain instead of introducing a new service boundary.
- Implement list mutation routes as Nuxt server handlers under `server/api/lists/` using REST-style JSON endpoints:
  - `PATCH /api/lists/[id]`
  - `DELETE /api/lists/[id]`
- Validate rename input at the API boundary with Zod before any persistence logic runs.
- Reuse the existing duplicate-name validation behavior and normalized-name uniqueness guarantees when renaming a list.
- Preserve structured error outcomes with distinct validation, not-found, conflict, and persistence failures.
- When deleting the active list, leave the application in a safe fallback state with no broken route or stale active selection.
- Keep success payloads direct and user-facing failure messages sanitized; do not leak raw exceptions or SQLite internals.
- Do not invent task-related cascade behavior in this story; the current runtime only persists lists, and task flows begin in Story 1.4.

### Architecture Compliance

- Keep API handlers thin; server routes validate input, call services, then return structured JSON.
- Keep domain rules in `server/lib/services/` and persistence operations in `server/lib/repositories/`.
- Continue using camelCase at API boundaries and snake_case only in the database layer.
- All Pinia state changes must happen through store actions; components may dispatch actions but must not mutate store state directly.
- Follow the architecture action naming guidance with verb-led store methods such as `renameList` and `deleteList`.
- Use explicit mutation/loading/error flags consistently (`isLoading`, `isSaving`, `isDeleting`, `loadError`, etc.) and clear stale error state when a new operation starts.
- Keep list-management UI under `app/components/lists/` and route-level behavior under `app/pages/`.
- Preserve accessible confirmation, error, and recovery behavior as part of feature correctness, not optional polish.

### Library / Framework Requirements

- Nuxt routing remains file-based. Use route filenames that align with the architecture examples for list mutations.
- Use Pinia through `@pinia/nuxt` and keep list state changes inside `app/stores/useListStore.ts`.
- Use Zod for request validation at API boundaries and keep shared validators importable from the shared schema layer.
- Reuse the existing Drizzle schema/table model for lists; Story 1.3 should not introduce new database tables.
- Keep Playwright tests under `tests/e2e/` and Vitest integration/API coverage under `tests/integration/`.

### File Structure Requirements

- Existing files expected to be updated in this story:
  - `app/pages/lists/[id].vue`
  - `app/components/lists/ListSidebar.vue`
  - `app/stores/useListStore.ts`
  - `shared/types/api.ts`
  - `shared/schemas/index.ts`
  - `server/lib/repositories/listRepository.ts`
  - `server/lib/services/listService.ts`
  - `tests/integration/api/lists.spec.ts`
- New files likely required in this story:
  - `server/api/lists/[id].patch.ts`
  - `server/api/lists/[id].delete.ts`
  - `app/components/lists/ListRenameDialog.vue`
  - `app/components/lists/ListDeleteDialog.vue`
  - `tests/e2e/list-rename-delete.spec.ts`
- Optional shared UI support should remain minimal. If a reusable confirmation/dialog primitive is introduced, keep it tightly scoped and consistent with the current app shell.

### Testing Requirements

- Relevant QA references for this story include:
  - `TD-API-001` for persisted list CRUD durability
  - `TD-API-005` for rename and delete semantics
  - `TD-E2E-001` for the primary list-management journey anchor
  - `TD-E2E-003` for failure and recovery behavior
- Add API/integration coverage for:
  - valid rename
  - duplicate rename conflict
  - invalid rename input
  - delete success
  - delete not-found behavior
  - active-list fallback behavior after delete
- Add browser coverage for renaming a list, cancelling a delete, confirming a delete, and safely recovering when the active list is deleted.
- Preserve deterministic SQLite isolation and avoid test leakage across runs.

### Existing Files Being Modified - Preserve and Extend

- `app/pages/lists/[id].vue`
  - Preserve the current create/sidebar shell and selected-list workspace route while adding rename/delete affordances for the active list.
- `app/components/lists/ListSidebar.vue`
  - Preserve current navigation, loading, error, and empty-state behavior while extending it with rename/delete controls or triggers.
- `app/stores/useListStore.ts`
  - Extend the existing action-led list state model; do not replace it with direct component fetch logic.
- `shared/types/api.ts`
  - Extend current list contracts for rename/update requests without breaking the existing shared error payload shape.
- `shared/schemas/index.ts`
  - Extend the shared validation surface with list update schemas using the existing list-name rules.
- `server/lib/repositories/listRepository.ts`
  - Add update/delete persistence helpers without bypassing the existing repository boundary.
- `server/lib/services/listService.ts`
  - Add rename/delete domain flows using the existing AppError/error-code conventions.

### Latest Technical Information

- The architecture examples already reserve `ListRenameDialog.vue`, `ListDeleteDialog.vue`, `server/api/lists/[id].patch.ts`, and `server/api/lists/[id].delete.ts` as the intended structure for list mutation work.
- Architecture naming guidance explicitly includes `renameList` as a preferred store action name.
- The architecture expects simple mutations to return direct updated domain objects instead of a wrapped `{ data }` envelope.
- PRD functional requirements `FR3` and `FR4` cover rename/delete list capabilities, and `FR5` keeps list selection continuity in scope.
- The current app already handles missing-list recovery by clearing stale selection in the store; Story 1.3 should extend that safety to explicit delete flows.

### Project Structure Notes

- There is no separate UX specification in the planning artifacts. Use the PRD, architecture, QA handoff, and current runtime code as the source of truth.
- The runtime code does not yet contain a shared confirmation dialog or feedback component library; if one is added here, keep it minimal and aligned with the existing list UI patterns.
- `_bmad/` and `_bmad-output/` remain planning support only and are not part of the runtime architecture.

### References

- [Source: _bmad-output/planning-artifacts/epics.md - Story 1.3: Rename and Delete Todo Lists]
- [Source: _bmad-output/planning-artifacts/architecture.md - API Naming Conventions]
- [Source: _bmad-output/planning-artifacts/architecture.md - State Management Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md - Project Structure]
- [Source: _bmad-output/planning-artifacts/architecture.md - Requirements to Structure Mapping]
- [Source: _bmad-output/planning-artifacts/PRD.md - List Management Functional Requirements]
- [Source: _bmad-output/test-artifacts/test-design-qa.md - TD-API-001]
- [Source: _bmad-output/test-artifacts/test-design-qa.md - TD-API-005]
- [Source: _bmad-output/test-artifacts/test-design-qa.md - TD-E2E-001]
- [Source: _bmad-output/test-artifacts/test-design-qa.md - TD-E2E-003]
- [Source: _bmad-output/test-artifacts/test-design/aine-bmad-todo-handoff.md - Story-Level Integration Guidance]
- [Source: app/pages/lists/[id].vue]
- [Source: app/components/lists/ListSidebar.vue]
- [Source: app/stores/useListStore.ts]
- [Source: shared/types/api.ts]
- [Source: shared/schemas/index.ts]
- [Source: server/lib/repositories/listRepository.ts]
- [Source: server/lib/services/listService.ts]

## Dev Agent Record

### Agent Model Used

GPT-5.4

### Debug Log References

- Story auto-selected from `sprint-status.yaml` as the first backlog item after Story 1.2 reached `done`.
- Planning context loaded from `epics.md`, `architecture.md`, `PRD.md`, and the TEA handoff artifacts.
- Runtime baseline verified against the current post-Story-1.2 code in the app, shared, and server list-management layers.
- Validation commands completed successfully: `npm run test:unit`, `npm run test:e2e -- tests/e2e/list-create-view.spec.ts --project=chromium`, and `npm run build`.

### Completion Notes List

- Added shared rename/delete list contracts, Zod validation, `PATCH`/`DELETE` list handlers, and repository/service support with duplicate-name conflict and not-found error mapping.
- Extended `useListStore` with `renameList` and `deleteList`, preserving explicit mutation state and safe active-list fallback when the current list is removed.
- Added active-workspace rename/delete controls with confirmation and inline validation feedback using new `ListRenameDialog.vue` and `ListDeleteDialog.vue` components.
- Extended list API integration coverage and the existing Chromium E2E journey to cover rename, cancel delete, confirm delete, duplicate-name recovery, and missing-list fallback.
- Validation passed with `npm run test:unit`, focused Chromium Playwright coverage, and `npm run build`; story status is now `review`.

### File List

- \_bmad-output/implementation-artifacts/1-3-rename-and-delete-todo-lists.md
- \_bmad-output/implementation-artifacts/sprint-status.yaml
- app/assets/css/main.css
- app/components/lists/ListDeleteDialog.vue
- app/components/lists/ListRenameDialog.vue
- app/pages/lists/[id].vue
- app/stores/useListStore.ts
- server/api/lists/[id].delete.ts
- server/api/lists/[id].patch.ts
- server/lib/repositories/listRepository.ts
- server/lib/services/listService.ts
- shared/schemas/index.ts
- shared/types/api.ts
- tests/e2e/list-create-view.spec.ts
- tests/fixtures/lists.ts
- tests/integration/api/lists.spec.ts

## Change Log

- 2026-04-28: Story created and marked `ready-for-dev`.
- 2026-04-28: Implemented rename/delete list support, completed validation, and moved story to `review`.
- 2026-04-28: Focused Epic 1 closeout validation passed with `npm run test:unit`, focused Chromium E2E coverage, and `npm run build`; story marked `done`.
