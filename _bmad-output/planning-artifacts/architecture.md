---
stepsCompleted:
  - 1
  - 2
  - 3
  - 4
  - 5
  - 6
  - 7
  - 8
inputDocuments:
  - _bmad-output/planning-artifacts/PRD.md
workflowType: 'architecture'
project_name: 'aine-bmad-todo'
user_name: 'Raul'
date: '2026-04-28'
lastStep: 8
status: 'complete'
completedAt: '2026-04-28'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
The PRD defines 35 functional requirements across list management, task creation and maintenance, tagging and task organization, task status and history, continuity and data access, system feedback and recovery, and application interface capabilities. Architecturally, this implies a small but complete full-stack system with clear domain boundaries between lists, tasks, tags, completion history, and failure handling. It also implies that the API contract is part of the product surface, not merely an internal implementation detail.

**Non-Functional Requirements:**
The PRD defines 17 non-functional requirements centered on perceived performance, data durability, accessibility, browser compatibility, responsive behavior, and basic security hygiene. The strongest architectural drivers are durable persistence across sessions, WCAG 2.2 AA compliance, predictable behavior across modern browsers, and error handling that preserves user trust when writes fail.

**Scale & Complexity:**
This is a low-complexity greenfield product in business scope, but it carries meaningful quality constraints because it is a full-stack SPA with persistence, filtering, history, accessibility, and cross-device responsive behavior.

- Primary domain: full-stack web application for personal productivity
- Complexity level: low overall, with moderate architectural rigor required
- Estimated architectural components: 6 to 8 major components or capability groupings

### Technical Constraints & Dependencies

- The system must ship as a single-page application backed by a small persistent API.
- SEO is not a v1 driver, so architecture can optimize for application behavior rather than public-content delivery.
- Real-time synchronization, authentication, collaboration, reminders, notifications, deadlines, and prioritization are out of scope for v1.
- Persistence may use SQLite or a JSON-backed store, but it must preserve lists, tasks, tags, descriptions, and completion history across refreshes and later sessions.
- The architecture must support WCAG 2.2 AA, keyboard-first interaction, and consistent behavior across modern desktop and mobile browsers.

### Cross-Cutting Concerns Identified

- Persistence integrity for create, update, delete, completion, and history flows
- Consistent tag semantics and filtering behavior across the UI and API
- Validation and error handling that distinguish failed writes from successful saves
- State synchronization between SPA views and persisted backend state
- Responsive behavior across desktop and mobile layouts
- Accessibility across task management, filtering, and history flows
- Testability and debuggability for a solo-maintained learning project

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web application based on project requirements analysis. The product is a single-page application with its own backend API, durable persistence, no external-service dependency in v1, and a requirement for clear state management between UI and persisted data.

### Starter Options Considered

**Option 1: Nuxt starter**
Current official starter path: `npm create nuxt@latest <my-project>`

Why it fits:
- Matches the existing repository foundation already present in the workspace
- Supports Vue-based SPA development while also providing a built-in server layer for API endpoints
- Reduces architectural fragmentation by keeping frontend and backend concerns in one framework boundary
- Supports TypeScript-first development with minimal setup friction
- Aligns well with a Docker/self-hosted deployment model
- Keeps future expansion paths open for authentication, server-side concerns, and richer runtime behavior if needed later

Trade-offs:
- Introduces more framework structure than a minimal SPA starter
- Brings SSR-capable tooling even though SEO and SSR are not v1 drivers
- Requires architectural discipline to keep the solution lean rather than overusing framework features

**Option 2: Vue + Vite starter**
Current official starter path: `npm create vue@latest`

Why it was considered:
- Clean fit for a pure SPA
- Lightweight default development experience
- Official scaffolding supports TypeScript, router, testing, linting, and formatting options

Why it was not selected:
- Does not provide the backend/API foundation this product needs
- Would force a separate backend choice and integration boundary immediately
- Creates more architectural decisions up front for little benefit in this project, given the repo already uses Nuxt

### Selected Starter: Nuxt starter

**Rationale for Selection:**
Nuxt is the most suitable starter because it matches the existing repository, supports the required SPA interaction model, and provides a clean path for implementing the backend API and persistence layer within the same architectural foundation. For this project, the key requirement is not public-content rendering but a maintainable full-stack application with reliable persistence, accessible UX, and clear state boundaries. Nuxt satisfies those needs while reducing early fragmentation.

**Initialization Command:**

```bash
npm create nuxt@latest aine-bmad-todo
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
- TypeScript-friendly setup by default
- Vue 3 application model
- Nuxt runtime with Nitro-backed server capabilities
- Strong fit for a Node-based self-hosted or containerized deployment target

**Styling Solution:**
- No hardcoded styling framework required by the starter
- Leaves CSS strategy open so architecture can choose a lightweight, accessibility-friendly styling approach later

**Build Tooling:**
- Nuxt build and dev pipeline already configured
- Integrated project preparation and production build flow
- Server and client concerns managed within the same framework toolchain

**Testing Framework:**
- No mandatory testing stack imposed by the starter
- The architecture standardizes on Vitest 4.1.5 for unit and integration testing
- The architecture standardizes on Playwright 1.59.1 for end-to-end, browser, and accessibility journey testing

**Code Organization:**
- Clear separation points for app shell, pages, components, composables, and server routes
- Natural placement for API endpoints under the server layer
- Good fit for keeping persistence access behind backend boundaries instead of leaking it into the client

**Development Experience:**
- Hot reload and integrated dev server
- Nuxt devtools support already present in the current workspace
- Auto-imports and framework conventions reduce boilerplate
- Good ergonomics for a solo learning project without sacrificing maintainability

**Note:** The repository is already initialized on this foundation, so implementation should treat the existing Nuxt scaffold as the approved starter baseline rather than re-scaffold the project.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Use Nuxt 4.4.2 as the full-stack application framework baseline
- Use TypeScript as the primary implementation language
- Use SQLite as the persistent database
- Use Drizzle ORM 0.45.2 as the database access layer
- Use formal migration files to manage schema changes
- Use REST-style JSON endpoints in Nuxt server routes as the API pattern
- Use Pinia 3.0.4 with @pinia/nuxt 0.11.3 for frontend state management
- Deploy as a single self-hosted application container with a mounted persistent SQLite volume

**Important Decisions (Shape Architecture):**
- Use Zod 4.3.6 for request validation and shared schema validation at application boundaries
- Keep the backend API inside the Nuxt server layer instead of splitting into a separate service
- Use Vitest 4.1.5 for unit and integration testing
- Use Playwright 1.59.1 for end-to-end and browser validation testing
- Keep v1 self-contained with no external services
- Keep CI/CD manual for v1 rather than designing around a mandatory pipeline

**Deferred Decisions (Post-MVP):**
- Authentication and authorization patterns, because multi-user access is out of scope for v1
- Real-time synchronization patterns, because live updates are out of scope for v1
- External integrations, analytics, and third-party service dependencies
- Advanced deployment automation and release orchestration

### Data Architecture

- **Database:** SQLite
- **ORM/Data Access Layer:** Drizzle ORM 0.45.2
- **Migration Strategy:** Formal migration files managed as part of the codebase
- **Validation Strategy:** Zod 4.3.6 at API boundaries and for untrusted input validation
- **Caching Strategy:** No dedicated caching layer for v1; rely on application state and direct persistence reads/writes unless profiling shows a bottleneck

**Rationale:**
This keeps the persistence model durable, inspectable, and small enough for a solo-maintained product. SQLite matches the bounded scope and self-hosted preference. Drizzle adds strong TypeScript support without forcing a heavy abstraction layer. Formal migrations reduce the risk of schema drift and make the data model easier to evolve safely.

**Affects:**
- Task, list, tag, and history data models
- API handlers and service boundaries
- Local development and deployment flows
- Debugging and data recovery workflows

### Authentication & Security

- **Authentication:** No authentication in v1
- **Authorization:** No role-based authorization in v1
- **Security Middleware Approach:** Validate all input at server boundaries and return sanitized error responses
- **Transport Security:** HTTPS required when deployed over a network, per PRD NFRs
- **Data Protection Approach:** Rely on server-side validation, safe error handling, and host-level file protection rather than application-layer encryption for v1

**Rationale:**
Authentication and authorization are explicitly out of scope for v1. The appropriate security posture is therefore strict input validation, clean error boundaries, and secure deployment practices, not a prematurely complex identity layer.

**Affects:**
- API request lifecycle
- Error handling design
- Deployment configuration
- Future extensibility for multi-user support

### API & Communication Patterns

- **API Pattern:** REST-style JSON API
- **Implementation Location:** Nuxt server routes
- **Validation Boundary:** Zod 4.3.6 for request validation and response-shape discipline where appropriate
- **Error Handling Standard:** Consistent structured error responses that distinguish validation failures, persistence failures, and not-found cases
- **Rate Limiting:** No dedicated rate limiting in v1 for self-hosted personal use, but architecture should keep room for middleware insertion later

**Rationale:**
REST-style JSON endpoints inside Nuxt server routes are the lowest-friction fit for this product. They align with the app’s CRUD-style requirements, keep the architecture understandable, and avoid creating an unnecessary network boundary between frontend and backend concerns.

**Affects:**
- Route handler organization
- Client API access patterns
- Error and validation contracts
- Future testing strategy

### Frontend Architecture

- **State Management:** Pinia 3.0.4 via @pinia/nuxt 0.11.3
- **Component Architecture:** Feature-oriented components around lists, tasks, filters, history, and feedback states
- **Routing Strategy:** Nuxt routing for page-level structure, with task and list interaction handled within the SPA runtime
- **Form and Interaction Validation:** Shared validation rules aligned with Zod-backed server expectations
- **Performance Approach:** Keep state normalized enough to support reliable filtering and status transitions without over-engineering

**Rationale:**
Although the app is not large, Pinia creates a clearer and more explicit state boundary for list selection, task collections, filter state, completion state, and UI feedback. For this product, that improves debuggability and consistency, especially around filter behavior and persisted state reconciliation.

**Affects:**
- Store design
- Component responsibilities
- Interaction flows
- Testing approach for client behavior

### Testing Architecture

- **Unit and Store Testing:** Vitest 4.1.5
- **Integration Testing:** Vitest 4.1.5
- **End-to-End Testing:** Playwright 1.59.1
- **Browser and Accessibility Journey Coverage:** Playwright 1.59.1 across supported browser targets
- **Test Scope Split:** Vitest covers domain logic, composables, stores, validators, and API integration surfaces; Playwright covers real user flows, responsive behavior, and accessibility-critical journeys

**Rationale:**
This testing split fits the product and stack cleanly. Vitest aligns naturally with the Nuxt and Vite-based toolchain for fast unit and integration feedback. Playwright provides the browser-level confidence needed for WCAG-sensitive flows, cross-browser support, and end-to-end task management behavior.

**Affects:**
- Test file placement and configuration
- CI and local quality workflow design
- Accessibility verification strategy
- Browser compatibility verification

### Infrastructure & Deployment

- **Deployment Model:** Single self-hosted application container
- **Persistence Hosting Shape:** Mounted persistent volume for the SQLite database file
- **Runtime Hosting Style:** Docker-based self-hosted Node/Nuxt deployment
- **CI/CD Strategy:** Manual builds and deployments for v1
- **Monitoring and Logging:** Basic structured application logging; no separate observability platform assumed in v1

**Rationale:**
This keeps operations aligned with the product’s scale and the self-hosted preference. A single container plus persistent mounted volume minimizes moving parts while preserving durability. Manual deployment is acceptable at this stage because the product goal is reliable personal use and learning, not release automation maturity.

**Affects:**
- Dockerfile and container runtime expectations
- Database file placement and backup considerations
- Operational recovery procedures
- Production configuration boundaries

### Decision Impact Analysis

**Implementation Sequence:**
1. Establish Drizzle + SQLite schema and migration workflow
2. Define backend domain models and server-route structure in Nuxt
3. Define Zod validation schemas for input boundaries
4. Configure Vitest and Playwright test infrastructure
5. Implement Pinia stores for lists, tasks, filters, and history state
6. Connect SPA components to the API contract
7. Package the app for Docker self-hosted deployment with persistent volume mapping

**Cross-Component Dependencies:**
- Data model decisions shape API contracts, Pinia store structure, and validation schemas
- API error conventions shape frontend feedback and recovery patterns
- Pinia store boundaries shape component responsibilities and filter/history behavior
- Deployment shape affects SQLite file handling, backup strategy, and operational failure recovery
- Deferring auth keeps the data and API model simpler, but future multi-user expansion will require revisiting ownership boundaries and security patterns

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
6 major areas where AI agents could make incompatible choices: naming, project structure, API formats, state management, error handling, and test placement.

### Naming Patterns

**Database Naming Conventions:**
- Use snake_case for all tables and columns
- Use plural table names
- Use *_id for foreign keys
- Use idx_<table>_<column> for indexes

Examples:
- `todo_lists`
- `tasks`
- `task_tags`
- `list_id`
- `completed_at`
- `idx_tasks_list_id`

**API Naming Conventions:**
- Use plural resource names for REST-style endpoints
- Use kebab-case only when an endpoint path needs multiple words
- Use `[id]` route parameters in Nuxt server route files
- Use camelCase for query parameters and JSON request/response fields

Examples:
- `/api/lists`
- `/api/lists/[id]`
- `/api/tasks`
- `/api/tasks/[id]/complete`
- `tagFilter`
- `completedOnly`

**Code Naming Conventions:**
- Use PascalCase for Vue component names and component files
- Use `useXxxStore` for Pinia store names
- Use `useXxx` for composables
- Use camelCase for variables and functions
- Use lower-case feature directories

Examples:
- `TaskListPanel.vue`
- `TaskHistoryView.vue`
- `useTaskStore.ts`
- `useListStore.ts`
- `useTaskFilters.ts`
- `getVisibleTasks`

### Structure Patterns

**Project Organization:**
Use a hybrid organization model:
- Feature-first for app-facing code
- Type-based organization for shared infrastructure

Application-facing examples:
- `app/components/lists/`
- `app/components/tasks/`
- `app/components/filters/`
- `app/components/history/`
- `app/stores/`
- `app/composables/`

Shared infrastructure examples:
- `server/api/`
- `server/lib/`
- `server/utils/`
- `db/schema/`
- `db/migrations/`

**File Structure Patterns:**
- Put API route handlers under `server/api`
- Put database schema and migration files under `db/`
- Put shared validators close to their domain or boundary layer, but keep server-bound validation importable from one place
- Keep static assets under Nuxt-standard public asset locations
- Keep environment configuration centralized and minimal

### Format Patterns

**API Response Formats:**
- Return direct success payloads for successful requests
- Return structured error payloads on failure
- Do not wrap every success response in a universal `{ data, error, meta }` envelope

Success examples:
- Single resource: `{ id, name, createdAt }`
- Collection response: `{ items, total }` only when collection metadata is needed
- Simple mutations can return the updated domain object directly

Error format:
- `{ error: { code, message, details? } }`

Required error fields:
- `code`: stable machine-readable identifier
- `message`: user-safe explanation
- `details`: optional structured validation or context data

**Data Exchange Formats:**
- Use camelCase in JSON exchanged with the client
- Use UTC ISO 8601 strings for timestamps
- Use booleans as true/false
- Use null explicitly when a nullable field is intentionally empty
- Perform casing transformations only at persistence boundaries if needed

Examples:
- `createdAt: "2026-04-28T10:30:00Z"`
- `completedAt: null`
- `isCompleted: true`

### Communication Patterns

**State Management Patterns:**
- All Pinia state changes must happen through store actions
- Components may read store state and invoke store actions, but must not directly mutate store state
- Keep stores organized by domain boundary, not by page
- Store names should reflect owned domain data and behavior

Recommended stores:
- `useListStore`
- `useTaskStore`
- `useFilterStore`
- `useUiFeedbackStore` only if UI feedback state becomes shared enough to justify it

**Action Naming Conventions:**
- Use verb-led camelCase names
- Prefer domain-specific action names over generic setters

Examples:
- `loadLists`
- `createList`
- `renameList`
- `loadTasks`
- `createTask`
- `updateTask`
- `completeTask`
- `applyTagFilter`
- `clearTagFilter`

### Process Patterns

**Error Handling Patterns:**
- Validate input at server boundaries before persistence logic runs
- Distinguish validation errors, not-found errors, and persistence failures with different error codes
- Show user-safe error messages in the UI
- Log technical detail separately from user-facing feedback
- Never leak raw exceptions or database internals to the client

Suggested error code families:
- `VALIDATION_ERROR`
- `NOT_FOUND`
- `CONFLICT`
- `PERSISTENCE_ERROR`
- `INTERNAL_ERROR`

**Loading State Patterns:**
- Use explicit loading and mutation flags with consistent naming
- Prefer local loading state for isolated interactions and store-level loading state for shared domain fetches
- Use `isLoading`, `isSaving`, `isDeleting`, and `loadError` naming patterns consistently
- Clear stale error state when a new operation starts
- Do not leave loading indicators unresolved after failure paths

### Test Placement Patterns

Use a hybrid test strategy:
- Use Vitest for co-located unit tests and top-level integration suites
- Use Playwright for end-to-end, browser, and accessibility journey tests
- Co-locate focused unit tests with small utilities, validators, and store logic when that improves maintainability
- Keep integration and end-to-end tests in top-level test directories by test type

Recommended layout:
- `app/composables/useTaskFilters.spec.ts`
- `app/stores/useTaskStore.spec.ts`
- `tests/setup/vitest.setup.ts`
- `tests/integration/`
- `tests/e2e/`

### Enforcement Guidelines

**All AI Agents MUST:**
- Use snake_case in the database layer and camelCase in the client/API JSON layer
- Use Pinia actions as the only path for store mutations
- Use direct success payloads and structured error payloads consistently
- Use UTC ISO 8601 timestamps at all application boundaries
- Place feature-facing code by domain and shared infrastructure by technical role
- Use Vitest for unit and integration tests and Playwright for end-to-end browser tests
- Follow the agreed hybrid test placement model
- Preserve the distinction between validation, persistence, and UI-state concerns

**Pattern Enforcement:**
- Review all new files for naming and placement consistency
- Reject mixed casing conventions across the same boundary
- Reject direct store mutation from components
- Reject inconsistent error shapes between endpoints
- Treat architecture pattern violations as defects, not stylistic preferences

### Pattern Examples

**Good Examples:**
- `server/api/tasks/[id].patch.ts`
- `db/schema/tasks.ts`
- `app/components/tasks/TaskItem.vue`
- `app/stores/useTaskStore.ts`
- `createdAt` in JSON, `created_at` in SQLite
- `completeTask(taskId)` as a store action
- `{ error: { code: "VALIDATION_ERROR", message: "Task title is required" } }`

**Anti-Patterns:**
- Mixing `tasks`, `Tasks`, and `task` as table names
- Returning wrapped success payloads from one endpoint and direct payloads from another
- Mutating Pinia state directly inside components
- Using Unix timestamps in one endpoint and ISO strings in another
- Placing similar feature code partly by page and partly by domain without a rule
- Returning raw exception text to the UI

## Project Structure & Boundaries

### Complete Project Directory Structure

```text
aine-bmad-todo/
├── README.md
├── package.json
├── package-lock.json
├── nuxt.config.ts
├── tsconfig.json
├── drizzle.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── Dockerfile
├── .dockerignore
├── .env.example
├── .gitignore
├── _bmad/
├── _bmad-output/
│   ├── planning-artifacts/
│   │   ├── PRD.md
│   │   └── architecture.md
│   ├── implementation-artifacts/
│   └── test-artifacts/
├── app/
│   ├── app.vue
│   ├── assets/
│   │   └── css/
│   │       └── main.css
│   ├── pages/
│   │   ├── index.vue
│   │   ├── history.vue
│   │   └── lists/
│   │       └── [id].vue
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.vue
│   │   │   ├── AppHeader.vue
│   │   │   └── AppNav.vue
│   │   ├── lists/
│   │   │   ├── ListSidebar.vue
│   │   │   ├── ListCreateForm.vue
│   │   │   ├── ListRenameDialog.vue
│   │   │   └── ListDeleteDialog.vue
│   │   ├── tasks/
│   │   │   ├── TaskComposer.vue
│   │   │   ├── TaskList.vue
│   │   │   ├── TaskItem.vue
│   │   │   ├── TaskEditorDialog.vue
│   │   │   └── TaskMetadataBadge.vue
│   │   ├── filters/
│   │   │   ├── TagFilterBar.vue
│   │   │   └── FilterChip.vue
│   │   ├── history/
│   │   │   ├── CompletedTaskList.vue
│   │   │   └── CompletedTaskItem.vue
│   │   ├── feedback/
│   │   │   ├── LoadingState.vue
│   │   │   ├── EmptyState.vue
│   │   │   ├── ErrorBanner.vue
│   │   │   └── SuccessNotice.vue
│   │   └── common/
│   │       ├── ConfirmDialog.vue
│   │       └── FormField.vue
│   ├── composables/
│   │   ├── useApiFetch.ts
│   │   ├── useTaskFilters.ts
│   │   ├── useErrorMessage.ts
│   │   └── useIsoDate.ts
│   └── stores/
│       ├── useListStore.ts
│       ├── useTaskStore.ts
│       └── useFilterStore.ts
├── server/
│   ├── api/
│   │   ├── lists/
│   │   │   ├── index.get.ts
│   │   │   ├── index.post.ts
│   │   │   ├── [id].get.ts
│   │   │   ├── [id].patch.ts
│   │   │   └── [id].delete.ts
│   │   ├── tasks/
│   │   │   ├── index.get.ts
│   │   │   ├── index.post.ts
│   │   │   ├── [id].get.ts
│   │   │   ├── [id].patch.ts
│   │   │   ├── [id].delete.ts
│   │   │   └── [id]/
│   │   │       └── complete.post.ts
│   │   └── tags/
│   │       └── index.get.ts
│   ├── lib/
│   │   ├── errors/
│   │   │   ├── AppError.ts
│   │   │   └── errorCodes.ts
│   │   ├── repositories/
│   │   │   ├── listRepository.ts
│   │   │   ├── taskRepository.ts
│   │   │   └── tagRepository.ts
│   │   ├── services/
│   │   │   ├── listService.ts
│   │   │   └── taskService.ts
│   │   ├── mappers/
│   │   │   ├── listMapper.ts
│   │   │   └── taskMapper.ts
│   │   └── utils/
│   │       ├── http.ts
│   │       ├── logger.ts
│   │       └── validation.ts
├── shared/
│   ├── schemas/
│   │   ├── list.ts
│   │   ├── task.ts
│   │   └── tag.ts
│   ├── types/
│   │   ├── api.ts
│   │   ├── list.ts
│   │   └── task.ts
│   └── constants/
│       └── ui.ts
├── db/
│   ├── client.ts
│   ├── schema/
│   │   ├── todoLists.ts
│   │   ├── tasks.ts
│   │   ├── taskTags.ts
│   │   └── index.ts
│   └── migrations/
├── tests/
│   ├── setup/
│   │   └── vitest.setup.ts
│   ├── integration/
│   │   ├── api/
│   │   │   ├── lists.spec.ts
│   │   │   ├── tasks.spec.ts
│   │   │   └── tags.spec.ts
│   │   └── persistence/
│   │       └── sqlite.spec.ts
│   ├── e2e/
│   │   ├── task-management.spec.ts
│   │   ├── history.spec.ts
│   │   └── accessibility.spec.ts
│   └── fixtures/
│       ├── lists.ts
│       └── tasks.ts
├── docs/
└── public/
    └── favicon.ico
```

### Architectural Boundaries

**API Boundaries:**
- Browser clients communicate only with Nuxt server routes under `server/api/`
- No client code may access SQLite or Drizzle directly
- Input validation happens at API boundaries using shared Zod schemas
- Server routes stay thin and delegate business rules to services and persistence access to repositories

**Component Boundaries:**
- Page files under `app/pages/` compose feature components and route-level state
- Feature components under `app/components/` render UI and dispatch store actions
- Pinia stores own client state transitions and coordination with API calls
- Composables provide reusable client-side helpers, fetch wrappers, filtering utilities, and UI helper logic

**Service Boundaries:**
- `server/lib/services/` owns domain rules for lists, tasks, completion, and history
- `server/lib/repositories/` is the only layer that talks to Drizzle and SQLite
- `server/lib/mappers/` handles casing and domain-object translation where needed
- `server/lib/errors/` defines stable application error types and codes

**Data Boundaries:**
- `db/schema/` defines the source of truth for database tables and relations
- `db/migrations/` owns schema evolution
- `shared/schemas/` defines request and boundary validation shapes
- JSON uses camelCase at API boundaries, while SQLite schema remains snake_case

### Requirements to Structure Mapping

**Feature Mapping:**
- List Management:
  - `app/components/lists/`
  - `app/pages/index.vue`
  - `server/api/lists/`
  - `server/lib/services/listService.ts`
  - `server/lib/repositories/listRepository.ts`
  - `db/schema/todoLists.ts`

- Task Creation and Maintenance:
  - `app/components/tasks/`
  - `app/pages/lists/[id].vue`
  - `server/api/tasks/`
  - `server/lib/services/taskService.ts`
  - `server/lib/repositories/taskRepository.ts`
  - `db/schema/tasks.ts`

- Tagging and Task Organization:
  - `app/components/filters/`
  - `app/composables/useTaskFilters.ts`
  - `server/api/tags/index.get.ts`
  - `shared/schemas/tag.ts`
  - `db/schema/taskTags.ts`

- Task Status and History:
  - `app/components/history/`
  - `app/pages/history.vue`
  - `server/api/tasks/[id]/complete.post.ts`
  - `server/api/tasks/index.get.ts`
  - `db/schema/tasks.ts`

- System Feedback and Recovery:
  - `app/components/feedback/`
  - `app/composables/useErrorMessage.ts`
  - `server/lib/errors/`
  - `server/lib/utils/http.ts`

**Cross-Cutting Concerns:**
- Accessibility:
  - `app/components/`
  - `app/assets/css/main.css`
  - `tests/e2e/accessibility.spec.ts`

- Persistence integrity:
  - `db/`
  - `server/lib/repositories/`
  - `tests/integration/persistence/sqlite.spec.ts`

- API contract consistency:
  - `shared/schemas/`
  - `shared/types/api.ts`
  - `server/api/`
  - `tests/integration/api/`

### Integration Points

**Internal Communication:**
- Pages assemble feature components
- Components read from stores and dispatch store actions
- Stores use `useApiFetch.ts` to call server routes
- Server routes validate input, call services, then return structured JSON
- Services call repositories for all persistence operations
- Repositories translate between Drizzle records and domain objects

**External Integrations:**
- None in v1
- SQLite is the only persistence dependency
- Docker runtime and mounted storage are operational dependencies, not application integrations

**Data Flow:**
- User interaction
- Component event
- Pinia action
- API request via composable
- Nuxt server route
- Zod validation
- Service logic
- Repository call
- Drizzle + SQLite
- JSON response
- Store update
- UI re-render

### File Organization Patterns

**Configuration Files:**
- Root-level project configuration stays at the repo root
- `drizzle.config.ts` stays at the root beside Nuxt config
- Environment examples stay at the root, with runtime secrets provided outside the repo in deployment

**Source Organization:**
- App-facing code is feature-first inside `app/components/`
- Shared infrastructure is type-based inside `server/lib/`, `shared/`, and `db/`
- API routes stay grouped by resource under `server/api/`

**Test Organization:**
- Co-locate focused unit tests with stores and composables when proximity helps maintenance
- Use Vitest for co-located unit tests and top-level integration tests
- Use Playwright for end-to-end, browser, and accessibility verification
- Keep integration and end-to-end tests under top-level `tests/`
- Use fixtures under `tests/fixtures/` for deterministic API and persistence scenarios

**Asset Organization:**
- Public assets stay under `public/`
- App-scoped styles stay under `app/assets/`
- Do not mix generated assets, planning artifacts, and runtime assets

### Development Workflow Integration

**Development Server Structure:**
- Nuxt dev server serves the SPA and server routes together
- App, shared, server, and db layers remain in one repo and one runtime boundary
- `_bmad/` and `_bmad-output/` remain planning support only and are not part of the runtime architecture

**Build Process Structure:**
- Nuxt build produces the runtime application bundle
- Drizzle schema and migrations remain part of the source-controlled deployment inputs
- Tests run across Vitest unit and integration suites plus Playwright end-to-end suites

**Deployment Structure:**
- Docker image packages the Nuxt app and server runtime
- SQLite file lives on a mounted persistent volume outside the container filesystem
- Manual deployment flow applies migrations, then starts the app container against the mounted database path

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
The selected stack is internally consistent. Nuxt 4.4.2 supports the SPA-first application model while also providing the server route layer needed for the REST-style API. Drizzle ORM 0.45.2 and SQLite fit the low-complexity, self-hosted persistence requirement. Zod 4.3.6 complements the API design by enforcing request validation and stable boundary contracts. Pinia 3.0.4 with @pinia/nuxt 0.11.3 aligns with the chosen frontend state-management approach and the requirement for explicit state transitions. Vitest 4.1.5 and Playwright 1.59.1 complete the stack with a testing split that matches the application boundaries.

**Pattern Consistency:**
The implementation patterns support the architectural decisions without contradiction. Database naming conventions, JSON casing rules, API response conventions, Pinia action boundaries, test placement patterns, and the Vitest/Playwright split all reinforce the chosen stack. No pattern conflicts were identified between persistence, API design, frontend state, testing strategy, or deployment assumptions.

**Structure Alignment:**
The project structure supports the architecture directly. The split between `app/`, `server/`, `shared/`, `db/`, and `tests/` creates clear responsibility boundaries. Server routes remain thin, business logic is isolated in services, persistence is isolated in repositories, validation and types can be shared without collapsing layers together, and the test structure mirrors the architectural boundaries.

### Requirements Coverage Validation ✅

**Feature Coverage:**
All major PRD capability areas are supported by the architecture:
- List management maps to list components, stores, routes, services, repositories, and schema files
- Task creation and maintenance maps to task UI, task state, task endpoints, services, and persistence layers
- Tagging and filtering maps to filters UI, filter logic, tag endpoints, shared schemas, and tag persistence structures
- Completion and history flows map to dedicated history UI, completion endpoints, and persistence support
- System feedback and recovery maps to explicit feedback components, error utilities, and structured server error responses

**Functional Requirements Coverage:**
All 35 functional requirements have architectural support. The architecture covers user-visible CRUD capabilities, tagging, filtering, history retrieval, continuity across sessions, feedback handling, and the backend operations required to make those capabilities consistent.

**Non-Functional Requirements Coverage:**
All 17 non-functional requirements are addressed at the architectural level:
- Performance is supported through a compact full-stack deployment and low-latency local persistence
- Reliability and data durability are supported through SQLite persistence, formal migrations, and mounted volume deployment
- Accessibility is supported through the explicit requirement for WCAG 2.2 AA and dedicated accessibility-aware frontend structure
- Browser compatibility is supported through Nuxt/Vue on supported modern browsers and responsive layout boundaries
- Security and data protection are supported through validation, sanitized errors, HTTPS in deployment, and controlled server-side persistence access

### Implementation Readiness Validation ✅

**Decision Completeness:**
All critical implementation-blocking decisions are documented, including framework, language, persistence model, ORM, validation approach, API pattern, state management, testing strategy, deployment shape, and migration strategy.

**Structure Completeness:**
The project tree is concrete enough for implementation agents to scaffold consistently. Directory boundaries, route locations, schema locations, shared validation boundaries, test locations, and deployment structure are all defined.

**Pattern Completeness:**
The consistency rules are specific enough to prevent common multi-agent drift. Naming, error handling, response formatting, state updates, timestamps, structure, testing split, and test placement all have explicit rules and examples.

### Gap Analysis Results

**Critical Gaps:**
- None identified

**Important Gaps:**
- Backup and restore procedure for the SQLite mounted volume is not yet specified
- Healthcheck and readiness endpoint conventions are not yet explicitly defined
- Manual deployment is intentional, but no deployment verification checklist is yet documented

**Nice-to-Have Gaps:**
- Structured logging field conventions could be tightened further later
- A formal pre-commit quality gate could be added in a future implementation workflow
- API documentation generation is not defined for v1, though not required for this scope

### Validation Issues Addressed

No blocking validation issues were found. The remaining gaps are operational refinements rather than architectural blockers. They can be handled during implementation planning or deployment hardening without changing the core architecture.

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**✅ Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**✅ Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High

**Key Strengths:**
- Tight fit between product scope and architecture complexity
- Clear separation of UI, API, domain, persistence, and test boundaries
- Strong consistency rules for multi-agent implementation
- Low operational overhead with durable local persistence
- Good extensibility path without premature over-engineering

**Areas for Future Enhancement:**
- Backup and recovery workflow for the SQLite volume
- Healthcheck and operational readiness endpoints
- Automated CI validation once manual delivery becomes limiting
- Authentication and ownership boundaries if the product evolves into a multi-user system

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries
- Refer to this document for all architectural questions

**First Implementation Priority:**
Use the existing Nuxt scaffold as the baseline, then establish Drizzle configuration, SQLite schema files, formal migrations, Vitest and Playwright configs, and server route skeletons before building feature UI.