# Plan: AI-Powered Project Management & Task Generation

## Phase 1: Database and Schema Updates

- [ ] Write Tests: Create model unit tests for Projects and Sub-tasks schema.
- [ ] Implement Feature: Update Supabase schema (or Prisma/Drizzle models if applicable) to support Projects (title, description, scope, status) and Sub-tasks (title, status, project_id).
- [ ] Implement Feature: Expose required backend actions/API for creating project and fetching tasks.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Database and Schema Updates' (Protocol in workflow.md)

## Phase 2: Project Creation UI

- [ ] Write Tests: Add UI tests for the "New Project" modal/page.
- [ ] Implement Feature: Create a button (+) to add a project on the `/projects` page.
- [ ] Implement Feature: Implement the interface to enter Project Title, Description, and Scope.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Project Creation UI' (Protocol in workflow.md)

## Phase 3: AI Task Breakdown Integration

- [ ] Write Tests: Mock the GenAI SDK and create tests for the task breakdown Server Action.
- [ ] Implement Feature: Create Server Action `generateSubTasks(projectDetails)` using `@google/genai` to parse the scope and return structured sub-tasks.
- [ ] Implement Feature: Connect the UI submission to the AI action, allowing the user to review and save the generated sub-tasks.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: AI Task Breakdown Integration' (Protocol in workflow.md)

## Phase 4: Kanban Board and Tracking

- [ ] Write Tests: Add integration tests for moving tasks between status columns.
- [ ] Implement Feature: Build a Kanban board or a structured list view in `/projects/[id]` to display sub-tasks.
- [ ] Implement Feature: Add drag-and-drop or button interfaces to update task status (Todo, In Progress, Done).
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Kanban Board and Tracking' (Protocol in workflow.md)
