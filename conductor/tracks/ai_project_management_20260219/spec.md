# Track: AI-Powered Project Management and Break-Down

## Objective

Implement an AI-driven project management workflow similar to Trello or Planner, where users can create a project, describe its scope and space, and have an AI API automatically break it down into manageable sub-tasks. The user will then be able to track and complete these sub-tasks.

## Features

1. **Project Creation Interface**: A "+" action that opens a modal or new view to enter project details (Title, Description, Scope, and Space).
2. **AI Task Breakdown**: After entering project details, an interactive flow uses the AI API to optionally ask clarifying questions or immediately break the main project into smaller actionable sub-tasks.
3. **Project Dashboard/Kanban**: A view to manage the generated sub-tasks, tracking them by status (e.g., Todo, In Progress, Done).

## Technical Approach

- **Frontend**: Create new App Router pages and components for the project management dashboard (`/projects`), utilizing React 19 features and Tailwind CSS for minimalist, clean styling.
- **Backend/AI**: Implement a Next.js Server Action / API Route that integrates with the Google GenAI SDK to process the user's project description and return a structured list of sub-tasks.
- **Database**: Update the Supabase schema to support Projects mapping to Tasks/Sub-tasks.

## Success Criteria

- User can successfully create a new project with a text description.
- AI successfully parses the description and generates a list of sub-tasks.
- User can view these sub-tasks in a Kanban board or a list, and transition their states to completion.
