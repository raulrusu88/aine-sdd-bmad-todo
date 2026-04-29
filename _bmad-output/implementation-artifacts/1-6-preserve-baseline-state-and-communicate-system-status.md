# Story 1.6: Preserve Baseline State and Communicate System Status

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want my workspace state preserved across refreshes and I want clear loading, empty, and success feedback,
so that I can trust the application during normal daily use.

## Acceptance Criteria

1. Given lists and tasks have already been saved, when the user refreshes the application, then the previously saved lists and tasks are loaded back into the workspace, and the active workspace remains consistent with the persisted data.
2. Given list or task data is being loaded, when the relevant screen is displayed, then the interface shows a clear loading state until the data is ready, and loading indicators are removed once the operation completes.
3. Given no lists or no tasks exist in the current context, when the relevant screen is displayed, then the interface shows a clear empty state rather than a blank or broken view, and the empty state helps the user understand the next useful action.
4. Given the user successfully creates, updates, or deletes a list or task, when the operation completes, then the interface shows clear success feedback for that action, and the feedback does not obscure the resulting persisted state.

## Tasks / Subtasks

- [x] Preserve refresh-safe workspace restoration across root and list routes (AC: 1)
  - [x] Audit the current `callOnce` plus route-driven loading flow in `app/pages/index.vue` and `app/pages/lists/[id].vue` so refresh behavior consistently restores lists, the active workspace, and list-scoped tasks from persisted data.
  - [x] Tighten list/task store coordination where needed so a refreshed `[id]` route resolves to a valid active workspace or a safe fallback state without stale selection.
  - [x] Keep restore behavior grounded in the persisted API plus route state; do not add speculative client-only persistence that could drift from the source of truth.
- [x] Standardize loading and empty-state communication in the current workspace surfaces (AC: 2, 3)
  - [x] Reuse or introduce explicit feedback components under `app/components/feedback/` only where it reduces duplication across list/task/root workspace states.
  - [x] Ensure list sidebar, task workspace, and root workspace loading and empty states remain accessible, visible, and cleared as soon as the relevant request completes.
  - [x] Preserve existing `data-testid` hooks and add any missing stable hooks needed for shared loading and empty-state assertions.
- [x] Add success feedback for list and task mutations without obscuring resulting state (AC: 4)
  - [x] Introduce a clear, accessible success-notice pattern for successful create, update, and delete flows across lists and tasks.
  - [x] Wire success feedback through store actions or a shared UI feedback seam only if the behavior is broad enough to justify shared state; otherwise keep the scope local and explicit.
  - [x] Ensure success feedback coexists cleanly with existing validation and recovery-safe error messaging from prior stories.
- [x] Add verification coverage for refresh persistence and feedback states (AC: 1, 2, 3, 4)
  - [x] Extend browser coverage to prove refresh-safe restoration of persisted list/task state and visible success feedback after representative mutations.
  - [x] Add focused integration, unit, or component coverage for loading, empty, and success-state rendering using the current Vitest/Playwright split.
  - [x] Keep mutable browser journeys serialized inside the existing list/task flow rather than creating competing stateful E2E specs.

## Dev Notes

- Story 1.6 closes the last Epic 1 trust gap around everyday usage: refresh continuity plus clear system-status communication.
- Do not implement tags, completion state, completed-task history, health endpoints, or later-session persistence beyond the current persisted list/task slice. Those belong to later stories and epics.
- Treat refresh continuity as persisted data reconciliation, not a new local cache feature. The route and API should remain the source of truth for the active workspace.

### Previous Story Learnings

- Story 1.5 added full task mutation support plus scoped per-task failure handling inside the list workspace.
- Task update/delete responses now stay scoped to the active list and ignore late responses after `resetTasks()` or route changes; Story 1.6 must preserve that state model while adding refresh and success feedback behavior.
- `useListStore` and `useTaskStore` already follow the project pattern of action-only Pinia mutations plus structured API error extraction; continue extending those stores instead of moving domain state into components.
- The existing mutable Chromium journey in `tests/e2e/list-create-view.spec.ts` is already the main list/task browser path. Extend that journey for refresh and success feedback rather than adding a competing mutable spec.

### Current Repository Baseline

- `app/pages/index.vue` already calls `loadLists()` through `callOnce` and renders a root empty state or a prompt to open a saved list, so root-level persistence and empty-state behavior are partially established.
- `app/pages/lists/[id].vue` already reloads the selected list and its tasks on entry, which means refresh restoration for an existing list route is partially present today.
- `app/components/lists/ListSidebar.vue` and `app/components/tasks/TaskList.vue` already render dedicated loading, error, and empty-state messages, but the patterns are duplicated and there is no shared feedback component layer yet.
- `app/stores/useListStore.ts` and `app/stores/useTaskStore.ts` already expose `isLoading`, mutation flags, and structured error state, but neither store currently publishes success feedback for completed mutations.
- `app/components/layout/AppShell.vue` currently renders only static shell copy and navigation, with no global success or system-status surface.
- `shared/constants/ui.ts` still describes the Story 1.1 foundation shell, and `app/pages/history.vue` remains a placeholder for a later epic.
- Current browser coverage proves list/task CRUD and recovery paths, but it does not yet assert refresh restoration or success notices.

### Technical Requirements

- Preserve the existing server-backed persistence model for lists and tasks across browser refreshes without introducing a separate persistence mechanism such as localStorage mirroring or client-only snapshots.
- Keep refresh restoration route-aware: the root route should remain safe when no active list is selected, and the `[id]` route should restore the requested workspace when persisted data exists.
- Use explicit loading and empty-state communication for list and task surfaces, and ensure indicators are removed immediately after success or failure paths complete.
- Add clear, user-safe success feedback for successful create, update, and delete flows on lists and tasks.
- Do not weaken the current structured error payloads or per-task/per-list recovery semantics while adding success notices.

### Architecture Compliance

- Keep Pinia as the only path for client state transitions; components may render feedback state but must not own persisted list/task truth.
- Follow the architecture guidance for feature-oriented feedback components under `app/components/feedback/` if shared feedback extraction becomes worthwhile.
- Reuse the existing direct-success API payloads and structured error payloads rather than inventing a new response envelope for UI feedback.
- Preserve route-shell responsibilities in `app/pages/index.vue` and `app/pages/lists/[id].vue`, with domain coordination still owned by the list and task stores.
- If shared UI feedback becomes broad enough to justify a dedicated store, follow the architecture note that a `useUiFeedbackStore` is optional rather than mandatory.

### Library / Framework Requirements

- Nuxt routing remains file-based; refresh continuity should work through the existing page routes, async page setup, and navigation semantics.
- Use Pinia through `@pinia/nuxt` for any shared success-feedback or restore-state coordination.
- Keep browser acceptance in Playwright and fast feedback in Vitest; do not move this story into a purely manual verification flow.
- Continue using stable `data-testid` hooks for loading, empty, error, and success surfaces.

### File Structure Requirements

- Existing files expected to be updated in this story:
  - `app/pages/index.vue`
  - `app/pages/lists/[id].vue`
  - `app/components/layout/AppShell.vue`
  - `app/components/lists/ListSidebar.vue`
  - `app/components/tasks/TaskList.vue`
  - `app/stores/useListStore.ts`
  - `app/stores/useTaskStore.ts`
  - `shared/constants/ui.ts`
  - `tests/e2e/app-shell.spec.ts`
  - `tests/e2e/list-create-view.spec.ts`
- New files likely required in this story:
  - `app/components/feedback/LoadingState.vue`
  - `app/components/feedback/EmptyState.vue`
  - `app/components/feedback/SuccessNotice.vue`
  - A focused UI feedback store under `app/stores/` only if the success-notice state becomes shared enough to justify it

### Testing Requirements

- Relevant QA references for this story include:
  - `TD-API-001` for persisted list state
  - `TD-API-002` for persisted task state
  - `TD-COMP-002` for loading, empty, success, and error rendering
  - `TD-E2E-001` for the refresh-safe core journey
  - `TD-E2E-002` for accessible state communication
- Add browser coverage for:
  - restoring saved lists and tasks after a browser refresh on the active list route
  - showing and clearing loading states during initial list/task fetches
  - visible empty states when no lists or no tasks exist
  - clear success notices after representative list/task create, update, and delete actions
- Add focused unit, integration, or component coverage for any shared feedback-state abstraction introduced in this story.
- Preserve deterministic SQLite isolation and keep mutable stateful E2E coverage inside the existing Chromium list/task journey.

### Existing Files Being Modified - Preserve and Extend

- `app/pages/index.vue`
  - Preserve the current first-list empty state and saved-list prompt while improving restore and status communication.
- `app/pages/lists/[id].vue`
  - Preserve the live list workspace, route watching, and current list/task coordination while adding refresh-trust and success-feedback behavior.
- `app/components/lists/ListSidebar.vue`
  - Preserve the current loading/error/empty states and active-link semantics while aligning them with any shared feedback patterns.
- `app/components/tasks/TaskList.vue`
  - Preserve the current task list rendering and status messages while aligning them with any extracted feedback components.
- `app/stores/useListStore.ts` and `app/stores/useTaskStore.ts`
  - Preserve current CRUD and recovery behavior while adding success-feedback support and any required refresh-state refinements.
- `app/components/layout/AppShell.vue`
  - Preserve the shell layout and navigation while exposing any shared system-status surface in a way that does not overpower the workspace.

### Latest Technical Information

- The current root and list pages already reload persisted list/task data on entry, so Story 1.6 should refine and prove that behavior rather than rebuilding persistence fundamentals.
- Current list and task loading flags already exist (`isLoading` plus mutation booleans), which aligns with the architecture’s loading-state guidance.
- The architecture explicitly reserves `app/components/feedback/` for shared loading, empty, and success-notice components and treats a `useUiFeedbackStore` as optional.
- Success responses from current list/task endpoints already return direct payloads, which is sufficient for client-side success messaging without changing API contracts.
- Existing browser tests already use stable `data-testid` hooks such as `empty-state`, `error-banner`, and list/task-specific status surfaces; Story 1.6 can extend that pattern with `success-notice` and any missing loading-state hooks.

### Project Structure Notes

- There is still no standalone UX specification. Use the epics file, PRD, architecture, TEA handoff, and current runtime code as the source of truth.
- Story 1.6 should finish Epic 1’s baseline continuity and status communication concerns without pre-implementing Epic 2 tag/status features or Epic 3 history retrieval.
- `_bmad/` and `_bmad-output/` remain planning support only and are not part of the runtime architecture.

### References

- [Source: _bmad-output/planning-artifacts/epics.md - Story 1.6: Preserve Baseline State and Communicate System Status]
- [Source: _bmad-output/planning-artifacts/PRD.md - persistence and state communication requirements]
- [Source: _bmad-output/planning-artifacts/architecture.md - feedback state component structure]
- [Source: _bmad-output/planning-artifacts/architecture.md - Pinia and loading-state patterns]
- [Source: _bmad-output/test-artifacts/test-design-qa.md - TD-COMP-002]
- [Source: _bmad-output/test-artifacts/test-design/aine-bmad-todo-handoff.md - Story-Level Integration Guidance]
- [Source: app/pages/index.vue]
- [Source: app/pages/lists/[id].vue]
- [Source: app/components/layout/AppShell.vue]
- [Source: app/components/lists/ListSidebar.vue]
- [Source: app/components/tasks/TaskList.vue]
- [Source: app/stores/useListStore.ts]
- [Source: app/stores/useTaskStore.ts]
- [Source: app/pages/history.vue]
- [Source: shared/constants/ui.ts]
- [Source: tests/e2e/app-shell.spec.ts]
- [Source: tests/e2e/list-create-view.spec.ts]

## Dev Agent Record

### Agent Model Used

GPT-5.4

### Debug Log References

- Story 1.6 was selected from `sprint-status.yaml` as the next backlog item after Story 1.5 remained in `review`.
- Planning context was pulled from the Epic 1 story definition, PRD persistence/feedback requirements, architecture guidance for feedback components and loading-state patterns, and TEA QA handoff references.
- Runtime baseline was reloaded from the live root page, list workspace route, list/task stores, current feedback surfaces, shell components, and existing E2E coverage before packaging this story.
- Implementation introduced a shared `useUiFeedbackStore`, reusable feedback components, route-safe non-blocking restore flows on the root and list pages, and shell-level success notices for list and task mutations.
- Browser coverage was extended with focused shell loading assertions plus refresh and success-notice checks inside the mutable Chromium list/task journey.

### Completion Notes List

- Added shared loading, empty, and success feedback components under `app/components/feedback/` plus a `useUiFeedbackStore` to publish shell-level success notices without changing API response contracts.
- Updated the root and list pages to restore persisted state without blocking first render, which makes loading states visible while still rehydrating the saved workspace and list-scoped tasks safely.
- Wired list and task create/update/delete flows to clear stale success notices on new attempts and publish accessible success feedback after successful mutations.
- Updated shell copy, feedback styling, and task/list surfaces so the current UI communicates restore, loading, empty, and success states consistently.
- Added focused Vitest coverage for the UI feedback store and extended Playwright coverage for loading feedback, refresh restoration, and success notices.
- Followed up on review finding 1 by ignoring late task-create results after route changes so stale success notices and task state do not leak into the next workspace.
- Followed up on review findings 2 and 3 by suppressing shared empty states when load errors are active and clearing stale success notices when users switch workspaces.
- Followed up on the final review pass by clearing shell-level success notices on any route change and replacing the temporary source-level empty-state guard test with runtime browser coverage.
- Followed up on the last remaining review finding by scoping task item update/delete success notices to the active route and extending the browser journey to prove those notices do not leak onto the root workspace.
- Validation completed with `npm run test:unit`, `npm run test:e2e -- tests/e2e/app-shell.spec.ts tests/e2e/list-create-view.spec.ts --project=chromium`, and `npm run build`.
- Follow-up validation completed with `npm run test:unit -- tests/integration/task-store.spec.ts` and `npm run test:e2e -- tests/e2e/list-create-view.spec.ts --project=chromium`.
- Additional follow-up validation completed with `npm run test:e2e -- tests/e2e/app-shell.spec.ts tests/e2e/list-create-view.spec.ts --project=chromium`.
- Final follow-up validation completed with `npm run test:e2e -- tests/e2e/list-create-view.spec.ts --project=chromium`.

### File List

- app/assets/css/main.css
- app/components/feedback/EmptyState.vue
- app/components/feedback/LoadingState.vue
- app/components/feedback/SuccessNotice.vue
- app/pages/index.vue
- app/pages/lists/[id].vue
- app/components/layout/AppShell.vue
- app/components/lists/ListSidebar.vue
- app/components/tasks/TaskList.vue
- app/components/tasks/TaskItem.vue
- app/stores/useListStore.ts
- app/stores/useTaskStore.ts
- app/stores/useUiFeedbackStore.ts
- tests/integration/task-store.spec.ts
- shared/constants/ui.ts
- tests/integration/ui-feedback-store.spec.ts
- tests/e2e/app-shell.spec.ts
- tests/e2e/list-create-view.spec.ts
- \_bmad-output/implementation-artifacts/1-6-preserve-baseline-state-and-communicate-system-status.md
- \_bmad-output/implementation-artifacts/sprint-status.yaml

## Change Log

- 2026-04-28: Story created and marked `ready-for-dev`.
- 2026-04-28: Refresh-safe restore flows, shared feedback states, success notices, and validation coverage implemented; story moved to `review`.
- 2026-04-28: Review follow-up fixed stale task-create success after navigation and added targeted store/browser regression coverage.
- 2026-04-28: Review follow-up suppressed empty-state guidance during load errors and cleared stale success notices on workspace switches.
- 2026-04-28: Final review follow-up cleared shell-level stale success notices on route changes and replaced the temporary source-inspection regression with runtime browser coverage.
- 2026-04-28: Final review follow-up scoped task item success notices to the active route and added route-leak browser regression coverage for task update/delete feedback.
- 2026-04-28: Final closeout review passed with no findings; Story 1.6 marked `done` after focused Chromium regression validation.
