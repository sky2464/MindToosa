# Copilot instructions (Conductor)

## What this repo is
- This repository is a **multi-platform AI coding assistant framework** that works with both **Gemini CLI** and **VS Code GitHub Copilot**.
- The "runtime" is primarily **prompt + template artifacts**, not application code.
- Gemini CLI entrypoint/metadata is in [gemini-extension.json](gemini-extension.json) (notably `contextFileName: "GEMINI.md"`).

## Key directories and contracts

### Command definitions (dual-platform)
- **Gemini CLI commands:** [commands/conductor/](commands/conductor/) as TOML files with `description` and `prompt = """..."""`
- **VS Code Copilot prompts:** [.github/prompts/](.github/prompts/) as Markdown files with YAML frontmatter `description` field

| Command | Gemini CLI | VS Code Copilot |
| :--- | :--- | :--- |
| Setup | `commands/conductor/setup.toml` | `.github/prompts/conductor.setup.prompt.md` |
| New Track | `commands/conductor/newTrack.toml` | `.github/prompts/conductor.newTrack.prompt.md` |
| Implement | `commands/conductor/implement.toml` | `.github/prompts/conductor.implement.prompt.md` |
| Status | `commands/conductor/status.toml` | `.github/prompts/conductor.status.prompt.md` |
| Revert | `commands/conductor/revert.toml` | `.github/prompts/conductor.revert.prompt.md` |

### Project templates
- Project scaffolding templates live in [templates/](templates/), especially:
  - [templates/workflow.md](templates/workflow.md) (the workflow protocol copied into user projects)
  - [templates/code_styleguides/](templates/code_styleguides/) (language styleguide snippets copied into user projects)
- Release packaging is handled by GitHub Actions and uploads a tarball that **excludes** `.git` and `.github` (for Gemini CLI releases): [.github/workflows/package-and-upload-assets.yml](.github/workflows/package-and-upload-assets.yml)
  - Don't put required Gemini CLI extension assets only under `.github/`.

## Editing command prompts safely
- Treat each command prompt as an API: keep section numbering and "CRITICAL/PROTOCOL" wording stable unless you're intentionally changing behavior.
- **When editing, keep both platforms in sync:**
  - Gemini CLI uses `{{args}}` placeholder → Copilot uses `$ARGUMENTS`
  - Gemini CLI uses `/conductor:command` → Copilot uses `/conductor.command`
- Preserve templating placeholders for each platform.
- Keep file-path conventions intact because commands depend on them:
  - Tracks index: `conductor/tracks.md`
  - Track folders: `conductor/tracks/<track_id>/` with `spec.md`, `plan.md`, `metadata.json`
- Several prompts assume **specific markdown formats**:
  - Track entries are separated by `---` and use `## [ ] Track: <Description>` with a `*Link: ...*` line.
  - Status markers are `[ ]` (todo), `[~]` (in progress), `[x]` (done).
- Avoid introducing `"""` inside TOML `prompt = """..."""` strings.

## How Conductor's workflow is intended to work
- `setup` creates project-level context files (`conductor/product.md`, `conductor/tech-stack.md`, `conductor/workflow.md`, etc.) and writes progress to `conductor/setup_state.json`.
- `newTrack` generates a track's `spec.md` then a `plan.md` that must follow the workflow rules in `conductor/workflow.md`.
- `implement` is designed to:
  - mark the chosen track as `[~]` in `conductor/tracks.md`
  - execute tasks in `plan.md` according to the "Task Workflow" section of the workflow template
  - update `plan.md` with commit SHAs and then mark the track `[x]` when complete.

## When changing templates
- Assume templates are copied verbatim into user repos; prioritize clarity and low ambiguity.
- If you change headings/keywords in [templates/workflow.md](templates/workflow.md), audit prompts that reference them (notably `implement` and `newTrack`) so the contract still holds.
