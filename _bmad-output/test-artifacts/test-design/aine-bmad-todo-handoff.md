---
title: "TEA Test Design -> BMAD Handoff Document"
version: "1.0"
workflowType: "testarch-test-design-handoff"
inputDocuments:
  - _bmad-output/test-artifacts/test-design-architecture.md
  - _bmad-output/test-artifacts/test-design-qa.md
sourceWorkflow: "testarch-test-design"
generatedBy: "TEA Master Test Architect"
generatedAt: "2026-04-28"
projectName: "aine-bmad-todo"
---

# TEA -> BMAD Integration Handoff

## Purpose

This document bridges TEA test-design outputs with BMAD epic and story decomposition so that quality requirements, risks, and testability constraints are preserved during implementation planning.

## TEA Artifacts Inventory

| Artifact                 | Path                                                      | BMAD Integration Point                                |
| ------------------------ | --------------------------------------------------------- | ----------------------------------------------------- |
| Test Design Architecture | `_bmad-output/test-artifacts/test-design-architecture.md` | Epic quality requirements and implementation blockers |
| Test Design QA           | `_bmad-output/test-artifacts/test-design-qa.md`           | Story acceptance criteria and test execution guidance |
| Risk Assessment          | Embedded in both docs                                     | Epic risk classification and story priority           |
| Coverage Strategy        | Embedded in QA doc                                        | Story-level test requirements                         |

## Epic-Level Integration Guidance

### Risk References

- **R-001 Persistence integrity** and **R-002 completion/history correctness** should appear as quality gates on the earliest persistence and task-state epics.
- **R-004 accessibility compliance** should be embedded in every UI-facing epic that introduces forms, filters, navigation, or history views.
- **R-007 migration/restart safety** belongs in the platform or deployment-hardening epic, not left as implicit ops work.
- **R-008 fixture isolation** should become a foundation story before broad API or E2E automation is attempted.

### Quality Gates

- No epic touching persisted data should be considered complete without API-level durability coverage for its state transitions.
- No UI epic should be considered complete without keyboard, focus, and semantic-label acceptance criteria.
- No deployment or infrastructure epic should be considered complete without migration and restart smoke validation.
- Stories that change error handling must preserve structured error payloads and user-safe recovery messaging.

## Story-Level Integration Guidance

### P0/P1 Test Scenarios -> Story Acceptance Criteria

- **TD-API-001 / TD-API-002** should become acceptance criteria on list and task CRUD stories.
- **TD-API-003** should become acceptance criteria on completion/history stories.
- **TD-E2E-001** should anchor the primary end-to-end acceptance path for the first usable slice.
- **TD-E2E-002** should anchor accessibility acceptance criteria for core UI stories.
- **TD-E2E-003** should anchor error-recovery acceptance criteria for mutation stories.
- **TD-API-006** should anchor acceptance criteria for migration and deployment-readiness stories.

### Data-TestId Requirements

Recommend adding stable `data-testid` hooks for:

- `list-create-button`
- `list-name-input`
- `list-nav-item`
- `task-create-button`
- `task-title-input`
- `task-description-input`
- `task-tag-input`
- `task-complete-toggle`
- `tag-filter-bar`
- `tag-filter-chip`
- `history-nav-link`
- `error-banner`
- `success-notice`
- `loading-state`
- `empty-state`

## Risk-to-Story Mapping

| Risk ID | Category | P×I | Recommended Story/Epic                             | Test Level      |
| ------- | -------- | --- | -------------------------------------------------- | --------------- |
| R-001   | DATA     | 2x3 | Persistence foundation and CRUD stories            | API + E2E       |
| R-002   | DATA     | 2x3 | Completion/history stories                         | API + E2E       |
| R-003   | BUS      | 2x2 | Tag filter and state-management stories            | Unit + API      |
| R-004   | BUS      | 2x3 | Core UI and accessibility hardening stories        | Component + E2E |
| R-005   | PERF     | 2x2 | Performance-smoke hardening story                  | API             |
| R-006   | SEC      | 2x2 | Validation and error-handling stories              | Unit + API      |
| R-007   | OPS      | 2x3 | Migration, startup, and deployment-hardening story | API             |
| R-008   | TECH     | 3x2 | Test-fixture and automation-foundation story       | API             |
| R-009   | OPS      | 2x2 | Observability and health-endpoint story            | API             |

## Recommended BMAD -> TEA Workflow Sequence

1. **TEA Test Design** (`TD`) -> produces this handoff document
2. **BMAD Create Epics & Stories** -> consumes this handoff and embeds quality requirements
3. **TEA ATDD** (`AT`) -> generates acceptance tests per story
4. **BMAD Implementation** -> developers implement with test-first guidance
5. **TEA Automate** (`TA`) -> expands automated coverage
6. **TEA Trace** (`TR`) -> validates coverage completeness

## Phase Transition Quality Gates

| From Phase          | To Phase            | Gate Criteria                                                                                             |
| ------------------- | ------------------- | --------------------------------------------------------------------------------------------------------- |
| Test Design         | Epic/Story Creation | All P0 risks have mitigation strategies and owners                                                        |
| Epic/Story Creation | ATDD                | Stories include acceptance criteria derived from TD-API-001/002/003 and TD-E2E-001/002/003 where relevant |
| ATDD                | Implementation      | Failing acceptance tests or explicit test tasks exist for all P0 scenarios                                |
| Implementation      | Test Automation     | All P0 acceptance tests pass and P1 gaps are planned                                                      |
| Test Automation     | Release             | P0 pass rate is 100%, P1 pass rate is >=95%, and R-001/R-002/R-004/R-007/R-008 are closed                 |
