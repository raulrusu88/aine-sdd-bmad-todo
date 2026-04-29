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

# Test Design for QA: aine-bmad-todo

**Purpose:** Test execution recipe for QA. Defines what to test, how to test it, and what QA needs from other teams.

**Date:** 2026-04-28
**Author:** Raul
**Status:** Draft
**Project:** aine-bmad-todo

**Related:** See test-design-architecture.md for testability concerns and architectural blockers.

---

## Executive Summary

**Scope:** Full-system test coverage for list and task CRUD, tagging, filter behavior, completion/history transitions, persistence, responsive use, accessibility, and deployment-smoke durability.

**Risk Summary:**

- Total Risks: 9 (5 high-priority score >=6, 4 medium)
- Critical Categories: DATA, BUS, OPS, and TECH

**Coverage Summary:**

- P0 tests: ~7 scenario groups
- P1 tests: ~7 scenario groups
- P2 tests: ~3 scenario groups
- P3 tests: ~1 scenario group
- **Total:** ~18 scenario groups (~1.5-2.5 weeks with 1 QA)

---

## Not in Scope

**Components or systems explicitly excluded from this test plan:**

| Item                                                  | Reasoning                           | Mitigation                                                              |
| ----------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------- |
| **Authentication and authorization**                  | Explicitly out of scope for v1      | Security testing focuses on validation and sanitized errors instead     |
| **External integrations**                             | No third-party services exist in v1 | Coverage stays inside Nuxt routes, SQLite, and local runtime boundaries |
| **Real-time synchronization**                         | Not required by PRD or architecture | Standard request-response flows cover the product scope                 |
| **Advanced search, reminders, priorities, deadlines** | Post-MVP scope                      | Risk remains outside this test plan and can be revisited later          |

---

## Dependencies & Test Blockers

**CRITICAL:** QA cannot proceed without these items from other teams.

### Backend/Architecture Dependencies (Pre-Implementation)

1. **SQLite isolation strategy** - Engineering - foundation setup
   - QA needs one agreed approach for isolated DB files or reset discipline.
   - Without it, integration and E2E suites will leak state and become flaky.

2. **Published API examples** - Engineering - API scaffolding
   - QA needs valid and invalid request/response examples for lists, tasks, tags, completion, and error flows.
   - Without them, contract and negative-path coverage will drift.

3. **Stable error response contract** - Engineering - API scaffolding
   - QA needs consistent error codes and user-safe messages.
   - Without it, error-path assertions are unstable and UI recovery tests lose signal.

4. **Migration and startup behavior** - Engineering - deployment hardening
   - QA needs a clear way to exercise migrations and restart behavior.
   - Without it, R-007 cannot be validated.

### QA Infrastructure Setup (Pre-Implementation)

1. **Test Data Factories** - QA
   - Task, list, and tag factories with deterministic overrides and cleanup support.

2. **Test Environments** - QA
   - Local: isolated SQLite file, Vitest, and Playwright.
   - CI/CD: same setup, repeatable without manual seeding.
   - Staging: same API shape and migration behavior before release validation.

3. **Playwright and Vitest Configuration** - QA
   - Playwright browsers: Chromium, WebKit, Firefox.
   - Viewports: desktop plus one representative mobile profile.
   - Tagged execution for `@P0`, `@P1`, `@P2`, `@P3`, `@API`, `@E2E`, and `@A11y`.

4. **Cleanup Discipline** - QA
   - One teardown path for seeded data and one reset path for full DB recreation.

**Example factory pattern:**

```typescript
import { test } from "@seontechnologies/playwright-utils/api-request/fixtures";
import { expect } from "@playwright/test";

test("@P0 @API create list and fetch it again", async ({ apiRequest }) => {
  const { status: createStatus, body: created } = await apiRequest({
    method: "POST",
    path: "/api/lists",
    body: { name: "Test List" },
  });

  expect(createStatus).toBe(201);

  const { status: fetchStatus, body: fetched } = await apiRequest({
    method: "GET",
    path: `/api/lists/${created.id}`,
  });

  expect(fetchStatus).toBe(200);
  expect(fetched.name).toBe("Test List");
});
```

---

## Risk Assessment

**Note:** Full risk details live in test-design-architecture.md. This section summarizes what QA must cover.

### High-Priority Risks (Score >=6)

| Risk ID   | Category | Description                                                                     | Score | QA Test Coverage                                       |
| --------- | -------- | ------------------------------------------------------------------------------- | ----- | ------------------------------------------------------ |
| **R-001** | DATA     | Persisted task/list state becomes inconsistent across CRUD, refresh, or restart | **6** | TD-API-001, TD-API-002, TD-API-003, TD-E2E-001         |
| **R-002** | DATA     | Completion and history transitions duplicate, lose, or misclassify tasks        | **6** | TD-API-003, TD-E2E-001, TD-E2E-003                     |
| **R-004** | BUS      | Accessibility regresses below WCAG 2.2 AA in core flows                         | **6** | TD-COMP-001, TD-E2E-002                                |
| **R-007** | OPS      | SQLite migrations or mounted-volume handling fail during deployment or restart  | **6** | TD-API-006, TD-OPS-002                                 |
| **R-008** | TECH     | Missing deterministic fixture setup causes flaky or slow suites                 | **6** | QA fixture foundation plus isolated DB execution rules |

### Medium/Low-Priority Risks

| Risk ID | Category | Description                                                        | Score | QA Test Coverage        |
| ------- | -------- | ------------------------------------------------------------------ | ----- | ----------------------- |
| R-003   | BUS      | Tag filtering semantics drift between store, API, and persistence  | 4     | TD-UNIT-002, TD-API-004 |
| R-005   | PERF     | Core interactions exceed NFR expectations                          | 4     | TD-API-007              |
| R-006   | SEC      | Invalid input or server errors leak internals or bypass validation | 4     | TD-UNIT-001, TD-E2E-003 |
| R-009   | OPS      | Weak observability slows diagnosis                                 | 4     | TD-OPS-001              |

---

## Entry Criteria

**QA testing cannot begin until ALL of the following are met:**

- [ ] All core requirements and architecture constraints are agreed
- [ ] Test environments are provisioned and accessible
- [ ] Test data factories or seed flows are ready
- [ ] Pre-implementation blockers from the architecture doc are resolved
- [ ] Feature code is deployed to a QA-capable environment
- [ ] SQLite reset and migration paths are documented

## Exit Criteria

**Testing phase is complete when ALL of the following are met:**

- [ ] All P0 tests are passing
- [ ] All P1 tests are passing, or remaining failures are triaged and accepted
- [ ] No open high-priority or high-severity bugs remain
- [ ] Accessibility failures in core flows are closed
- [ ] Persistence and history flows show no open data-loss or duplication defects
- [ ] Coverage is sufficient for all P0 and P1 risks

---

## Test Coverage Plan

**IMPORTANT:** P0/P1/P2/P3 = **priority and risk level**, NOT execution timing. See Execution Strategy for when tests run.

### P0 (Critical)

**Criteria:** Blocks core functionality + high risk (>=6) + no workaround

| Test ID         | Requirement                         | Test Level | Risk Link    | Notes                                                           |
| --------------- | ----------------------------------- | ---------- | ------------ | --------------------------------------------------------------- |
| **TD-UNIT-001** | Validation and safe error mapping   | Unit       | R-006        | Covers malformed payloads and sanitized error translation       |
| **TD-API-001**  | List CRUD persistence               | API        | R-001        | Stable create/read/update/delete behavior                       |
| **TD-API-002**  | Task CRUD with description and tags | API        | R-001        | Primary persisted task contract                                 |
| **TD-API-003**  | Complete and history transitions    | API        | R-001, R-002 | No duplication or loss across state transitions                 |
| **TD-E2E-001**  | Core user journey                   | E2E        | R-001, R-002 | List -> task -> tag -> filter -> complete -> history -> refresh |
| **TD-E2E-002**  | Keyboard and accessibility journey  | E2E        | R-004        | Focus, labels, keyboard-only use, state clarity                 |
| **TD-E2E-003**  | Save failure and recovery           | E2E        | R-001, R-006 | User-safe error handling and retry preservation                 |

**Total P0:** ~7 scenario groups

---

### P1 (High)

**Criteria:** Important features + medium risk + common workflows

| Test ID         | Requirement                          | Test Level | Risk Link | Notes                                                        |
| --------------- | ------------------------------------ | ---------- | --------- | ------------------------------------------------------------ |
| **TD-UNIT-002** | Filter predicate logic               | Unit       | R-003     | Tag selection, clear filter, completion state, list scoping  |
| **TD-COMP-001** | Task form accessibility and feedback | Component  | R-004     | Labels, focus management, keyboard submit, field errors      |
| **TD-API-004**  | Tag filter query semantics           | API        | R-003     | Correct behavior across active/completed and list boundaries |
| **TD-API-005**  | Rename and delete semantics          | API        | R-006     | Success, not-found, and recovery-safe responses              |
| **TD-API-006**  | Migration and startup smoke          | API        | R-007     | Schema readiness and restart behavior                        |
| **TD-E2E-004**  | Mobile viewport core flow            | E2E        | R-005     | Core actions remain usable on small screens                  |
| **TD-E2E-005**  | Cross-browser smoke                  | E2E        | R-005     | Main journey in Chromium, WebKit, and Firefox                |

**Total P1:** ~7 scenario groups

---

### P2 (Medium)

**Criteria:** Secondary features + low/medium risk + edge cases

| Test ID         | Requirement            | Test Level | Risk Link | Notes                                                          |
| --------------- | ---------------------- | ---------- | --------- | -------------------------------------------------------------- |
| **TD-COMP-002** | Feedback states        | Component  | R-006     | Loading, empty, success, and error rendering                   |
| **TD-API-007**  | Response-time smoke    | API        | R-005     | Lightweight timing checks for create, update, filter, complete |
| **TD-OPS-001**  | Health/readiness smoke | API        | R-009     | Added when observability endpoints exist                       |

**Total P2:** ~3 scenario groups

---

### P3 (Low)

**Criteria:** Nice-to-have + exploratory + hardening

| Test ID        | Requirement                  | Test Level | Notes                                                  |
| -------------- | ---------------------------- | ---------- | ------------------------------------------------------ |
| **TD-OPS-002** | Backup and restore rehearsal | API        | Release-hardening validation for mounted SQLite volume |

**Total P3:** ~1 scenario group

---

## Execution Strategy

**Philosophy:** Run everything in PRs if total functional runtime stays under 15 minutes; defer only expensive or long-running coverage.

### Every PR: Playwright and Vitest Functional Tests (~10-15 min)

- Run all unit, component, API, and the smallest browser slice needed for fast feedback.
- Target tags: `@P0`, `@P1`, `@API`, and the minimal `@E2E` smoke subset.
- Keep PR failures actionable and deterministic.

### Nightly: Extended Functional and Performance Smoke (~30-60 min)

- Run the full P0 and P1 matrix, including accessibility, mobile viewport, and cross-browser smoke.
- Add lightweight performance smoke for create, update, filter, and complete operations.

### Weekly: Long-Running Hardening (~hours)

- Run backup/restore rehearsal, restart and migration drills, and any extended data-volume checks.
- Add observability smoke once health/readiness endpoints exist.

---

## QA Effort Estimate

**QA test development effort only**

| Priority  | Count               | Effort Range       | Notes                                                                    |
| --------- | ------------------- | ------------------ | ------------------------------------------------------------------------ |
| P0        | ~7 scenario groups  | ~0.5-1 week        | Foundation risk coverage: persistence, completion/history, accessibility |
| P1        | ~7 scenario groups  | ~0.5-1 week        | Filtering, migration/startup, mobile, and browser confidence             |
| P2        | ~3 scenario groups  | ~0.25-0.5 week     | Feedback-state and performance smoke                                     |
| P3        | ~1 scenario group   | ~0.25 week         | Hardening-only operational drill                                         |
| **Total** | ~18 scenario groups | **~1.5-2.5 weeks** | **1 QA engineer, full-time**                                             |

**Assumptions:**

- Includes design, implementation, debugging, and CI wiring.
- Assumes fixture/data-factory foundation exists before broad API and E2E work.
- Excludes ongoing suite maintenance.

---

## Implementation Planning Handoff (Optional)

| Work Item                              | Owner            | Target Milestone (Optional) | Dependencies/Notes                     |
| -------------------------------------- | ---------------- | --------------------------- | -------------------------------------- |
| Fixture and isolated SQLite foundation | QA + Engineering | Foundation setup            | Depends on blocker resolution          |
| P0 API persistence suite               | QA               | Core backend iteration      | Needs stable CRUD endpoints and schema |
| Accessibility browser suite            | QA + Engineering | UI hardening                | Needs semantic markup and focus states |
| Migration/startup smoke                | QA + Engineering | Deployment hardening        | Needs Docker and migration path        |

---

## Interworking & Regression

**Services and components impacted by this feature:**

| Service/Component                                                     | Impact                         | Regression Scope                              | Validation Steps                    |
| --------------------------------------------------------------------- | ------------------------------ | --------------------------------------------- | ----------------------------------- |
| **app/components/lists/**                                             | Core list management UI        | Create, rename, delete, select list           | API plus E2E core flow              |
| **app/components/tasks/**                                             | Core task interaction UI       | Create, edit, delete, complete, metadata      | API, component, and E2E validation  |
| **app/components/filters/** and **app/composables/useTaskFilters.ts** | Filtering semantics            | Tag selection, clear filter, list scoping     | Unit plus API validation            |
| **server/api/** plus **db/**                                          | Contract and persistence layer | CRUD, completion/history, migrations, restart | API integration and hardening smoke |

**Regression test strategy:**

- Run the full P0 matrix on every candidate branch.
- Run P1 browser and migration smoke nightly.
- Keep any fix to R-001, R-002, or R-004 covered by a regression test before merge.

---

## Appendix A: Code Examples & Tagging

```typescript
import { test } from "@seontechnologies/playwright-utils/api-request/fixtures";
import { expect } from "@playwright/test";

test("@P0 @API list create returns persisted payload", async ({
  apiRequest,
}) => {
  const { status, body } = await apiRequest({
    method: "POST",
    path: "/api/lists",
    body: { name: "Inbox" },
  });

  expect(status).toBe(201);
  expect(body.name).toBe("Inbox");
});
```

```bash
# Run only P0 tests
npx playwright test --grep @P0

# Run P0 + P1 tests
npx playwright test --grep "@P0|@P1"
```

---

## Appendix B: Knowledge Base References

- `risk-governance.md` - risk scoring and gate logic
- `probability-impact.md` - scoring thresholds and action categories
- `test-levels-framework.md` - unit/component/API/E2E selection
- `test-priorities-matrix.md` - P0-P3 criteria
- `test-quality.md` - deterministic test quality bar

---

**Generated by:** BMad TEA Agent
**Workflow:** `bmad-testarch-test-design`
