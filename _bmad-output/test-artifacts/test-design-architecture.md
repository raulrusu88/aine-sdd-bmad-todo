---
workflowStatus: "complete"
totalSteps: 5
stepsCompleted:
  - step-01-detect-mode
  - step-02-load-context
  - step-03-risk-and-testability
  - step-04-coverage-plan
  - step-05-generate-output
lastStep: "step-05-generate-output"
nextStep: ""
lastSaved: "2026-04-28"
workflowType: "testarch-test-design"
inputDocuments:
  - _bmad-output/planning-artifacts/PRD.md
  - _bmad-output/planning-artifacts/architecture.md
---

# Test Design for Architecture: aine-bmad-todo

**Purpose:** Architectural concerns, testability gaps, and NFR requirements for review by Architecture and Engineering. This document serves as a contract between QA and Engineering on what must be addressed before test development begins.

**Date:** 2026-04-28
**Author:** Raul
**Status:** Architecture Review Pending
**Project:** aine-bmad-todo
**PRD Reference:** \_bmad-output/planning-artifacts/PRD.md
**ADR Reference:** \_bmad-output/planning-artifacts/architecture.md

---

## Executive Summary

**Scope:** System-level test design for a single-user task-management web app covering list management, task CRUD, tagging, filtering, completion/history, persistence, accessibility, and deployment durability.

**Business Context:**

- **Revenue/Impact:** Personal-use product; success depends on daily utility and trust rather than commercial metrics.
- **Problem:** Users need low-friction task capture and retrieval without losing structure as data grows.
- **GA Launch:** Single v1 release.

**Architecture** (from the approved architecture document):

- **Key Decision 1:** Nuxt 4.4.2 provides the SPA shell and server-route API boundary.
- **Key Decision 2:** SQLite plus Drizzle ORM provides durable local persistence with formal migrations.
- **Key Decision 3:** Vitest covers unit and integration tests; Playwright covers E2E, browser, and accessibility validation.

**Expected Scale:** Personal-use workload, modest data volume, no external integrations, no authentication, and no real-time synchronization in v1.

**Risk Summary:**

- **Total risks:** 9
- **High-priority (>=6):** 5 risks requiring immediate mitigation
- **Test effort:** ~52-84 hours (~1.5-2.5 weeks for 1 QA)

---

## Quick Guide

### 🚨 BLOCKERS - Team Must Decide (Can't Proceed Without)

**Pre-Implementation Critical Path**

1. **BLK-001: Test database isolation strategy** - Define whether automated suites use isolated SQLite files, transactional resets, or per-worker storage. Recommended owner: Engineering. Timeline: foundation setup.
2. **BLK-002: Deterministic seed and cleanup pattern** - Provide one canonical fixture/data-factory approach for lists, tasks, tags, and history states. Recommended owner: Engineering. Timeline: foundation setup.
3. **BLK-003: API contract examples** - Publish valid and invalid request/response examples for list, task, filter, completion, and error flows. Recommended owner: Engineering. Timeline: API scaffolding.

**What we need from team:** Complete these three items before QA scales integration and E2E coverage.

### ⚠️ HIGH PRIORITY - Team Should Validate (We Provide Recommendation, You Approve)

1. **R-001: Persistence integrity** - Approve repository and API integration coverage as the primary safeguard for CRUD, refresh, restart, and durability behavior. Implementation phase.
2. **R-002: Completion/history correctness** - Approve direct state-transition testing at service/API level before relying on browser-level proof. Implementation phase.
3. **R-004: Accessibility as release gate** - Confirm WCAG 2.2 AA, keyboard support, and assistive-technology compatibility remain mandatory for v1. Pre-release hardening.
4. **R-007: Migration and restart safety** - Approve migration smoke coverage and startup verification before Docker deployment is considered stable. Deployment hardening.
5. **R-008: Parallel-safe fixture strategy** - Approve isolated DB and cleanup rules before introducing broader parallel suites. Foundation setup.

**What we need from team:** Confirm these recommendations and assign owners inside engineering planning.

### 📋 INFO ONLY - Solutions Provided (Review, No Decisions Needed)

1. **Test strategy:** Most persistence and contract risk is cheaper and more deterministic at unit/API level; Playwright is reserved for critical user journeys, accessibility, and responsive/browser validation.
2. **Coverage footprint:** 18 scenario groups across P0-P3, with P0 biased toward durability, completion/history, and accessibility.
3. **Execution rhythm:** PR for fast functional coverage, nightly for the full P0/P1 matrix, weekly for hardening and operational drills.

**What we need from team:** Review and acknowledge.

---

## For Architects and Devs - Open Topics 👷

### Risk Assessment

**Total risks identified:** 9 (5 high-priority score >=6, 4 medium, 0 low)

#### High-Priority Risks (Score >=6) - IMMEDIATE ATTENTION

| Risk ID   | Category | Description                                                                                                        | Probability | Impact | Score | Mitigation                                                                                              | Owner            | Timeline                              |
| --------- | -------- | ------------------------------------------------------------------------------------------------------------------ | ----------- | ------ | ----- | ------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------- |
| **R-001** | **DATA** | Persisted task or list state becomes inconsistent across create, edit, complete, delete, refresh, or restart flows | 2           | 3      | **6** | Integration coverage for CRUD, completion, refresh, and restart behavior using isolated SQLite fixtures | Engineering      | Before feature implementation expands |
| **R-002** | **DATA** | Completion and history transitions duplicate, lose, or misclassify tasks                                           | 2           | 3      | **6** | Service/API state-transition tests plus browser proof for complete and history retrieval                | Engineering      | Before history UI is done             |
| **R-004** | **BUS**  | Keyboard, focus, label, or screen-reader behavior regresses below WCAG 2.2 AA in core flows                        | 2           | 3      | **6** | Accessibility assertions across create, edit, filter, complete, and history flows                       | Engineering + QA | Before release candidate              |
| **R-007** | **OPS**  | SQLite migrations or mounted-volume handling fail during deployment or restart                                     | 2           | 3      | **6** | Migration smoke, startup verification, and documented restore/reset flows                               | Engineering      | Before Docker path is finalized       |
| **R-008** | **TECH** | Missing deterministic fixture setup and cleanup makes integration and E2E suites flaky or slow                     | 3           | 2      | **6** | Shared data factories, isolated DB files, and enforced cleanup discipline                               | Engineering      | Before first broad parallel suite     |

#### Medium-Priority Risks (Score 3-5)

| Risk ID | Category | Description                                                                            | Probability | Impact | Score | Mitigation                                                                 | Owner       |
| ------- | -------- | -------------------------------------------------------------------------------------- | ----------- | ------ | ----- | -------------------------------------------------------------------------- | ----------- |
| R-003   | BUS      | Tag filtering semantics drift between store state, API query behavior, and persistence | 2           | 2      | 4     | Canonical filter rules plus unit and API coverage                          | Engineering |
| R-005   | PERF     | Core interactions exceed NFR expectations on mobile or realistic personal-use volumes  | 2           | 2      | 4     | Lightweight API and UI performance smoke                                   | Engineering |
| R-006   | SEC      | Invalid input or server errors leak internals or bypass validation boundaries          | 2           | 2      | 4     | Negative-path contract coverage for validation and sanitized errors        | Engineering |
| R-009   | OPS      | Weak observability slows diagnosis during test runs and manual deployments             | 2           | 2      | 4     | Stable error codes, log fields, and lightweight health/readiness endpoints | Engineering |

#### Low-Priority Risks (Score 1-2)

No low-priority risks were identified in the current architecture.

#### Risk Category Legend

- **TECH**: Technical or architecture issues
- **SEC**: Security and validation issues
- **PERF**: Performance and responsiveness concerns
- **DATA**: Data integrity and consistency issues
- **BUS**: User-visible behavior and product-value risks
- **OPS**: Deployment, restart, or observability concerns

---

### Testability Concerns and Architectural Gaps

**🚨 ACTIONABLE CONCERNS - Architecture Team Must Address**

#### 1. Blockers to Fast Feedback (WHAT WE NEED FROM ARCHITECTURE)

| Concern                                | Impact                                                      | What Architecture Must Provide                                          | Owner       | Timeline               |
| -------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------- | ----------- | ---------------------- |
| **No explicit seed/reset strategy**    | Integration and E2E suites will be slow and fragile         | One canonical approach for isolated DB setup, reset, and teardown       | Engineering | Foundation setup       |
| **No sample payload catalog**          | Negative-path and contract tests will drift                 | Valid and invalid request/response examples for each endpoint family    | Engineering | API scaffolding        |
| **No fault-injection path**            | Error-state and retry behavior will be under-tested         | Test seams for repository stubs and deterministic server error triggers | Engineering | Foundation setup       |
| **Parallel-safety rules are implicit** | Test state leakage will appear once suites run concurrently | Per-worker or per-suite isolation rules and cleanup discipline          | Engineering | Before parallel suites |

#### 2. Architectural Improvements Needed (WHAT SHOULD BE CHANGED)

1. **Observability contract**
   - **Current problem:** Logging is mentioned, but error-code families, log fields, and health/readiness endpoints are not yet defined.
   - **Required change:** Standardize error codes, key log fields, and basic health checks.
   - **Impact if not fixed:** Slower diagnosis for failed automated runs and restart/deploy issues.
   - **Owner:** Engineering
   - **Timeline:** Platform foundation

2. **Migration and startup verification**
   - **Current problem:** Migration smoke and startup-readiness behavior are not yet codified.
   - **Required change:** Add migration smoke coverage and startup verification against isolated databases.
   - **Impact if not fixed:** Schema drift and restart failures may surface late.
   - **Owner:** Engineering
   - **Timeline:** Deployment hardening

---

### Testability Assessment Summary

**📊 CURRENT STATE - FYI**

#### What Works Well

- ✅ Clean boundaries between UI, stores, API routes, services, repositories, and persistence make level selection straightforward.
- ✅ No external services in v1 keeps environments deterministic and cheaper to control.
- ✅ Zod validation and structured error responses create strong hooks for negative-path testing.
- ✅ The architecture already reserves clear homes for integration, persistence, and E2E suites.

#### Accepted Trade-offs (No Action Required)

- **No cache layer in v1** - acceptable at this scale; correctness matters more than optimization.
- **No external observability platform** - acceptable for a solo-maintained product if logs and health checks are made consistent.
- **No auth in v1** - acceptable because the product is single-user and self-contained.

This is technical debt that should be revisited later only if scale or product scope changes.

---

### Risk Mitigation Plans (High-Priority Risks >=6)

#### R-001: Persistence integrity across CRUD, refresh, and restart (Score: 6)

**Mitigation Strategy:**

1. Add repository and API integration tests for create, edit, delete, complete, refresh, and restart-sensitive flows.
2. Use isolated SQLite fixtures so persistence behavior is reproducible and parallel-safe.
3. Add one browser proof of the end-to-end persisted journey.

**Owner:** Engineering
**Timeline:** Before feature implementation expands
**Status:** Planned
**Verification:** CRUD, refresh, and restart flows all pass against isolated SQLite runs.

#### R-002: Completion/history state-transition correctness (Score: 6)

**Mitigation Strategy:**

1. Define canonical service behavior for active, completed, and history states.
2. Add API tests for complete, history retrieval, and duplicate/loss edge cases.
3. Verify one browser flow for complete plus history recall.

**Owner:** Engineering
**Timeline:** Before history UI is done
**Status:** Planned
**Verification:** No task duplication, disappearance, or misclassification across active/history views.

#### R-004: Accessibility compliance in core flows (Score: 6)

**Mitigation Strategy:**

1. Treat semantic markup, focus states, and labels as implementation requirements, not polish.
2. Add browser-level accessibility assertions for create, edit, filter, complete, and history flows.
3. Keep accessibility regressions release-blocking.

**Owner:** Engineering + QA
**Timeline:** Before release candidate
**Status:** Planned
**Verification:** Core journeys are keyboard-complete, clearly labeled, and screen-reader understandable.

#### R-007: SQLite migration and mounted-volume durability (Score: 6)

**Mitigation Strategy:**

1. Add migration smoke validation against clean and existing databases.
2. Verify startup readiness against a mounted SQLite path.
3. Document reset and restore expectations for local and containerized runs.

**Owner:** Engineering
**Timeline:** Before Docker path is finalized
**Status:** Planned
**Verification:** Migrations are repeatable, startup succeeds, and persisted data survives restart.

#### R-008: Deterministic fixture setup for reliable automation (Score: 6)

**Mitigation Strategy:**

1. Define isolated DB allocation per worker or suite.
2. Publish shared data-factory and cleanup conventions.
3. Prevent test expansion until fixture isolation is proven stable.

**Owner:** Engineering
**Timeline:** Before first broad parallel suite
**Status:** Planned
**Verification:** Parallel test runs complete without cross-test state leakage.

---

### Assumptions and Dependencies

#### Assumptions

1. Nuxt server routes remain the only backend API surface in v1.
2. SQLite remains the single persistence dependency and is mounted outside the container filesystem.
3. Zod validation is enforced before any write reaches persistence.
4. Accessibility remains a v1 delivery gate rather than a post-release improvement.

#### Dependencies

1. Drizzle schema and migration files must exist before integration coverage can stabilize.
2. Error-code families and payload examples must be published before negative-path tests can scale.
3. Docker startup behavior and mounted-volume path conventions must be finalized before deployment smoke coverage.
4. Health/readiness endpoint conventions are required before operational smoke checks can be added.

#### Risks to Plan

- **Risk:** Fixture isolation is deferred until after feature work begins.
  - **Impact:** Automation becomes flaky and expensive to maintain.
  - **Contingency:** Treat BLK-001 and BLK-002 as foundation work, not optional hardening.
- **Risk:** Accessibility is treated as downstream cleanup.
  - **Impact:** Core UI may need costly rework late in the cycle.
  - **Contingency:** Keep R-004 active in story acceptance criteria from the first UI stories.

---

**Next Steps for Architecture Team:**

1. Resolve the three blockers in Quick Guide.
2. Assign engineering owners for R-001, R-002, R-004, R-007, and R-008.
3. Confirm payload examples, error codes, and DB isolation rules before QA expands automation.

**Next Steps for QA Team:**

1. Use the companion test-design-qa.md for execution guidance.
2. Wait for blocker resolution before writing broad integration suites.
3. Prepare fixture, factory, and accessibility test scaffolding in parallel.
