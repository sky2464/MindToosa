# MindToosa — init.md (Single Source of Truth)

This file is the canonical “what we decided” document for MindToosa.  
If code, UI copy, or docs conflict with this file, update this file first, then update code.

---

## 0) Product positioning (professional, for everyone)

MindToosa is a planning + execution webapp that helps people follow through on goals using focus-friendly workflows (timeboxes, next actions, small steps) without using medical labels in the UI.

UI language:
- Use: “Focus sprint”, “Quick plan”, “Must‑do”, “Optional”, “Backlog”, “Constraints”, “Review”, “Next action”.
- Avoid in UI: “ADHD”, “disorder”, “therapy”, or diagnostic language.

---

## 1) Non-negotiable user outcomes

1. In < 3 minutes, a user can create a plan for Today and start a sprint.
2. Every plan turns into a single “Next action” the user can do immediately.
3. Daily actions always map back to original goals (week/month/year) without losing the original goals.
4. The app supports multiple life contexts (“Spaces”) so organization stays clean.

---

## 2) Spaces (context separation)

Spaces are separate contexts that remain “aware” of each other (dashboard rollups) but keep tasks and goals organized.

Spaces:
1. General (created automatically; required)
2. Optional (recommended presets):
   - Work
   - Personal
   - Family & Friends

Rules:
- Every Goal and Task belongs to exactly one Space.
- The app can show “All Spaces” in a unified view, but edits happen inside a selected Space.
- Cross-space links are optional later; data remains separated by Space.

---

## 3) Core planning behaviors (the “focus-friendly” engine)

Hard limits (prevents overwhelm):
- Today: max 3 Must‑do + max 4 Optional = 7 total active tasks.
- Each task must have:
  - Estimated minutes (default 25 if missing),
  - 3–7 micro-steps,
  - A first micro-step that can start in under 2 minutes.
- Plans must fit user constraints (time available + fixed commitments).

Timeboxing (urgency without guilt):
- Primary unit: 25‑minute Focus Sprint.
- Options: 10/15/45 minutes (user selectable).
- Deep work cap: 45–60 minutes per block, breaks every ~25 minutes.

Two-pass planning:
1. Draft pass: Brain dump → structured Must‑do / Optional.
2. Polish pass: Add estimates + reorder + cut to fit reality.

Restart mode:
- “I’m behind” / “Reboot” flow asks:
  1) What time is it now?
  2) How much usable time is left?
  3) Energy level (Low/Medium/High)
- Output is a salvage plan: 1–3 items max for the remaining window.

Always end the plan with:
- “Next concrete action: [observable first step]”

---

## 4) Tech stack (boring, popular, scalable)

Frontend + backend:
- Next.js (App Router) + TypeScript
- Deployed on Vercel

Database:
- Supabase Postgres

Auth:
- NextAuth (Auth.js) with Google login

Validation:
- Zod

Styling:
- Tailwind (or CSS Modules) — keep dependencies minimal

Dependency policy:
- Avoid unnecessary and unpopular packages.
- Prefer official/maintained libs from the platform vendors.
- Keep each code file under 400 LOC; split by responsibility.

---

## 5) Repo architecture (files under 400 LOC)

Rule: no “god files”. Split by layer and responsibility.

Suggested layout:

- `app/`
  - UI routes
  - `app/api/**/route.ts` route handlers (API)
- `src/core/` (pure domain: no DB, no network)
  - `planTypes.ts` (types)
  - `planningRules.ts` (limits + rules)
  - `clampPlan.ts` (enforce constraints)
- `src/server/` (infra wrappers)
  - `env.ts` (env validation)
  - `db.ts` (Supabase admin/server client creation)
  - `auth.ts` (session helpers)
  - `llmClient.ts` (AI provider client wrapper)
- `src/server/services/` (use cases)
  - `generateDailyPlan.ts`
  - `applyDailyPlan.ts`
  - `weeklyReview.ts`

---

## 6) Auth.js / NextAuth (App Router) decisions

We follow Auth.js conventions:

1. Create `auth.ts` at the project root that exports `{ handlers, signIn, signOut, auth }`. [page:4]
2. Add the App Router Route Handler at `/app/api/auth/[...nextauth]/route.ts` exporting `GET` and `POST` from `handlers`. [page:4]
3. Environment variable `AUTH_SECRET` is mandatory, and can be generated with `npx auth secret`. [page:4]
4. Use Google OAuth provider for login.

Security baseline:
- Enforce authentication on every API route that reads/writes user data.

---

## 7) Vercel environment variables (secrets policy)

- All secrets live in Vercel Environment Variables (not committed to git); Vercel states env var values are encrypted at rest. [page:5]
- Use separate values for Production/Preview/Development environments. [page:5]
- Local dev: use `.env.local` and/or `vercel env pull` to populate env values. [page:5]

Required env vars (minimum):
- `AUTH_SECRET` (Auth.js) [page:4]
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_URL` (prod)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only; never expose to client)

AI env vars (when enabled):
- `AI_PROVIDER_API_KEY`
- Optional: `AI_MODEL`

---

## 8) Data model (MVP entities)

Entities:
1. Space
2. Goal
3. Task
4. FocusSession

Field guidelines:
- Every table includes `user_id` and `space_id` (except Space which already implies user).
- Store micro-steps as `jsonb` array on Task.

Supabase tables (MVP):
- `spaces(id, user_id, name, created_at, archived)`
- `goals(id, user_id, space_id, title, horizon, why, created_at, archived)`
- `tasks(id, user_id, space_id, goal_id?, title, priority, estimated_minutes, scheduled_for, status, micro_steps, created_at)`
- `focus_sessions(id, user_id, task_id?, started_at, duration_minutes, completed)`

Security (MVP approach):
- API-only data access: the browser calls MindToosa API routes, and API routes use Supabase server client to read/write.

Defense-in-depth (phase 2):
- Turn on Supabase Row Level Security and enforce `user_id = auth.uid()` policies for all user tables.
- If later we want RLS for direct client Supabase access with third-party auth, Supabase documents “Third Party Auth … based on JWTs”. [page:3]

---

## 9) API routes (MVP)

Auth:
- `/api/auth/*` (NextAuth)

Spaces:
- `GET /api/spaces`
- `POST /api/spaces`
- `PATCH /api/spaces/:id`

Goals:
- `GET /api/goals?spaceId=...`
- `POST /api/goals`
- `PATCH /api/goals/:id`

Tasks:
- `GET /api/tasks?spaceId=...&date=YYYY-MM-DD`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`

Planning:
- `POST /api/plan/daily` → returns a validated `DailyPlan` JSON (does not write)
- `POST /api/plan/apply` → writes tasks to DB (server clamps again)

Sessions:
- `POST /api/focus/start`
- `POST /api/focus/complete`

---

## 10) AI planning (agentic but controlled)

Key rule:
- AI proposes plans; server validates/clamps; only then we persist.

Planning pipeline:
1. Input to AI:
   - date
   - fixed commitments
   - time available
   - energy level
   - Space goals + existing tasks for that Space
2. Output from AI:
   - Strict JSON (DailyPlan) with Must‑do + Optional + micro-steps + estimates + goal links when possible
3. Server clamp rules:
   - Must‑do <= 3
   - Total tasks <= 7
   - Each task microSteps length 3–7
   - Default estimatedMinutes = 25
   - Ensure “Next concrete action” exists
4. Optional repair pass:
   - If validation fails, run a second AI pass with errors and demand a corrected JSON only.

Privacy:
- Only send necessary context to the model (prefer summaries over raw notes).
- Store minimal AI logs: timestamp, user_id, space_id, token/cost estimate, outcome.

AI toggle:
- “AI planning” is optional (can be disabled). When disabled, the app offers templates + manual planning.

---

## 11) UI pages (MVP)

- `/today`
  - Primary CTA: Start Focus Sprint (25 min)
  - Must‑do list (max 3)
  - Optional list (max 4)
  - Next action panel (single next step visible)
- `/week`
  - Weekly view + carry-forward logic
- `/goals`
  - Goals by Space (weekly/monthly/yearly)
- `/spaces`
  - Create optional spaces (Work/Personal/Family & Friends)
- `/settings`
  - Privacy + AI on/off + export

---

## 12) Build plan (two 25-minute sprints, repeatable)

Sprint A (25 min) — skeleton:
1. Create app + repo.
2. Implement Auth.js: `auth.ts` + `/api/auth` route. [page:4]
3. Add `/today` page with mock plan display.
4. Add Zod schemas for Space/Goal/Task/DailyPlan.

Sprint B (25 min) — real 
1. Create Supabase tables.
2. Implement `/api/spaces` and `/api/tasks` with server Supabase client.
3. Implement `POST /api/plan/daily` returning mocked JSON.
4. Implement `POST /api/plan/apply` writing tasks.

Definition of done (MVP):
- Google login works.
- User has General Space auto-created.
- User can create optional Spaces.
- User can create goals/tasks in a Space.
- User can generate a daily plan (mock or AI), apply it, and start a Focus Sprint.

---

## 13) Open questions (to decide later)

1. Will we allow direct client Supabase access (with RLS) or keep API-only permanently?
2. Do we add calendar integration (Google Calendar) for fixed commitments?
3. Do we add team/shared Spaces (not in MVP)?

---

## 14) Working agreement (so this stays readable)

- No file > 400 LOC.
- Every new feature must state:
  - Which Space(s) it touches,
  - Which entity changes,
  - Which clamp rules apply,
  - What the default user flow is on `/today`.

