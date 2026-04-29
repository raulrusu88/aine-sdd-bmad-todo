---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - /Users/raul/Documents/Development/Work/nearform/aine-program-spec-driven-dev/aine-bmad-todo/_bmad-output/planning-artifacts/PRD.md
  - /Users/raul/Documents/Development/Work/nearform/aine-program-spec-driven-dev/aine-bmad-todo/_bmad-output/planning-artifacts/architecture.md
  - /Users/raul/Documents/Development/Work/nearform/aine-program-spec-driven-dev/aine-bmad-todo/_bmad-output/test-artifacts/test-design-architecture.md
  - /Users/raul/Documents/Development/Work/nearform/aine-program-spec-driven-dev/aine-bmad-todo/_bmad-output/test-artifacts/test-design-qa.md
  - /Users/raul/Documents/Development/Work/nearform/aine-program-spec-driven-dev/aine-bmad-todo/_bmad-output/test-artifacts/test-design/aine-bmad-todo-handoff.md
---

# aine-bmad-todo - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for aine-bmad-todo, decomposing the requirements from the PRD, Architecture, and TEA test-design artifacts into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Users can create multiple named todo lists.
FR2: Users can view all available todo lists.
FR3: Users can rename an existing todo list.
FR4: Users can delete an existing todo list.
FR5: Users can open a specific todo list and work within its tasks.
FR6: Users can create a task within a selected todo list.
FR7: Users can provide a short title for each task.
FR8: Users can add an optional detailed description to a task.
FR9: Users can edit an existing task's title.
FR10: Users can edit an existing task's description.
FR11: Users can delete a task.
FR12: Users can view basic task metadata, including creation time.
FR13: Users can assign one or more tags to a task.
FR14: Users can remove tags from a task.
FR15: Users can view the tags associated with a task.
FR16: Users can filter tasks by tag.
FR17: Users can clear an applied tag filter and return to the unfiltered task view.
FR18: Users can mark a task as completed.
FR19: Users can view active tasks separately from completed tasks.
FR20: Users can access completed tasks as retained history rather than losing them on completion.
FR21: Users can locate a previously completed task from history.
FR22: Users can distinguish whether a task is active or completed.
FR23: Users can return to the application after a page refresh and access their saved lists and tasks.
FR24: Users can return in a later session and access previously saved lists, tasks, tags, descriptions, and completion state.
FR25: Users can retrieve the same task information consistently across the application's core views.
FR26: Users can tell when task or list data is being loaded.
FR27: Users can tell when no lists or tasks are available.
FR28: Users can receive clear feedback when an action succeeds.
FR29: Users can receive clear feedback when an action fails.
FR30: Users can understand what failed and what to do next when an error occurs.
FR31: Developers can access application operations that support list creation, retrieval, update, and deletion.
FR32: Developers can access application operations that support task creation, retrieval, update, deletion, and completion.
FR33: Developers can access application operations that support tag-based task filtering.
FR34: Developers can access application operations that support retrieval of completed-task history.
FR35: Maintainers can identify the action associated with an application failure through system feedback and error reporting.

### NonFunctional Requirements

NFR1: The application becomes interactive within 3 seconds under normal personal-use conditions on supported modern browsers and typical broadband or mobile connections.
NFR2: Core user actions such as creating a list, creating a task, updating a task, completing a task, and applying or clearing a tag filter provide a confirmed result or an actionable error within 2 seconds under normal conditions.
NFR3: Switching between lists, active tasks, completed history, and filtered views updates visible state within 1 second for expected personal-use data volumes.
NFR4: Successfully completed create, update, delete, tagging, filtering, and completion actions persist across browser refreshes and later sessions.
NFR5: Page reloads and routine application restarts do not erase previously saved lists, tasks, tags, descriptions, or completion history.
NFR6: When a write action fails, the system does not silently lose, duplicate, or misrepresent data.
NFR7: When an operation fails, the system preserves enough user context for the user to retry or recover without unnecessary re-entry of information.
NFR8: All v1 core flows meet WCAG 2.2 AA.
NFR9: All core flows are fully operable by keyboard alone.
NFR10: Form fields, controls, task state, filter state, and error messages are programmatically exposed to assistive technologies.
NFR11: Interactive elements and task-status cues maintain visible focus indicators and sufficient contrast across supported views.
NFR12: V1 works reliably in current stable versions of Chrome, Safari, Firefox, and Edge on desktop, plus Safari on iOS and Chrome on Android.
NFR13: All core flows remain usable on common mobile viewport sizes without loss of critical functionality.
NFR14: Browser differences do not block task creation, editing, tagging, filtering, completion, or history access.
NFR15: The system validates all user-provided input before it is persisted or processed.
NFR16: User-facing error messages do not expose internal system details, raw exceptions, or storage internals.
NFR17: When deployed over a network, data exchanged between client and server is transmitted over secure transport.

### Additional Requirements

- Use the existing Nuxt 4.4.2 application as the approved full-stack starter baseline rather than introducing a separate frontend/backend split.
- Treat project bootstrap and installation as explicit implementation scope: preserve the existing npm-based workflow and support standard setup and run commands for development, build, preview, and project preparation.
- Add and configure the core implementation dependencies and root config files needed for the chosen stack, including Drizzle, SQLite support, Zod, Pinia, Vitest, Playwright, Docker-related files, and environment examples.
- Use TypeScript as the primary implementation language across client, server, shared types, and test code.
- Use SQLite as the persistence layer with Drizzle ORM and formal migration files committed to the repo.
- Keep the backend inside Nuxt server routes with REST-style JSON endpoints.
- Use Zod validation at API boundaries and reject invalid input before persistence logic runs.
- Use Pinia with action-only mutations for client-side state management.
- Use camelCase in API JSON and snake_case in the database layer, with explicit mapping at the boundary.
- Return direct success payloads and structured error payloads shaped as `{ error: { code, message, details? } }`.
- Use UTC ISO 8601 timestamps consistently at application boundaries.
- Organize implementation feature-first in the app layer and type-based in shared server and database infrastructure.
- Follow the approved project structure from architecture, including root configuration files plus dedicated `app/`, `server/`, `shared/`, `db/`, and `tests/` layers.
- Implement the app layer with the planned substructure for pages, feature components, composables, stores, assets, and feedback UI.
- Implement the server layer with grouped API routes and supporting `errors`, `repositories`, `services`, `mappers`, and `utils` modules.
- Implement the shared and database layers with explicit schema, type, constant, client, migration, and fixture locations.
- Keep `_bmad/` and `_bmad-output/` as planning and workflow-support directories only, not part of the runtime application architecture.
- Support a self-hosted single-container deployment with a mounted persistent SQLite volume.
- Include Vitest for unit and integration tests and Playwright for E2E, browser, and accessibility validation.
- Add a deterministic test database isolation strategy before broad integration or E2E automation begins.
- Provide shared seed, fixture, and cleanup patterns for lists, tasks, tags, and history states.
- Publish valid and invalid API payload examples for CRUD, filtering, completion, history, and error cases.
- Keep accessibility as a release gate, not a post-release hardening task.
- Add migration and startup smoke coverage for SQLite schema readiness and restart safety.
- Standardize stable error-code families, structured logging fields, and lightweight health or readiness conventions as implementation matures.
- Add stable `data-testid` hooks for core list, task, filter, history, loading, success, and error UI surfaces to support automated testing.
- Preserve explicit quality gates in the backlog for persistence integrity, completion/history correctness, accessibility, migration safety, and deterministic automation foundations.

### UX Design Requirements

No separate UX design document exists yet.

### FR Coverage Map

FR1: Epic 1 - Create multiple named todo lists
FR2: Epic 1 - View all available todo lists
FR3: Epic 1 - Rename an existing todo list
FR4: Epic 1 - Delete an existing todo list
FR5: Epic 1 - Open a specific todo list and work within its tasks
FR6: Epic 1 - Create a task within a selected todo list
FR7: Epic 1 - Provide a short title for each task
FR8: Epic 1 - Add an optional detailed description to a task
FR9: Epic 1 - Edit an existing task title
FR10: Epic 1 - Edit an existing task description
FR11: Epic 1 - Delete a task
FR12: Epic 1 - View task metadata including creation time
FR13: Epic 2 - Assign one or more tags to a task
FR14: Epic 2 - Remove tags from a task
FR15: Epic 2 - View the tags associated with a task
FR16: Epic 2 - Filter tasks by tag
FR17: Epic 2 - Clear an applied tag filter and return to the unfiltered task view
FR18: Epic 2 - Mark a task as completed
FR19: Epic 2 - View active tasks separately from completed tasks
FR20: Epic 2 - Retain completed tasks as history rather than losing them on completion
FR21: Epic 3 - Locate a previously completed task from history
FR22: Epic 2 - Distinguish whether a task is active or completed
FR23: Epic 1 - Return after refresh and access saved lists and tasks
FR24: Epic 3 - Return in a later session and access previously saved state
FR25: Epic 3 - Retrieve the same task information consistently across core views
FR26: Epic 1 - Tell when task or list data is being loaded
FR27: Epic 1 - Tell when no lists or tasks are available
FR28: Epic 1 - Receive clear feedback when an action succeeds
FR29: Epic 3 - Receive clear feedback when an action fails
FR30: Epic 3 - Understand what failed and what to do next when an error occurs
FR31: Epic 1 - Access list creation, retrieval, update, and deletion operations as a developer
FR32: Epic 1 and Epic 2 - Access task creation, retrieval, update, deletion, and completion operations as a developer
FR33: Epic 2 - Access tag-based task filtering operations as a developer
FR34: Epic 3 - Access completed-task history retrieval operations as a developer
FR35: Epic 3 - Identify the action associated with an application failure through system feedback and error reporting

## Epic List

### Epic 1: Start and Manage a Personal Task Workspace

Users can install and run the application, create named lists, create and maintain tasks inside those lists, and rely on baseline persistence and clear feedback for day-to-day task management.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR9, FR10, FR11, FR12, FR23, FR26, FR27, FR28, FR31

Epic 1 establishes task create, retrieve, update, and delete operations, while Epic 2 completes FR32 by adding task-completion operations.

### Epic 2: Organize and Focus Work with Tags and Status

Users can classify tasks with tags, filter work to the most relevant items, and manage active versus completed task states without losing clarity.
**FRs covered:** FR13, FR14, FR15, FR16, FR17, FR18, FR19, FR20, FR22, FR32, FR33

### Epic 3: Revisit History and Trust the System Over Time

Users can find previously completed work, return in later sessions with consistent state, recover from failures without confusion, and maintainers can diagnose operational failures reliably.
**FRs covered:** FR21, FR24, FR25, FR29, FR30, FR34, FR35

<!-- Repeat for each epic in epics_list (N = 1, 2, 3...) -->

## Epic 1: Start and Manage a Personal Task Workspace

Users can install and run the application, create named lists, create and maintain tasks inside those lists, and rely on baseline persistence and clear feedback for day-to-day task management.

### Story 1.1: Set Up Initial Project from Starter Template

As a maintainer,
I want the project bootstrapped with the approved installation flow, dependencies, configuration, and folder structure,
So that all later stories are built on a consistent, runnable foundation.

**Acceptance Criteria:**

**Given** the current repository and approved architecture
**When** the maintainer installs dependencies and starts the development environment
**Then** the application runs successfully using the approved stack and baseline scripts
**And** the baseline application shell renders without runtime errors

**Given** the approved architecture decisions
**When** the foundation story is completed
**Then** the repository contains the planned top-level application structure for app, server, shared, db, and tests
**And** the root configuration needed for Nuxt, TypeScript, database migrations, testing, and environment examples is present and consistent with the architecture

### Story 1.2: Create, View, and Open Todo Lists

As a user,
I want to create named todo lists, see all available lists, and open a selected list,
So that I can organize different areas of work in separate spaces.

**Acceptance Criteria:**

**Given** no todo lists exist
**When** the user opens the application
**Then** the application shows a clear empty state with an action to create the first list
**And** the user is not left on a blank or broken screen

**Given** the user provides a valid list name
**When** the user saves the new list
**Then** the list is persisted and displayed in the list collection
**And** the list can be selected as the active workspace

**Given** the user provides an empty, duplicate, or otherwise invalid list name
**When** the user attempts to save the list
**Then** the list is not persisted
**And** the interface explains how to correct the problem without leaving the user in an ambiguous state

**Given** one or more lists exist
**When** the user selects a list
**Then** that list opens as the active workspace for task management
**And** developer-accessible operations exist to create, retrieve, and list todo lists through the application API

### Story 1.3: Rename and Delete Todo Lists

As a user,
I want to rename or remove todo lists I no longer need,
So that my workspace stays accurate and manageable.

**Acceptance Criteria:**

**Given** an existing todo list
**When** the user renames it with a valid new name
**Then** the updated name is shown in the interface and persisted
**And** the list remains available for selection and task management

**Given** an existing todo list
**When** the user chooses to delete it and confirms the action
**Then** the list is removed from the interface and persistence layer
**And** any resulting state transition leaves the user in a safe fallback view

**Given** the deleted list was the active list
**When** deletion completes
**Then** the application returns the user to a safe fallback state without a broken selection
**And** developer-accessible operations exist to update and delete todo lists through the application API

### Story 1.4: Create and View Tasks Within a List

As a user,
I want to create tasks with a short title, an optional description, and visible metadata inside a selected list,
So that I can capture work with enough context to act on it later.

**Acceptance Criteria:**

**Given** a todo list is selected
**When** the user creates a task with a valid short title
**Then** the task is saved inside that list and displayed in the active task view
**And** the user can immediately recognize the task in the list

**Given** the user provides an optional description
**When** the task is saved
**Then** the description is stored and can be viewed as part of the task details
**And** the description remains associated with the correct task

**Given** the user submits invalid task data or the create request fails
**When** the application attempts to save the task
**Then** no misleading new task is shown as persisted
**And** the interface preserves enough context for the user to correct the input or retry the action

**Given** a task has been created
**When** the task is shown in the interface
**Then** the user can see its basic metadata, including creation time
**And** developer-accessible operations exist to create, retrieve, and list tasks for a selected list through the application API

### Story 1.5: Edit and Delete Tasks

As a user,
I want to update or remove tasks in a selected list,
So that my active workspace stays current and trustworthy.

**Acceptance Criteria:**

**Given** an existing task
**When** the user edits the title
**Then** the updated title is shown in the interface and persisted
**And** the task remains associated with the same list

**Given** an existing task with a description
**When** the user edits the description
**Then** the updated description is shown in the interface and persisted
**And** the user can confirm the new details in the task view

**Given** an existing task
**When** the user deletes it and confirms the action
**Then** the task is removed from the active view and persistence layer
**And** developer-accessible operations exist to update and delete tasks through the application API

**Given** a task update or delete operation fails
**When** the failure is returned to the client
**Then** the interface keeps the last confirmed task state visible
**And** the user receives clear guidance to retry or correct the problem

### Story 1.6: Preserve Baseline State and Communicate System Status

As a user,
I want my workspace state preserved across refreshes and I want clear loading, empty, and success feedback,
So that I can trust the application during normal daily use.

**Acceptance Criteria:**

**Given** lists and tasks have already been saved
**When** the user refreshes the application
**Then** the previously saved lists and tasks are loaded back into the workspace
**And** the active workspace remains consistent with the persisted data

**Given** list or task data is being loaded
**When** the relevant screen is displayed
**Then** the interface shows a clear loading state until the data is ready
**And** loading indicators are removed once the operation completes

**Given** no lists or no tasks exist in the current context
**When** the relevant screen is displayed
**Then** the interface shows a clear empty state rather than a blank or broken view
**And** the empty state helps the user understand the next useful action

**Given** the user successfully creates, updates, or deletes a list or task
**When** the operation completes
**Then** the interface shows clear success feedback for that action
**And** the feedback does not obscure the resulting persisted state

## Epic 2: Organize and Focus Work with Tags and Status

Users can classify tasks with tags, filter work to the most relevant items, and manage active versus completed task states without losing clarity.

### Story 2.1: Assign and Display Tags on Tasks

As a user,
I want to add and remove tags on tasks and see those tags clearly,
So that I can classify work in a way that is easy to scan and manage.

**Acceptance Criteria:**

**Given** an existing task
**When** the user adds one or more valid tags
**Then** those tags are persisted and displayed with the task
**And** the same tags are available through developer-accessible task operations

**Given** a task already has tags
**When** the user removes a tag
**Then** the removed tag is no longer shown on the task
**And** the updated tag set is persisted correctly

**Given** a task has tags assigned
**When** the task is shown in the interface
**Then** the user can clearly view the tags associated with that task
**And** tag display remains consistent across relevant task views

**Given** the user attempts to add an invalid or duplicate tag value, or the tag update fails
**When** the tag change is submitted
**Then** the task is not shown with a misleading tag state
**And** the interface explains how to correct or retry the tag change while preserving the current task context

### Story 2.2: Filter Tasks by Tag

As a user,
I want to filter tasks by tag,
So that I can focus on the most relevant subset of work without manually scanning every task.

**Acceptance Criteria:**

**Given** tasks with one or more tags exist in the selected list
**When** the user applies a tag filter
**Then** only tasks matching the selected tag criteria are shown in the filtered task view
**And** the filtered state is visually clear to the user

**Given** a tag filter is already active
**When** the user clears that filter
**Then** the unfiltered task view is restored
**And** no unrelated task state is changed by clearing the filter

**Given** a tag-filter request fails or returns no matching tasks
**When** the filtered view is resolved
**Then** the interface shows either actionable recovery guidance or a clear filtered empty state
**And** the user can change or clear the filter without losing the underlying task context

**Given** developer-accessible filtering operations exist
**When** tag-based filtering is requested through the application API
**Then** the returned task set reflects the same semantics used in the UI
**And** filtering behavior stays consistent across store, API, and persistence

### Story 2.3: Mark Tasks Completed and Separate Active Work

As a user,
I want to mark tasks as completed and keep active tasks visually distinct,
So that I can track progress without losing clarity about what still needs attention.

**Acceptance Criteria:**

**Given** an active task exists
**When** the user marks it as completed
**Then** the task state is persisted as completed
**And** the task is no longer shown as active work in the main active-task view

**Given** a mix of active and completed tasks exists
**When** the user views the task workspace
**Then** active tasks are clearly distinguishable from completed tasks
**And** task state is communicated consistently in the interface

**Given** completion operations are available to developers
**When** a completion request is made through the application API
**Then** the task completion state is updated correctly
**And** the operation returns a consistent response shape

**Given** a completion request fails
**When** the failure is returned to the client
**Then** the task remains accurately represented in its last confirmed state
**And** the user receives clear feedback and retry guidance instead of a misleading completion result

### Story 2.4: Retain Completed Tasks as Accessible In-App History State

As a user,
I want completed tasks retained inside the application rather than discarded,
So that finishing work does not cause information loss.

**Acceptance Criteria:**

**Given** a task has been marked as completed
**When** the completion operation finishes
**Then** the task remains persisted in the system rather than being deleted
**And** it remains available for later retrieval and display

**Given** completed tasks exist
**When** the user interacts with views that distinguish task status
**Then** the application preserves completed-task state consistently
**And** completed tasks are not confused with deleted or missing tasks

**Given** task state is persisted
**When** the application reloads or refetches task data
**Then** completed-task status remains accurate
**And** the distinction between active and completed tasks is preserved

## Epic 3: Revisit History and Trust the System Over Time

Users can find previously completed work, return in later sessions with consistent state, recover from failures without confusion, and maintainers can diagnose operational failures reliably.

### Story 3.1: Browse and Retrieve Completed Task History

As a user,
I want to access completed tasks from a dedicated history experience,
So that I can revisit finished work when I need to recall it later.

**Acceptance Criteria:**

**Given** one or more tasks have been completed
**When** the user opens the history view
**Then** completed tasks are displayed in a dedicated history experience
**And** the user can distinguish them from active tasks

**Given** completed tasks exist in the system
**When** the user looks for a previously completed task
**Then** the task can be located from history
**And** its core details remain visible and accurate

**Given** history retrieval fails or no completed tasks are available
**When** the user opens or refreshes the history view
**Then** the interface communicates either a clear empty-history state or actionable recovery guidance
**And** the user is not left assuming the system silently lost completed work

**Given** developer-accessible history operations exist
**When** completed-task history is requested through the application API
**Then** the response contains the correct completed tasks
**And** the response shape is consistent with the approved API conventions

### Story 3.2: Restore Consistent Workspace State Across Later Sessions

As a user,
I want my lists, tasks, tags, descriptions, and completion state restored when I return later,
So that the application feels dependable over time rather than session-bound.

**Acceptance Criteria:**

**Given** the user has existing lists and tasks with mixed active and completed states
**When** the user returns in a later session
**Then** the previously saved state is restored accurately
**And** lists, task details, tags, and completion states remain intact

**Given** the same task appears in different core views
**When** the application reloads or refetches data
**Then** the task information stays consistent across those views
**And** the user is not shown conflicting versions of the same task

**Given** persisted workspace data exists
**When** the application initializes after a later return
**Then** it reconstructs the correct workspace context
**And** it does so without requiring the user to recreate lost information

**Given** workspace restoration or later-session refetch cannot complete cleanly
**When** the application initializes after the user returns
**Then** the interface communicates the problem without inventing or silently dropping confirmed data
**And** the user can retry from a known consistent state

### Story 3.3: Communicate Failures Clearly and Support Recovery

As a user,
I want clear failure feedback and practical recovery guidance,
So that I know what happened and how to continue without losing trust in the system.

**Acceptance Criteria:**

**Given** a list or task operation fails
**When** the failure is returned to the client
**Then** the interface shows clear user-facing failure feedback
**And** the message explains what action failed without exposing internal implementation details

**Given** an operation fails
**When** the user reads the failure message
**Then** the application explains what the user can do next
**And** the user is not left uncertain about whether data was saved or lost

**Given** the user has already entered valid task or list information
**When** a recoverable failure occurs
**Then** enough context is preserved to support retry or correction
**And** the user does not need to re-enter unnecessary information

### Story 3.4: Capture Actionable Failure Context for Maintainers

As a maintainer,
I want failures tied to identifiable actions with stable diagnostics,
So that I can troubleshoot issues quickly without exposing unsafe details to users.

**Acceptance Criteria:**

**Given** an application operation fails on the server or persistence side
**When** the failure is recorded
**Then** the system captures enough structured context to identify the failing action
**And** the captured context stays separate from user-facing messaging

**Given** the system returns an error to the client
**When** the response is generated
**Then** the error uses the approved structured error format with stable codes and safe messages
**And** raw exceptions, stack traces, and storage internals are not exposed to the user

**Given** a maintainer investigates a reported problem
**When** they review the system feedback and diagnostic output
**Then** they can determine whether the issue came from validation, missing data, persistence failure, or another bounded category
**And** the diagnostic output supports safe troubleshooting of the affected action
