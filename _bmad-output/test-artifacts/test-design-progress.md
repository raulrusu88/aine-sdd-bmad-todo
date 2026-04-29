---
workflowStatus: "completed"
totalSteps: 5
stepsCompleted:
  [
    "step-01-detect-mode",
    "step-02-load-context",
    "step-03-risk-and-testability",
    "step-04-coverage-plan",
    "step-05-generate-output",
  ]
lastStep: "step-05-generate-output"
nextStep: ""
lastSaved: "2026-04-28"
inputDocuments:
  - /Users/raul/Documents/Development/Work/nearform/aine-program-spec-driven-dev/aine-bmad-todo/_bmad/tea/config.yaml
  - /Users/raul/Documents/Development/Work/nearform/aine-program-spec-driven-dev/aine-bmad-todo/package.json
  - /Users/raul/Documents/Development/Work/nearform/aine-program-spec-driven-dev/aine-bmad-todo/_bmad-output/planning-artifacts/PRD.md
  - /Users/raul/Documents/Development/Work/nearform/aine-program-spec-driven-dev/aine-bmad-todo/_bmad-output/planning-artifacts/architecture.md
  - /Users/raul/Documents/Development/Work/nearform/aine-program-spec-driven-dev/aine-bmad-todo/.agents/skills/bmad-testarch-test-design/resources/tea-index.csv
  - /Users/raul/Documents/Development/Work/nearform/aine-program-spec-driven-dev/aine-bmad-todo/.agents/skills/bmad-testarch-test-design/resources/knowledge/adr-quality-readiness-checklist.md
  - /Users/raul/Documents/Development/Work/nearform/aine-program-spec-driven-dev/aine-bmad-todo/.agents/skills/bmad-testarch-test-design/resources/knowledge/test-levels-framework.md
  - /Users/raul/Documents/Development/Work/nearform/aine-program-spec-driven-dev/aine-bmad-todo/.agents/skills/bmad-testarch-test-design/resources/knowledge/risk-governance.md
  - /Users/raul/Documents/Development/Work/nearform/aine-program-spec-driven-dev/aine-bmad-todo/.agents/skills/bmad-testarch-test-design/resources/knowledge/test-quality.md
  - /Users/raul/Documents/Development/Work/nearform/aine-program-spec-driven-dev/aine-bmad-todo/.agents/skills/bmad-testarch-test-design/resources/knowledge/playwright-cli.md
  - /Users/raul/Documents/Development/Work/nearform/aine-program-spec-driven-dev/aine-bmad-todo/.agents/skills/bmad-testarch-test-design/resources/knowledge/overview.md
  - /Users/raul/Documents/Development/Work/nearform/aine-program-spec-driven-dev/aine-bmad-todo/.agents/skills/bmad-testarch-test-design/resources/knowledge/api-request.md
  - /Users/raul/Documents/Development/Work/nearform/aine-program-spec-driven-dev/aine-bmad-todo/.agents/skills/bmad-testarch-test-design/resources/knowledge/auth-session.md
  - /Users/raul/Documents/Development/Work/nearform/aine-program-spec-driven-dev/aine-bmad-todo/.agents/skills/bmad-testarch-test-design/resources/knowledge/recurse.md
---

## Step 1: Detect Mode & Prerequisites

- Selected mode: System-Level
- Selection reason: The project has a completed PRD and architecture document, and no epic/story implementation artifacts exist yet.
- Prerequisites found:
  - PRD: `_bmad-output/planning-artifacts/PRD.md`
  - Architecture: `_bmad-output/planning-artifacts/architecture.md`
- Prerequisite result: Satisfied

## Step 2: Load Context & Knowledge Base

- Configuration loaded:
  - `tea_use_playwright_utils: true`
  - `tea_use_pactjs_utils: false`
  - `tea_pact_mcp: none`
  - `tea_browser_automation: auto`
  - `test_stack_type: auto`
  - `test_artifacts: {project-root}/_bmad-output/test-artifacts`
- Stack detection result:
  - Repository scan indicates a frontend Nuxt/Vue workspace today because `package.json` contains Nuxt and Vue and no backend-specific project files are present yet.
  - System test-design scope remains full-stack because the architecture defines Nuxt server routes, SQLite, Drizzle, and server-side validation as required implementation boundaries.
- Existing test signal:
  - No `tests/` directory exists yet.
  - No `playwright.config.*` or `cypress.config.*` file exists yet.
  - No existing `page.goto` or `page.locator` usage was found.
- Playwright-related context loaded:
  - `playwright-cli.md` because browser automation mode is `auto`
  - Playwright Utils API-first profile fragments loaded: `overview.md`, `api-request.md`, `auth-session.md`, and `recurse.md`
- Project artifacts loaded:
  - PRD with 35 functional requirements and 17 non-functional requirements
  - Architecture document covering Nuxt, TypeScript, SQLite, Drizzle, Zod, Pinia, Vitest, Playwright, Docker deployment, project structure, and integration boundaries
- System-level extraction summary:
  - Primary quality drivers: persistence integrity, tag filtering correctness, completion/history correctness, accessibility, browser compatibility, and trustworthy error handling
  - Main integration boundary: browser -> Pinia/composables -> Nuxt server routes -> services -> repositories -> Drizzle/SQLite
  - Main operational dependencies: SQLite database file on mounted Docker volume and migration workflow
- Knowledge fragments loaded for system-level planning:
  - `adr-quality-readiness-checklist.md`
  - `test-levels-framework.md`
  - `risk-governance.md`
  - `test-quality.md`
- Missing input assessment:
  - No required inputs are missing for system-level test design.

## Step 3: Testability & Risk Assessment

### 🚨 Testability Concerns

- **No explicit seed/reset strategy yet**
  - Evidence: The architecture defines `tests/fixtures/` and integration test locations, but it does not yet define a canonical seed/reset mechanism for SQLite or API-level fixture setup.
  - Impact: Core persistence, filtering, and history scenarios will be slower to set up and more fragile unless implementation establishes deterministic data factories and cleanup early.
  - Action: Add a foundation-level fixture strategy for SQLite setup/teardown and API-driven seed helpers before writing broad integration and E2E coverage.

- **No planned fault-injection path for persistence or API failures**
  - Evidence: The PRD requires actionable error handling and retry-safe recovery, but the architecture does not yet define how tests will force repository failures, invalid payloads, or transient write errors.
  - Impact: Error-state behavior could be under-tested, especially for NFR6, NFR7, FR29, and FR30.
  - Action: Define test seams for repository stubs/mocks in unit tests and deterministic server error triggers in integration tests.

- **Observability is minimal for test diagnosis**
  - Evidence: The architecture includes basic structured logging, but healthcheck/readiness conventions, metrics, and richer failure diagnostics were explicitly called out as remaining gaps in architecture validation.
  - Impact: When API or persistence tests fail, root-cause analysis will be slower and automation failures may be harder to triage.
  - Action: Add stable log fields, health/readiness endpoints, and consistent error codes during the implementation foundation phase.

- **Parallel-safety rules for the SQLite test environment are not yet explicit**
  - Evidence: The architecture chooses SQLite plus Vitest and Playwright, but it does not yet specify whether test runs use isolated database files, transactional resets, or per-worker storage.
  - Impact: Integration and E2E suites are at risk of state leakage and flakiness once parallel execution is introduced.
  - Action: Define one test database per worker or per suite and enforce cleanup/reset discipline in shared test setup.

- **API example payloads and contract examples are not yet documented**
  - Evidence: The architecture defines endpoint families and response shapes, but no valid/invalid sample requests or response examples are captured yet.
  - Impact: Contract and negative-path tests will be slower to author and more prone to interpretation drift.
  - Action: Add sample request/response examples as part of implementation scaffolding or the first API test artifacts.

### ✅ Testability Assessment Summary

- The architecture is structurally testable because it preserves clean boundaries between UI, stores, API routes, services, repositories, and persistence.
- The planned Vitest/Playwright split is appropriate for the product: logic and API behavior can be covered below the browser, while critical journeys and accessibility remain covered at E2E.
- The absence of external services materially lowers environment complexity and makes deterministic system-level coverage more realistic.
- Structured error payloads, Zod validation boundaries, and explicit persistence layers create strong hooks for negative-path and contract testing.
- The project tree already allocates clear homes for fixtures, integration tests, accessibility tests, and persistence tests.

### Architecturally Significant Requirements (ASRs)

| ASR                                                                     | Type       | Why It Matters                                                                                                  |
| ----------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| Persistence integrity across refreshes, restarts, and later sessions    | ACTIONABLE | This is the product trust anchor and must be verified at repository, API, and user-flow levels.                 |
| Correct task-state transitions for active, completed, and history views | ACTIONABLE | Completion and history are core product semantics and are vulnerable to duplication or loss bugs.               |
| Tag assignment and tag-filter semantics across lists and views          | ACTIONABLE | Filtering is a core differentiator and must remain consistent across client state and persistence queries.      |
| Stable API contracts with safe structured errors                        | ACTIONABLE | Frontend behavior, negative-path handling, and maintainability all depend on contract discipline.               |
| WCAG 2.2 AA keyboard and assistive-technology usability                 | ACTIONABLE | Accessibility is a v1 quality bar, not a polish task, so it requires explicit system-level coverage.            |
| Responsive, cross-browser task management on desktop and mobile         | ACTIONABLE | The product value breaks if core flows degrade on small screens or supported browsers.                          |
| Migration safety and mounted-volume durability for SQLite deployment    | ACTIONABLE | Operational correctness matters because local persistence is the only data system in v1.                        |
| No authentication or external integrations in v1                        | FYI        | This reduces current complexity and constrains the first test strategy to a single-user, self-contained system. |

### Risk Assessment Matrix

| ID  | Category | Risk                                                                                                                    | P   | I   | Score | Action   | Mitigation                                                                                                                                      | Owner            | Timeline                                                 |
| --- | -------- | ----------------------------------------------------------------------------------------------------------------------- | --- | --- | ----- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | -------------------------------------------------------- |
| R1  | DATA     | Persisted task/list state becomes inconsistent across create, edit, complete, delete, refresh, or restart flows.        | 2   | 3   | 6     | MITIGATE | Add repository and API integration coverage for CRUD, completion, refresh persistence, and restart recovery using isolated SQLite fixtures.     | Engineering      | Before feature implementation expands beyond scaffolding |
| R2  | DATA     | Completion and history transitions duplicate, lose, or misclassify tasks between active and completed views.            | 2   | 3   | 6     | MITIGATE | Add focused state-transition tests at service/API level plus E2E coverage for complete and history retrieval flows.                             | Engineering      | Before history UI is considered done                     |
| R3  | BUS      | Tag filtering semantics drift between store state, API query behavior, and persisted data.                              | 2   | 2   | 4     | MONITOR  | Define canonical filter rules early and cover them with unit tests for filter logic plus integration tests for query behavior.                  | Engineering      | During filter implementation                             |
| R4  | BUS      | Keyboard, focus, label, or screen-reader behavior regresses below WCAG 2.2 AA in core flows.                            | 2   | 3   | 6     | MITIGATE | Add accessibility assertions in Playwright for create, edit, filter, complete, and history flows; validate visible focus and semantic labeling. | Engineering + QA | Before release candidate quality review                  |
| R5  | PERF     | Core interactions exceed response-time expectations on mobile or under realistic personal-use volumes.                  | 2   | 2   | 4     | MONITOR  | Add targeted performance checks for API response time and UI update latency on key list/task/filter operations.                                 | Engineering      | After baseline flows are stable                          |
| R6  | SEC      | Invalid input or server errors leak internals or bypass validation boundaries.                                          | 2   | 2   | 4     | MONITOR  | Add contract and negative-path tests for malformed payloads, missing fields, oversized values, and sanitized error responses.                   | Engineering      | During API implementation                                |
| R7  | OPS      | SQLite migrations or mounted-volume handling fail during deployment or restart, causing startup or schema drift issues. | 2   | 3   | 6     | MITIGATE | Add migration smoke tests, startup health verification, and documented test restore/reset flows for local and containerized runs.               | Engineering      | Before Docker deployment path is finalized               |
| R8  | TECH     | Lack of deterministic fixture setup and cleanup causes flaky or slow integration and E2E suites.                        | 3   | 2   | 6     | MITIGATE | Establish shared data factories, isolated DB files, and suite-level cleanup rules before broad test expansion.                                  | QA + Engineering | Before first integration and E2E suites land             |
| R9  | OPS      | Weak observability slows failure diagnosis during test runs and manual deployments.                                     | 2   | 2   | 4     | MONITOR  | Standardize structured log fields, error codes, and lightweight health/readiness endpoints.                                                     | Engineering      | During platform foundation work                          |

### Highest-Risk Summary

- **Top mitigation priorities:** R1 persistence integrity, R2 completion/history correctness, R4 accessibility compliance, R7 deployment durability, and R8 deterministic test setup.
- **Most likely quality drag if ignored:** R8, because weak fixture discipline will make every later test layer slower and less trustworthy.
- **Most damaging product risks:** R1 and R2, because trust in the app collapses if tasks disappear, duplicate, or reappear in the wrong state.
- **Most important non-functional gate:** R4, because accessibility is a binding v1 requirement and must be validated as a first-class delivery criterion.

## Step 4: Coverage Plan & Execution Strategy

### Coverage Matrix

| ID          | Priority | Level     | Scenario                                                                                                               | Primary Coverage                                      | Rationale                                                                                                            |
| ----------- | -------- | --------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| TD-UNIT-001 | P0       | Unit      | Validate task, list, and tag input schemas plus sanitized error mapping                                                | FR28-FR30, NFR15-NFR16, R6                            | Validation rules and safe error shaping are fastest and most stable below the API boundary.                          |
| TD-API-001  | P0       | API       | List CRUD persists correctly and returns stable camelCase payloads                                                     | FR1-FR5, FR23-FR25, R1                                | Data integrity for lists is a core persisted contract and should be proven at the route/service/repository boundary. |
| TD-API-002  | P0       | API       | Task CRUD persists title, optional description, metadata, and tags correctly                                           | FR6-FR15, FR23-FR25, R1                               | This is the primary persistence path and belongs in API/integration coverage rather than E2E repetition.             |
| TD-API-003  | P0       | API       | Complete-task transition moves tasks into history without duplication and survives refresh/restart semantics           | FR18-FR25, NFR4-NFR7, R1-R2                           | Completion/history is a critical state transition best verified directly against persistence and API contracts.      |
| TD-E2E-001  | P0       | E2E       | Core user journey: create list, create task, tag, filter, complete, open history, refresh, and confirm persisted state | Journey 1, FR1, FR6, FR13, FR16, FR18-FR23, NFR4-NFR5 | One browser-level proof of the full value path is required; more would be redundant.                                 |
| TD-E2E-002  | P0       | E2E       | Keyboard-only accessible core journey with visible focus, labels, and state communication                              | NFR8-NFR11, R4                                        | Accessibility is a release-critical requirement and needs browser-level validation.                                  |
| TD-E2E-003  | P0       | E2E       | Save failure shows actionable sanitized feedback and retry preserves user context                                      | Journey 2, FR29-FR30, NFR6-NFR7, NFR16                | Recovery trust is user-facing and must be proven where the UI and API interact.                                      |
| TD-UNIT-002 | P1       | Unit      | Filter predicate logic handles tag selection, clear filter, completed-only state, and list scoping                     | FR16-FR17, FR19-FR22, R3                              | Pure filtering logic should be isolated for fast regression feedback.                                                |
| TD-COMP-001 | P1       | Component | Task composer/editor components enforce labels, focus management, field feedback, and keyboard submission              | FR6-FR10, NFR8-NFR10                                  | Component tests give cheaper UI validation than duplicating this in multiple E2E flows.                              |
| TD-API-004  | P1       | API       | Tag-filter query behavior is correct across active, completed, and list boundaries                                     | FR13-FR17, FR19-FR22, R3                              | This is a contract and query-semantics problem, not primarily a browser problem.                                     |
| TD-API-005  | P1       | API       | Rename and delete behaviors for lists and tasks return correct success and not-found/error outcomes                    | FR3-FR4, FR9-FR11, FR28-FR30                          | Route-level coverage is sufficient and avoids unnecessary E2E duplication.                                           |
| TD-API-006  | P1       | API       | Migration and startup smoke against isolated SQLite database validates schema readiness and restart safety             | NFR4-NFR5, R7                                         | Operational data durability should be exercised before deployment hardening.                                         |
| TD-E2E-004  | P1       | E2E       | Mobile viewport core flow remains usable for create, filter, complete, and history access                              | NFR12-NFR14                                           | Responsive usability is a browser/device concern and belongs in E2E.                                                 |
| TD-E2E-005  | P1       | E2E       | Cross-browser smoke for the main task flow in Chromium, WebKit, and Firefox                                            | NFR12-NFR14                                           | Browser-compatibility confidence requires representative engine coverage, not deeper feature duplication.            |
| TD-COMP-002 | P2       | Component | Loading, empty, success, and error feedback components render accessible and stable states                             | FR26-FR29, NFR10-NFR11                                | Isolated feedback states are cheaper to verify as components than via many E2E branches.                             |
| TD-API-007  | P2       | API       | Response-time smoke for create, update, filter, and complete operations under representative personal-use dataset size | NFR1-NFR3, R5                                         | Lightweight performance smoke belongs at the API level before any heavier browser checks.                            |
| TD-OPS-001  | P2       | API       | Health/readiness and structured-log smoke once observability endpoints exist                                           | R9                                                    | This should be added as soon as the implementation introduces observability hooks.                                   |
| TD-OPS-002  | P3       | API       | Backup/restore rehearsal for mounted SQLite volume                                                                     | Architecture operational gap, R7                      | Important for hardening, but not required before core functional confidence is established.                          |

### Execution Strategy

- **PR:** Run all Unit, Component, and API scenarios plus the smallest P0 browser slice (`TD-E2E-001` and `TD-E2E-003`) if total runtime stays under 15 minutes. If runtime exceeds that ceiling, keep only the P0 browser smoke on PR and defer broader browser coverage.
- **Nightly:** Run the full P0 and P1 plan, including accessibility, mobile viewport, migration smoke, and cross-browser Playwright coverage.
- **Weekly:** Run P2 and P3 hardening suites, including performance smoke, backup/restore rehearsal, and any expanded dataset or deployment diagnostics.

### Resource Estimates

- **P0:** ~24-36 hours
- **P1:** ~18-28 hours
- **P2:** ~8-14 hours
- **P3:** ~2-6 hours
- **Total:** ~52-84 hours of test design and implementation effort
- **Delivery shape:** ~1-2 foundation iterations for P0 coverage, ~1-2 additional iterations for P1/P2 hardening, with P3 folded into release hardening if still needed

### Quality Gates

- **P0 pass rate:** 100%
- **P1 pass rate:** >= 95%
- **High-risk mitigations complete before release:** R1, R2, R4, R7, and R8
- **Coverage target:** >= 80% across unit/component/API coverage for core business rules and server boundaries, with every P0/P1 user journey mapped to at least one automated test
- **Release expectation:** no open blocking risks, no open accessibility failures in core flows, and no unresolved persistence-integrity defects

## Step 5: Generate Output

- Resolved execution mode: subagent-assisted generation with final reconciliation in the main workflow
- Output files written:
  - `_bmad-output/test-artifacts/test-design-architecture.md`
  - `_bmad-output/test-artifacts/test-design-qa.md`
  - `_bmad-output/test-artifacts/test-design/aine-bmad-todo-handoff.md`
- Validation summary:
  - Risk matrix and coverage matrix included in final outputs
  - Architecture and QA documents use distinct responsibilities and cross-reference each other
  - System-level BMAD handoff generated for the upcoming epics-and-stories workflow
- Open assumptions:
  - API payload examples, SQLite isolation strategy, and health/readiness endpoints still need implementation decisions
