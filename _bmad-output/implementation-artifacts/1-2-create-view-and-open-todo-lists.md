# Story 1.2: Create, View, and Open Todo Lists

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to create named todo lists, see all available lists, and open a selected list,
so that I can organize different areas of work in separate spaces.

## Acceptance Criteria

1. Given no todo lists exist, when the user opens the application, then the application shows a clear empty state with an action to create the first list, and the user is not left on a blank or broken screen.
2. Given the user provides a valid list name, when the user saves the new list, then the list is persisted and displayed in the list collection, and the list can be selected as the active workspace.
3. Given the user provides an empty, duplicate, or otherwise invalid list name, when the user attempts to save the list, then the list is not persisted, and the interface explains how to correct the problem without leaving the user in an ambiguous state.
4. Given one or more lists exist, when the user selects a list, then that list opens as the active workspace for task management, and developer-accessible operations exist to create, retrieve, and list todo lists through the application API.

## Tasks / Subtasks

- [x] Add the list domain contracts and persistence model needed for the first real feature slice (AC: 2, 4)
  - [x] Define the `todo_lists` SQLite schema in `db/schema/todoLists.ts` and export it from `db/schema/index.ts` using snake_case columns and a durable primary key
  - [x] Generate the first committed Drizzle migration for list persistence and keep the migration flow aligned with `npm run db:generate` and `npm run db:migrate`
  - [x] Extend the shared types and schemas for list requests, list responses, and list validation without breaking the existing shared API/error helpers
- [x] Implement list API routes with thin handlers and consistent error contracts (AC: 2, 3, 4)
  - [x] Add `GET /api/lists`, `POST /api/lists`, and `GET /api/lists/[id]` handlers under `server/api/lists/`
  - [x] Add supporting `listRepository`, `listService`, and `listMapper` modules so route handlers do not talk to Drizzle directly
  - [x] Validate list input at the API boundary with Zod, reject duplicate or invalid names with stable error codes, and return direct success payloads plus `{ error: { code, message, details? } }` on failure
- [x] Add client-side list state management and selection flow with the approved Pinia boundary (AC: 2, 4)
  - [x] Create `app/stores/useListStore.ts` with action-led state transitions such as `loadLists`, `createList`, and `selectList`
  - [x] Fetch lists through API calls rather than direct persistence access, and keep loading, mutation, and error state explicit in the store
  - [x] Treat opening a list as a routed workspace transition that lands the user on `app/pages/lists/[id].vue`
- [x] Replace the root placeholder content with the first usable list-management UI (AC: 1, 2, 3, 4)
  - [x] Update `app/pages/index.vue` to show the list collection experience rather than the Story 1.1 foundation panel
  - [x] Add the list UI components needed for this story in `app/components/lists/`, including a create form and a collection/navigation surface
  - [x] Show a clear empty state CTA when no lists exist, accessible validation feedback for invalid input, and a reliable path to open a selected list
- [x] Keep the first usable list flow accessible, responsive, and testable (AC: 1, 2, 3, 4)
  - [x] Preserve keyboard operability, semantic labels, visible focus states, and mobile-safe layout behavior for list creation and selection
  - [x] Add stable `data-testid` hooks for at least `list-create-button`, `list-name-input`, `list-nav-item`, and the relevant empty/loading/error surfaces used by this story
  - [x] Avoid implementing rename/delete list behavior or task CRUD early; those belong to Stories 1.3 through 1.5
- [x] Add verification coverage for the list feature slice and its failure boundaries (AC: 1, 2, 3, 4)
  - [x] Add unit or integration coverage for list-name validation and repository/service persistence behavior with deterministic SQLite test isolation
  - [x] Add API coverage for create, fetch one, and fetch collection list flows, including invalid and duplicate-name cases
  - [x] Add a Playwright scenario covering empty state, first-list creation, list visibility, and opening the selected list workspace

### Review Findings

- [x] [Review][Patch] Duplicate creates can return `500` instead of `409 CONFLICT` [server/lib/services/listService.ts:43]
- [x] [Review][Patch] Test list fixtures mutate global `DATABASE_URL` state across runs [tests/fixtures/lists.ts:22]
- [x] [Review][Patch] Failed list loads keep a stale active selection in store state [app/stores/useListStore.ts:110]
- [x] [Review][Patch] List-name normalization is unstable for locale and Unicode edge cases [server/lib/services/listService.ts:15]
- [x] [Review][Patch] Malformed JSON request bodies surface as `500` errors [server/api/lists/index.post.ts:13]
- [x] [Review][Patch] Invalid non-empty list names lose field-specific correction in the UI [app/stores/useListStore.ts:13]

## Dev Notes

- This story is the first feature implementation after foundation setup. Keep the scope tight: create, view, and open todo lists only.
- Do not implement rename/delete list flows, task creation, task editing, filtering, completion, history, or broad global feedback systems in this story.
- Story 1.1 is currently in `review`, not `done`. Preserve its shell, tooling, and conventions while extending the repo for the first usable product workflow.

### Previous Story Learnings

- Story 1.1 established the Nuxt shell, database client, shared error helpers, test tooling, and the top-level folder structure.
- Because this repo uses Nuxt's `app/` source layout, imports from app/server code to project-root modules such as `shared/` should use the `~~/` alias rather than `~/`.
- Nested app components are auto-imported with directory prefixes in Nuxt, so component usage should follow the generated names instead of assuming flat naming.
- `npm run preview` is only meaningful after a fresh `npm run build`; do not use forwarded preview CLI arguments as a substitute for validating the actual package script.

### Current Repository Baseline

- `app/app.vue` already renders `NuxtRouteAnnouncer`, `NuxtLoadingIndicator`, `LayoutAppShell`, and `NuxtPage`.
- `app/components/layout/AppShell.vue` provides the current shell wrapper and navigation between `/` and `/history`.
- `app/pages/index.vue` still renders the Story 1.1 foundation placeholder panel and must be replaced by the first list-management experience in this story.
- `app/pages/lists/[id].vue` already exists as a placeholder route and should become the active list workspace entry point once a list is selected.
- `app/components/lists/` currently contains only `.gitkeep`; there are no real list UI components yet.
- `app/stores/` currently contains only `.gitkeep`; there is no list store yet.
- `server/api/lists/` currently contains only `.gitkeep`; the list API is not implemented.
- `server/lib/errors/AppError.ts`, `server/lib/errors/errorCodes.ts`, and `server/lib/utils/http.ts` already define the baseline structured error pattern.
- `shared/types/api.ts` currently defines only the generic collection and error contracts and must be extended for list payloads.
- `shared/schemas/index.ts` currently contains only base schemas (`entityIdSchema`, `isoTimestampSchema`, `nonEmptyTrimmedStringSchema`).
- `db/client.ts` already initializes SQLite and Drizzle from `DATABASE_URL`, while `db/schema/index.ts` remains an empty placeholder.

### Technical Requirements

- Use the approved Nuxt full-stack architecture rather than introducing a separate frontend/backend split.
- Persist lists in SQLite via Drizzle with committed migration files. The initial list persistence model should use the `todo_lists` table with snake_case column names.
- At minimum, the list model needs an `id`, `name`, and `created_at` boundary that can be returned to the client as camelCase.
- Implement the list API as Nuxt server routes under `server/api/lists/` with REST-style JSON endpoints:
  - `GET /api/lists`
  - `POST /api/lists`
  - `GET /api/lists/[id]`
- Return direct success payloads. For collections, use `{ items, total }` only when collection metadata is needed.
- Validate user-provided list names before persistence logic runs. Empty, whitespace-only, duplicate, or otherwise invalid names must not be persisted.
- Use UTC ISO 8601 timestamps at application boundaries.
- Keep a deterministic test-isolation approach for SQLite-based API and integration coverage. Prefer a per-test database strategy or another explicitly documented isolated approach.

### Architecture Compliance

- Keep API handlers thin and delegate domain rules to `server/lib/services/` and persistence access to `server/lib/repositories/`.
- Client code must not access SQLite or Drizzle directly.
- Use camelCase in API JSON and snake_case only in the database layer, with explicit mapping at the persistence boundary.
- All Pinia state changes must happen through store actions; do not mutate store state directly from components.
- Preserve the existing structured error families and use distinct error outcomes for validation, not-found, conflict, and persistence failures.
- Treat clear empty, loading, and error states as part of the feature behavior, not optional polish.

### Library / Framework Requirements

- Nuxt routing should remain file-based. Opening a selected list should align with the existing routed workspace pattern under `app/pages/lists/[id].vue`.
- Use Pinia through `@pinia/nuxt` and keep stores in `app/stores/` with `useXxxStore` naming.
- Use Zod validation at the API boundary and keep shared validators importable from the shared schema layer.
- Use Drizzle schema modules under `db/schema/` and formal migrations under `db/migrations/`.
- Keep Playwright tests under `tests/e2e/` and Vitest-based API/integration coverage under `tests/integration/`.

### File Structure Requirements

- Existing files expected to be updated in this story:
  - `app/pages/index.vue`
  - `app/pages/lists/[id].vue`
  - `shared/types/api.ts`
  - `shared/schemas/index.ts` and/or new domain schema files under `shared/schemas/`
  - `shared/constants/ui.ts` only if new list-specific copy is needed
  - `db/schema/index.ts`
- New files likely required in this story:
  - `db/schema/todoLists.ts`
  - `server/api/lists/index.get.ts`
  - `server/api/lists/index.post.ts`
  - `server/api/lists/[id].get.ts`
  - `server/lib/repositories/listRepository.ts`
  - `server/lib/services/listService.ts`
  - `server/lib/mappers/listMapper.ts`
  - `app/stores/useListStore.ts`
  - `app/components/lists/ListSidebar.vue`
  - `app/components/lists/ListCreateForm.vue`
  - Additional minimal list/feedback components only if they directly support this story's scope
- Test files likely required in this story:
  - `tests/integration/api/lists.spec.ts` or another equivalently scoped list API suite
  - `tests/fixtures/lists.ts`
  - `tests/e2e/list-create-view.spec.ts`

### Testing Requirements

- This story should cover the first real persistence-backed API slice, so test durability matters more than cosmetic depth.
- Relevant TEA test references for this story include:
  - `TD-UNIT-001` for validation and safe error shaping
  - `TD-API-001` for list CRUD persistence behavior
  - `TD-E2E-001` for the first browser-level core journey anchor
- Add API-level coverage for valid creation, invalid creation, duplicate-name rejection, collection retrieval, and single-list retrieval.
- Add a browser test for the empty-state-to-first-list flow and opening the selected list workspace.
- Ensure test data cleanup is deterministic and does not leak persisted SQLite state across runs.

### Existing Files Being Modified - Preserve and Extend

- `app/app.vue`
  - Keep the shell mount structure intact unless a route-level need requires a minimal adjustment.
- `app/components/layout/AppShell.vue`
  - Preserve the shell role and route framing; only adjust if the list experience needs a shell-safe navigation refinement.
- `app/pages/index.vue`
  - Replace the foundation placeholder with the list-management experience for empty and populated list states.
- `app/pages/lists/[id].vue`
  - Replace the placeholder with the selected-list workspace entry state, but do not implement full task CRUD yet.
- `shared/types/api.ts`
  - Extend the existing API contracts without breaking the established error payload shape.
- `shared/schemas/index.ts`
  - Extend the shared validation surface with list-specific schemas or export paths.
- `db/client.ts`
  - Reuse as-is; do not bypass or replace the established database bootstrap pattern.
- `db/schema/index.ts`
  - Convert from placeholder export to a real schema barrel once the list table is introduced.

### Latest Technical Information

- The architecture explicitly maps list management to `app/components/lists/`, `app/pages/index.vue`, `server/api/lists/`, `server/lib/services/listService.ts`, `server/lib/repositories/listRepository.ts`, and `db/schema/todoLists.ts`.
- The architecture's project structure examples already name `ListSidebar.vue`, `ListCreateForm.vue`, and `useListStore.ts` as the intended list-flow locations.
- TEA handoff guidance recommends stable `data-testid` hooks including `list-create-button`, `list-name-input`, and `list-nav-item` for this feature area.
- The PRD requires the first-time user to understand how to create named lists without onboarding, and it treats clear empty, loading, and error states as core product behavior.
- The test-design artifacts treat persisted list integrity as a P0 risk area, so API-level durability checks are part of the quality bar for this story.

### Project Structure Notes

- No standalone UX document exists. Use the PRD and architecture as the source of truth for list creation clarity, empty-state behavior, accessibility, and responsive expectations.
- `tests/integration/` and `tests/fixtures/` now exist only as tracked directories; this story should establish the first real test files under those locations.
- `server/api/lists/`, `app/components/lists/`, and `app/stores/` are present only as tracked placeholders and should now become real implementation areas.

### References

- [Source: _bmad-output/planning-artifacts/epics.md - Story 1.2: Create, View, and Open Todo Lists]
- [Source: _bmad-output/planning-artifacts/architecture.md - Database Naming Conventions]
- [Source: _bmad-output/planning-artifacts/architecture.md - API Naming Conventions]
- [Source: _bmad-output/planning-artifacts/architecture.md - Project Structure & Boundaries]
- [Source: _bmad-output/planning-artifacts/architecture.md - Requirements to Structure Mapping]
- [Source: _bmad-output/planning-artifacts/PRD.md - Product Vision]
- [Source: _bmad-output/planning-artifacts/PRD.md - List Management]
- [Source: _bmad-output/test-artifacts/test-design-qa.md - TD-API-001]
- [Source: _bmad-output/test-artifacts/test-design/aine-bmad-todo-handoff.md - Data-TestId Requirements]
- [Source: app/app.vue]
- [Source: app/components/layout/AppShell.vue]
- [Source: app/pages/index.vue]
- [Source: app/pages/lists/[id].vue]
- [Source: shared/types/api.ts]
- [Source: shared/schemas/index.ts]
- [Source: db/client.ts]
- [Source: db/schema/index.ts]

## Dev Agent Record

### Agent Model Used

GPT-5.4

### Debug Log References

- Story auto-selected from `sprint-status.yaml` after Story 1.1 reached `review`.
- Validation commands completed successfully: `npm run db:generate`, `npm run db:migrate`, `npm run test:unit`, `npm run test:e2e`, `npm run build`.
- E2E follow-up fixes applied during implementation: Nuxt nested component auto-import prefixes, hydration-safe list creation controls, isolated Playwright database migration bootstrap, and strict-locator-safe workspace assertions.

### Completion Notes List

- Added shared todo-list validation/types, a `todo_lists` SQLite schema, a committed Drizzle migration, and a resettable database client to support isolated integration and browser tests.
- Implemented list mapper, repository, service, and Nuxt API routes with structured validation, conflict handling, and direct JSON success payloads for create, fetch-one, and fetch-collection flows.
- Added the Pinia list store, create form, list sidebar, routed workspace pages, and CSS for the first usable list-management experience, including empty, loading, error, and selected-workspace states.
- Hardened the create-list UX for hydration timing by disabling controls until mount and by ensuring the isolated Playwright database is migrated before the E2E dev server starts.
- Added deterministic Vitest fixtures and API integration coverage plus a Chromium E2E journey for empty-state creation, list navigation, and duplicate-name validation.
- Applied review hardening for duplicate-create races, Unicode-safe normalization, malformed JSON validation, injected test databases, field-level validation feedback, and missing-list recovery behavior.
- Final validation passed with `npm run test:unit`, focused `npm run test:e2e -- tests/e2e/list-create-view.spec.ts --project=chromium`, and `npm run build` after the Story 1.2 review fixes.

### File List

- \_bmad-output/implementation-artifacts/1-2-create-view-and-open-todo-lists.md
- \_bmad-output/implementation-artifacts/sprint-status.yaml
- app/assets/css/main.css
- app/components/lists/ListCreateForm.vue
- app/components/lists/ListSidebar.vue
- app/pages/index.vue
- app/pages/lists/[id].vue
- app/stores/useListStore.ts
- db/client.ts
- db/migrations/0000_dashing_guardsmen.sql
- db/migrations/meta/0000_snapshot.json
- db/migrations/meta/\_journal.json
- db/schema/index.ts
- db/schema/todoLists.ts
- package-lock.json
- package.json
- playwright.config.ts
- server/api/lists/[id].get.ts
- server/api/lists/index.get.ts
- server/api/lists/index.post.ts
- server/lib/mappers/listMapper.ts
- server/lib/repositories/listRepository.ts
- server/lib/services/listService.ts
- server/lib/utils/database.ts
- server/lib/utils/http.ts
- shared/schemas/index.ts
- shared/types/api.ts
- tests/e2e/list-create-view.spec.ts
- tests/fixtures/lists.ts
- tests/integration/api/lists.spec.ts
- vitest.config.ts

## Change Log

- 2026-04-28: Story created and marked `ready-for-dev`.
- 2026-04-28: Review patches applied and Story 1.2 marked `done` after focused regression validation and build verification.
- 2026-04-28: Implemented Story 1.2 list persistence, API routes, store, routed UI, integration tests, and browser coverage; story is now `review`.
