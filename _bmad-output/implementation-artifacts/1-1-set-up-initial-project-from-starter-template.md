# Story 1.1: Set Up Initial Project from Starter Template

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a maintainer,
I want the project bootstrapped with the approved installation flow, dependencies, configuration, and folder structure,
so that all later stories are built on a consistent, runnable foundation.

## Acceptance Criteria

1. Given the current repository and approved architecture, when the maintainer installs dependencies and starts the development environment, then the application runs successfully using the approved stack and baseline scripts, and the baseline application shell renders without runtime errors.
2. Given the approved architecture decisions, when the foundation story is completed, then the repository contains the planned top-level application structure for app, server, shared, db, and tests, and the root configuration needed for Nuxt, TypeScript, database migrations, testing, and environment examples is present and consistent with the architecture.

## Tasks / Subtasks

- [x] Audit and extend the existing Nuxt starter baseline without breaking the current scaffold (AC: 1, 2)
  - [x] Preserve the current project name, npm-based workflow, existing Nuxt/Vue dependencies, and the `postinstall` `nuxt prepare` hook while adding the approved stack dependencies and supporting scripts in `package.json`
  - [x] Extend `nuxt.config.ts` with the approved module and app-level configuration additions without removing the current `compatibilityDate` or devtools settings
  - [x] Keep `tsconfig.json` aligned with Nuxt-generated references and avoid editing any generated `.nuxt` TypeScript files directly
- [x] Create the approved root configuration and environment foundation (AC: 2)
  - [x] Add `drizzle.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `.env.example`, `Dockerfile`, and `.dockerignore`
  - [x] Add migration and test scripts that align with formal migrations, Vitest, and Playwright rather than ad hoc commands
- [x] Establish the planned runtime folder structure with scaffold-ready placeholder files (AC: 2)
  - [x] Create the top-level `server/`, `shared/`, `db/`, and `tests/` directories plus the planned `app/` subdirectories from the architecture
  - [x] Add minimal placeholder exports or setup files where needed so git tracks the structure and later stories do not have to re-decide file locations
- [x] Replace the generic Nuxt welcome shell with a baseline routed app shell (AC: 1, 2)
  - [x] Update `app/app.vue` to remove `NuxtWelcome`, preserve `NuxtRouteAnnouncer`, and render the baseline application shell for routed pages
  - [x] Add `app/assets/css/main.css` with minimal accessible defaults and wire it into Nuxt
- [x] Prepare database, shared boundary, and testing foundations without over-implementing feature behavior (AC: 2)
  - [x] Add `db/client.ts`, `db/schema/index.ts`, `db/migrations/`, `shared/schemas/index.ts`, `shared/types/api.ts`, `shared/constants/ui.ts`, and `tests/setup/vitest.setup.ts`
  - [x] Scaffold the top-level integration, e2e, and fixture test directories without implementing Story 1.2+ feature logic early
- [x] Update developer-facing documentation for the new baseline (AC: 1, 2)
  - [x] Replace the generic Nuxt starter README content with project-specific setup, migration, test, build, preview, and Docker instructions
  - [x] Document any required environment variables and the expected local database location conventions
- [x] Verify the starter foundation is coherent and runnable (AC: 1)
  - [x] Confirm `npm install`, `npm run dev`, `npm run build`, and `npm run preview` remain valid after the setup changes
  - [x] Confirm the baseline shell loads without runtime errors and the created structure is ready for later list, task, filtering, history, and test stories

## Dev Notes

- This is a foundation/setup story only. Do not implement list CRUD, task CRUD, filters, history, or final UI behavior in this story. The output is a runnable scaffold plus the approved project structure and root tooling.
- This is the first story in the first epic. There are no previous story learnings, no established implementation patterns beyond the current scaffold, and no git commit history yet.

### Current Repository Baseline

- The repo already uses Nuxt `4.4.2` with Vue `3.5.33` and `vue-router` `5.0.6` in `package.json`.
- Current scripts are `dev`, `build`, `generate`, `preview`, and `postinstall`, where `postinstall` runs `nuxt prepare`. Preserve these scripts and extend them rather than replacing the workflow.
- `nuxt.config.ts` is intentionally minimal and currently contains `compatibilityDate: '2025-07-15'` and `devtools: { enabled: true }`. Keep both unless there is a documented reason to change them.
- `tsconfig.json` only references Nuxt-generated config files under `.nuxt/`. Treat those generated files as build artifacts, not source files to edit.
- `app/app.vue` currently renders `NuxtRouteAnnouncer` and `NuxtWelcome`; Story 1.1 should remove the generic welcome screen but preserve the route announcer.
- `README.md` is still the generic Nuxt starter README and must be replaced with project-specific instructions.
- The current `app/` directory only contains `app.vue`. `server/`, `shared/`, `db/`, and `tests/` do not exist yet.

### Technical Requirements

- Use the existing Nuxt scaffold as the approved starter baseline. Do not re-scaffold the repository or split frontend and backend into separate apps.
- Add the approved stack dependencies and configs needed for Nuxt + Pinia + Zod + Drizzle + SQLite + Vitest + Playwright.
- Keep the backend inside Nuxt `server/api/` routes and keep persistence behind `server/lib/repositories/`.
- Use formal migrations committed to the repo. Drizzle documentation mentions both `push` and `generate`/`migrate`; for this project, follow the architecture and standardize on migration files rather than `push` as the source of truth.
- Configure SQLite through environment-driven paths rather than hardcoding local file locations.
- Treat `_bmad/` and `_bmad-output/` as planning support only, not runtime code locations.
- Do not implement feature-specific API endpoints, stores, or schema tables beyond what is necessary to make the structure and tooling coherent.

### Architecture Compliance

- Keep application-facing code feature-first under `app/components/`, `app/composables/`, and `app/stores/`, while keeping shared infrastructure type-based under `server/lib/`, `shared/`, and `db/`.
- Use camelCase for API/client JSON and snake_case for the database layer. Do not blur those boundaries in foundation files.
- Plan for direct success payloads and structured error payloads shaped as `{ error: { code, message, details? } }`.
- Use UTC ISO 8601 timestamps at application boundaries.
- Pinia state changes must happen through store actions only. Story 1.1 should set up the module and folder structure so later stores follow this rule.
- Keep `server/api/` handlers thin, with business rules in services and data access in repositories.
- Preserve the runtime boundary that only server code talks to SQLite/Drizzle.

### Library / Framework Requirements

- Nuxt conventions matter here: file-based routing comes from `app/pages/`, auto-imports come from the app directories, and server API routes are generated from files under `server/api/`.
- Register `@pinia/nuxt` in `nuxt.config.ts`. Pinia's Nuxt integration auto-imports stores from `app/stores`, so keep store files flat there unless you also introduce a custom `storesDirs` config.
- Vitest is approved at `4.1.5`. Current official guidance requires Node `>=20` and allows either shared Vite config or a dedicated `vitest.config.ts`; use the dedicated config because the architecture explicitly requires one.
- Playwright is approved at `1.59.1`. Use `@playwright/test`, keep tests under `tests/`, and centralize browser/test configuration in `playwright.config.ts`.
- Drizzle requires a root `drizzle.config.ts` and environment-backed SQLite credentials. The docs show `libsql` examples, but this project is explicitly local SQLite/self-hosted, so do not introduce remote Turso/libsql assumptions unless the architecture changes.
- If npm dependency resolution produces a Pinia/Nuxt tree conflict, the Pinia docs mention an `overrides.vue` fallback for npm. Only use that fallback if the install actually requires it.

### File Structure Requirements

- Existing files expected to be updated in this story:
  - `package.json`
  - `nuxt.config.ts`
  - `tsconfig.json` only if minimal non-generated additions are required
  - `README.md`
  - `app/app.vue`
- New root files expected in this story:
  - `drizzle.config.ts`
  - `vitest.config.ts`
  - `playwright.config.ts`
  - `Dockerfile`
  - `.dockerignore`
  - `.env.example`
- New runtime directories and representative placeholders expected in this story:
  - `app/assets/css/`
  - `app/pages/`
  - `app/components/`
  - `app/composables/`
  - `app/stores/`
  - `server/api/`
  - `server/lib/errors/`
  - `server/lib/repositories/`
  - `server/lib/services/`
  - `server/lib/mappers/`
  - `server/lib/utils/`
  - `shared/schemas/`
  - `shared/types/`
  - `shared/constants/`
  - `db/schema/`
  - `db/migrations/`
  - `tests/setup/`
  - `tests/integration/`
  - `tests/e2e/`
  - `tests/fixtures/`

### Testing Requirements

- Story 1.1 is responsible for test infrastructure setup, not full application behavior coverage.
- Configure Vitest for future unit and integration work and create the required setup location under `tests/setup/`.
- Configure Playwright for future E2E/browser/accessibility work and keep the tests directory aligned with the architecture.
- Keep test file naming aligned with `.spec.ts` discovery.
- Foundation verification for this story should at minimum confirm the setup supports later migration, test, and runtime commands without runtime-shell regressions.

### Existing Files Being Modified - Preserve and Extend

- `package.json`
  - Preserve the project name and existing npm scripts.
  - Preserve current Nuxt/Vue dependencies and extend them with the approved stack instead of replacing the baseline.
- `nuxt.config.ts`
  - Preserve the current compatibility date and devtools setting.
  - Layer in module registration and app-level configuration only.
- `tsconfig.json`
  - Preserve `.nuxt` references and avoid direct edits to generated Nuxt config files.
- `app/app.vue`
  - Preserve `NuxtRouteAnnouncer` for accessibility.
  - Replace the generic `NuxtWelcome` placeholder with the baseline routed shell.
- `README.md`
  - Replace generic scaffold instructions with repo-specific setup steps, but keep it concise and practical.

### Latest Technical Information

- Nuxt 4 official docs confirm that file-based routing, auto-imported app directories, zero-config TypeScript support, and server API generation from `server/api/` are baseline framework conventions.
- Pinia's official Nuxt integration documents `@pinia/nuxt` module registration and store auto-imports from `app/stores` in Nuxt 4.
- Vitest official guidance recommends adding a local package dependency and notes a Node `>=20` requirement.
- Playwright official guidance uses `@playwright/test`, a root `playwright.config.ts`, and a `tests/` directory as the default setup shape.
- Drizzle's SQLite quickstart confirms the expected root-level `drizzle.config.ts`, environment-backed database credentials, and migration tooling shape, but the project architecture overrides the example's convenience `push` flow with formal migrations.

### Project Structure Notes

- No standalone UX document exists. Use the PRD and architecture as the source of truth for accessible defaults, responsive assumptions, and baseline shell expectations.
- `docs/` currently exists but is empty. It is not part of the runtime path for Story 1.1.
- Empty directories do not persist in git without a tracked file. Use minimal placeholder files or exports where necessary so the intended structure survives checkout and supports later stories.

### References

- [Source: _bmad-output/planning-artifacts/epics.md - Story 1.1: Set Up Initial Project from Starter Template]
- [Source: _bmad-output/planning-artifacts/architecture.md - Starter Template Evaluation]
- [Source: _bmad-output/planning-artifacts/architecture.md - Core Architectural Decisions]
- [Source: _bmad-output/planning-artifacts/architecture.md - Implementation Patterns & Consistency Rules]
- [Source: _bmad-output/planning-artifacts/architecture.md - Project Structure & Boundaries]
- [Source: _bmad-output/planning-artifacts/architecture.md - Implementation Handoff]
- [Source: _bmad-output/planning-artifacts/PRD.md - Technical Architecture Considerations]
- [Source: _bmad-output/planning-artifacts/PRD.md - Accessibility Requirements]
- [Source: package.json]
- [Source: nuxt.config.ts]
- [Source: tsconfig.json]
- [Source: app/app.vue]
- [Source: README.md]
- [Source: https://nuxt.com/docs/4.x/getting-started/introduction]
- [Source: https://pinia.vuejs.org/ssr/nuxt.html]
- [Source: https://orm.drizzle.team/docs/get-started/sqlite-new]
- [Source: https://vitest.dev/guide/]
- [Source: https://playwright.dev/docs/intro]

## Dev Agent Record

### Agent Model Used

GPT-5.4

### Debug Log References

- `npm install`
- `npm run test:unit`
- `npm run build`
- `npm run test:e2e`
- `npm run preview`

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- First backlog story was auto-selected from `sprint-status.yaml` as `1-1-set-up-initial-project-from-starter-template`.
- No previous story file or git commit history exists yet, so the current Nuxt scaffold is the only implementation baseline to preserve.
- Added the approved Nuxt foundation dependencies, root configs, environment template, and Docker baseline while preserving the original npm workflow and `nuxt prepare` postinstall hook.
- Replaced the generic Nuxt welcome screen with a routed baseline shell, placeholder pages, accessible default styles, and project-root shared constants.
- Added tracked scaffold directories plus minimal server, shared, database, and testing foundation files without introducing Story 1.2+ feature behavior.
- Fixed two setup regressions during verification: Vitest was narrowed to exclude Playwright specs, and the shell component usage was corrected to Nuxt's auto-imported `LayoutAppShell` name.
- Verified the baseline through `npm install`, `npm run dev`, `npm run test:unit`, `npm run build`, `npm run test:e2e`, and `npm run preview`.

### File List

- .dockerignore
- .env.example
- .gitignore
- Dockerfile
- README.md
- \_bmad-output/implementation-artifacts/1-1-set-up-initial-project-from-starter-template.md
- \_bmad-output/implementation-artifacts/sprint-status.yaml
- app/app.vue
- app/assets/css/main.css
- app/components/common/.gitkeep
- app/components/feedback/.gitkeep
- app/components/filters/.gitkeep
- app/components/history/.gitkeep
- app/components/layout/AppShell.vue
- app/components/lists/.gitkeep
- app/components/tasks/.gitkeep
- app/composables/.gitkeep
- app/pages/history.vue
- app/pages/index.vue
- app/pages/lists/[id].vue
- app/stores/.gitkeep
- db/client.ts
- db/migrations/.gitkeep
- db/schema/index.ts
- drizzle.config.ts
- nuxt.config.ts
- package.json
- package-lock.json
- playwright.config.ts
- server/api/lists/.gitkeep
- server/api/tags/.gitkeep
- server/api/tasks/.gitkeep
- server/lib/errors/AppError.ts
- server/lib/errors/errorCodes.ts
- server/lib/mappers/.gitkeep
- server/lib/repositories/.gitkeep
- server/lib/services/.gitkeep
- server/lib/utils/http.spec.ts
- server/lib/utils/http.ts
- server/lib/utils/logger.ts
- server/lib/utils/validation.ts
- shared/constants/ui.ts
- shared/schemas/index.ts
- shared/types/api.ts
- tests/e2e/app-shell.spec.ts
- tests/fixtures/.gitkeep
- tests/integration/.gitkeep
- tests/setup/vitest.setup.ts
- vitest.config.ts

## Change Log

- 2026-04-28: Story created and marked `ready-for-dev`.
- 2026-04-28: Story implemented, validated, and moved to `review`.
- 2026-04-28: Focused Epic 1 closeout validation passed with `npm run test:unit`, focused Chromium E2E coverage, and `npm run build`; story marked `done`.
