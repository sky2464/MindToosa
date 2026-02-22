---
title: "Conductor — VS Code Slash Commands"
scope: workspace
tags: [conductor, commands, agent-customization]
---

# Conductor Slash Commands (VS Code)

Purpose: provide concise, workspace-scoped instructions that map user-entered slash commands (in Copilot Chat or the command input) to the canonical Conductor flows in this repository.

Rules (high level):
- These instructions apply only inside this workspace.
- Always validate every tool call and file operation; if any check fails, halt and ask the user.
- Never write or overwrite files without creating a `.bak` backup and showing a diff for user approval.
- Follow the Conductor workflow in `conductor/workflow.md` and validate Zod schemas for any external input.

Slash command mappings

- `/conductor.setup`
  - Action: Run the Conductor setup flow (interactive). Create or update `conductor/product.md`, `conductor/tech-stack.md`, `conductor/workflow.md`, `conductor/product-guidelines.md`, `conductor/setup_state.json` per the prompts in `.agents/prompts/conductor.setup.prompt.md`.
  - Behavior: Ask required interactive questions (max 5 per section) unless the user explicitly requests auto-generate. Always save state to `conductor/setup_state.json` when a step completes.

- `/conductor.status`
  - Action: Produce a status overview by reading `conductor/tracks.md` and all `conductor/tracks/*/plan.md` files. Report counts and the current IN PROGRESS task.
  - Behavior: Run read-only checks first; if any required file missing, instruct user to run `/conductor.setup`.

- `/conductor.newTrack <title>`
  - Action: Propose and create a new track folder `conductor/tracks/<id>/` containing `spec.md`, `plan.md`, and `metadata.json` following the `3.3_initial_track_generated` protocol in `.agents/prompts/conductor.setup.prompt.md`.
  - Behavior: Generate a draft and show diffs before creating files; require explicit user approval to write files.

- `/conductor.implement <track_id>`
  - Action: Execute the implement protocol for the specified track: iterate tasks in `plan.md`, mark `[~]`, run tests, implement changes, update `plan.md` to `[x]` with commit SHA, and create a checkpoint per `workflow.md`.
  - Behavior: This command is interactive and must confirm each write/commit step with the user. It will announce test commands before running them.

- `/conductor.revert <track_id> <phase|task>`
  - Action: Revert a completed task or phase using the `conductor.revert.prompt.md` protocol.
  - Behavior: Validate commit SHAs, present diffs, and ask for confirmation before modifying `plan.md` or performing git operations.

Examples (user-facing prompts)

- `"/conductor.status"` — returns a concise status summary and next action.
- `"/conductor.newTrack Add user auth"` — drafts a new track for review.
- `"/conductor.setup"` — begins interactive repo setup for Conductor files.

Developer notes

- Keep prompts short and confirm intent before any destructive action.
- Respect `.gitignore` when scanning code for Brownfield detection.
- Create `.bak` backups for overwritten files and stage them separately; do not commit without user approval.
- Use Zod to validate any external inputs written to `conductor/*.md` or JSON files.

If anything in these instructions is ambiguous, ask one clarifying question about scope or which command the user prefers to run first.
