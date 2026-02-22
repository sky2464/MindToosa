# MindToosa Analysis Summary & Navigation Index

**Last Updated:** 2026-02-19  
**Purpose:** Master navigation index tying all architecture, frontend, and gap analysis documents together. Start here.

---

## Document Map

| Document                   | Location                           | Scope                                                               |
| -------------------------- | ---------------------------------- | ------------------------------------------------------------------- |
| **This file**              | `docs/ANALYSIS_SUMMARY.md`         | Cross-cutting index & prioritized findings                          |
| **Architecture Review R1** | `docs/arch-r1.md`                  | ⭐ **Confirmed bugs, security, future-proofing, full task backlog** |
| **Frontend Analysis**      | `docs/frontend-analyze.md`         | Pages, components, client flows, dead code, frontend security       |
| **Backend Architecture**   | `docs/backend-architecture.md`     | Auth, API routes, service layer, data flows, DB schema              |
| **Inconsistencies & Gaps** | `docs/inconsistencies-and-gaps.md` | Deviations from patterns, missing infrastructure, DB issues         |
| **PM Status**              | `docs/PM.md`                       | Sprint history, current phase, upcoming roadmap                     |

---

## System at a Glance

```
User (Browser)
  │
  ├─ /page/*  → proxy.ts (NextAuth JWT gate) → SSR Server Component
  │                └─ All auth-required pages redirect to /api/auth/signin
  │
  ├─ /api/*   → NOT proxied → each route calls auth() individually
  │
  └─ Server Actions ("use server") → Projects mutations + AI chat
       └─ Called directly from Client Components, no HTTP round-trip

Auth Identity:  session.user.email  (TEXT, used as user_id everywhere)
Database:       Supabase + service-role key (bypasses RLS; service layer enforces ownership)
AI:             Google Gemini 2.0 Flash (plan generation + project chat)
```

---

## Full-Stack Feature Status

This is the single source of truth for what is end-to-end working vs. broken or incomplete.

| Feature                | Backend                  | API                               | Frontend UI                  | Full E2E | Notes                                         |
| ---------------------- | ------------------------ | --------------------------------- | ---------------------------- | -------- | --------------------------------------------- |
| Google Auth / Sign-in  | ✅                       | ✅ NextAuth                       | ✅ Sign-in link              | ✅       | —                                             |
| Task CRUD              | ✅                       | ✅                                | ✅ FlowBoard + KanbanBoard   | ✅       | Complete                                      |
| Task status updates    | ✅                       | ✅ PATCH (strict Zod)             | ✅                           | ✅       | —                                             |
| Task drag reorder      | —                        | —                                 | ⚠️ Local state only          | ❌       | Order NOT persisted to API                    |
| Task comments          | ✅                       | ✅                                | ⚠️ TaskEditModal only        | ⚠️       | No inline comment UI                          |
| Task labels            | ✅                       | ✅                                | ⚠️ TaskEditModal only        | ⚠️       | No label management page                      |
| Task subtasks          | ✅ parent_task_id        | ⚠️ via POST only                  | ⚠️ TaskEditModal             | ⚠️       | No dedicated subtask UI                       |
| **Task recurrence**    | ✅ recurrenceService     | ✅ via updateTask                 | ❌ **No UI**                 | ❌       | Backend fully built, zero UI                  |
| **Task dependencies**  | ✅ task_dependencies     | ❌ **No route**                   | ❌ **No UI**                 | ❌       | DB + service built, not exposed at all        |
| Daily AI plan          | ✅                       | ✅ POST /plan/daily + /plan/apply | ✅ PlanGenerator             | ✅       | space_id injected client-side                 |
| Goals                  | ✅                       | ✅ (missing PATCH Zod)            | ✅ /goals page               | ⚠️       | PATCH /goals/[id] has no route-level Zod      |
| Projects CRUD          | ✅                       | ❌ Server Actions only            | ✅ /projects                 | ⚠️       | No REST API for projects                      |
| AI project chat        | ✅                       | ❌ Server Action only             | ✅ AIChat                    | ⚠️       | Not rate-limited                              |
| **AI subtask suggest** | ✅ suggestSubtasksAction | ❌ Server Action only             | ❌ **Not surfaced**          | ❌       | Built but unreachable in UI                   |
| Spaces                 | ✅                       | ✅ (bypasses spaceService)        | ✅ /spaces                   | ⚠️       | Routes query DB directly, not via service     |
| Focus timer            | ✅                       | ✅                                | ✅ FocusTimer                | ⚠️       | Uses raw `fetch()`, errors silently swallowed |
| Gamification XP/level  | ✅                       | ✅                                | ✅ QuestDisplay              | ⚠️       | Shows **fake fallback data** on API failure   |
| Streak tracking        | ✅                       | ✅ POST /gamification             | ✅ triggered after focus     | ✅       | —                                             |
| **Search**             | ✅                       | ✅ (rate-limited)                 | ❌ **SearchBar not mounted** | ❌       | Complete stack but SearchBar never imported   |
| Notifications          | ✅                       | ✅                                | ⚠️ Desktop sidebar only      | ⚠️       | Mobile has no notification access             |
| Settings               | ✅                       | ✅                                | ✅ /settings                 | ✅       | —                                             |
| Support form           | —                        | ✅ (no auth!)                     | ✅ /support                  | ⚠️       | No email backend yet; unauthenticated         |
| Week view              | —                        | —                                 | ✅ /week (read-only grid)    | ✅       | —                                             |
| Carry-forward          | —                        | ✅ PATCH scheduled_for            | ✅ WeekCarryForward          | ✅       | —                                             |

---

## Cross-Cutting Issues (Ranked by Severity)

### 🔴 P0 — Correctness / Security

| ID   | Issue                                                    | Layer    | Details                                                                                                                           |
| ---- | -------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| P0-1 | `/api/support` has **no authentication**                 | API      | Anyone can POST. Safe now (console.log), but a spam/abuse vector when email is wired. See `docs/inconsistencies-and-gaps.md §3.3` |
| P0-2 | `QuestDisplay` shows **hardcoded fake stats** on failure | Frontend | `.catch(() => setStats({xp:1250, level:3, streak:5}))` — users see fabricated data. `docs/frontend-analyze.md §6`                 |
| P0-3 | Task drag **reorder not persisted**                      | Frontend | FlowBoard reorders locally only. Reload = reset. No API call made. `docs/frontend-analyze.md §6`                                  |
| P0-4 | Rate limiter **non-functional on serverless**            | Backend  | In-memory `Map` resets per Vercel invocation. Only protects search. `docs/inconsistencies-and-gaps.md §3.1.1`                     |

### 🟠 P1 — Architecture / Data Integrity

| ID   | Issue                                                  | Layer            | Details                                                                                                           |
| ---- | ------------------------------------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| P1-1 | `PATCH /goals/[id]` accepts **any field** (no Zod)     | API              | Arbitrary field updates possible. `docs/inconsistencies-and-gaps.md §1.3`                                         |
| P1-2 | **Projects have no REST API** — Server Actions only    | API              | Cannot manage projects via REST client. Inconsistent with all other entities. `docs/backend-architecture.md §3.2` |
| P1-3 | **Spaces routes bypass `spaceService`** — direct DB    | API              | Inconsistent authorization surface. `docs/inconsistencies-and-gaps.md §1.1`                                       |
| P1-4 | `FocusTimer` uses raw `fetch()` not `apiClient`        | Frontend         | Focus session + XP saves silently fail with no feedback. `docs/frontend-analyze.md §5`                            |
| P1-5 | Week page fetches **unbounded past tasks**             | Frontend         | `getTasks({ dateTo: today })` — no lower bound. Grows forever. `docs/frontend-analyze.md §9`                      |
| P1-6 | `ensureDefaultSpace` is a **write on every page load** | Frontend/Backend | 4 SSR pages silently create DB records on first visit. Unexpected side-effect.                                    |
| P1-7 | `plan/apply` `space_id` **injected client-side only**  | Frontend         | If bypassed (cURL, etc.) or if client injection fails, FK constraint fails at DB level.                           |

### 🟡 P2 — Missing Features with Complete Backends

| ID   | Issue                                             | Layer          | Details                                                                                                                                  |
| ---- | ------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| P2-1 | **Task recurrence has no UI**                     | Frontend       | `recurrenceService` + RFC 5545 logic + DB migration fully built. `recurrence_rule` in TaskSchema. Zero UI. `docs/frontend-analyze.md §6` |
| P2-2 | **Task dependencies have no API route AND no UI** | API + Frontend | `task_dependencies` table, service methods, completion-blocking logic — nothing exposed. `docs/frontend-analyze.md §6`                   |
| P2-3 | **`SearchBar` is built but never mounted**        | Frontend       | Full search UI with Cmd+K, debounce, type-ahead. `SearchBar.tsx` not imported anywhere. `docs/frontend-analyze.md §4`                    |
| P2-4 | **`ShortcutsDialog` is built but never mounted**  | Frontend       | `ShortcutsDialog.tsx` not imported anywhere.                                                                                             |
| P2-5 | **AI subtask suggestions** not surfaced in UI     | Frontend       | `suggestSubtasksAction` exists, works, not accessible from any UI.                                                                       |
| P2-6 | **Labels management page** missing                | Frontend       | Labels can be assigned in TaskEditModal but there's no `/labels` page to manage the label catalog.                                       |
| P2-7 | **Mobile notifications** missing                  | Frontend       | `NotificationsPanel` only in desktop sidebar (`hidden md:flex`). Mobile users have no access.                                            |

### 🟢 P3 — Infrastructure / Scalability

| ID   | Issue                                           | Layer    | Details                                                                                              |
| ---- | ----------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| P3-1 | No pagination on any list endpoint              | API      | All `.select("*")` — full result sets. `docs/inconsistencies-and-gaps.md §3.1.3`                     |
| P3-2 | No transactions for multi-step writes           | API      | `plan/apply` upserts can partially fail. `docs/inconsistencies-and-gaps.md §3.1.4`                   |
| P3-3 | No structured logging                           | API      | Sparse `console.error`. No trace IDs, no request logging. `docs/inconsistencies-and-gaps.md §3.1.2`  |
| P3-4 | Notifications poll every 60s (no SSE/WebSocket) | Frontend | Constant background requests. `docs/frontend-analyze.md §3.8`                                        |
| P3-5 | `N+1` project task queries on `/projects`       | Frontend | `Promise.all(projects.map(getProjectTasks))` — N DB queries per page load.                           |
| P3-6 | Email as `user_id` (TEXT)                       | DB       | Prevents email changes, case-sensitivity risk, slower joins. `docs/inconsistencies-and-gaps.md §2.1` |

---

## Quick-Win Candidates (Low effort, high impact)

These can be fixed with minimal code change:

| Fix                                                    | Effort | Impact                                     | File(s)                           |
| ------------------------------------------------------ | ------ | ------------------------------------------ | --------------------------------- |
| Mount `SearchBar` in NavBar                            | XS     | Unlocks complete search feature            | `src/components/NavBar.tsx`       |
| Mount `ShortcutsDialog` in NavBar                      | XS     | Unlocks keyboard help                      | `src/components/NavBar.tsx`       |
| Remove fake fallback in `QuestDisplay`                 | XS     | Stop showing false data                    | `src/components/QuestDisplay.tsx` |
| Add auth check to `/api/support`                       | XS     | Closes abuse vector                        | `src/app/api/support/route.ts`    |
| Add Zod validation to `PATCH /goals/[id]`              | S      | Closes arbitrary-field update              | `src/app/api/goals/[id]/route.ts` |
| Replace raw `fetch()` in `FocusTimer` with `apiClient` | S      | Proper error handling for session/XP saves | `src/app/today/FocusTimer.tsx`    |
| Add lower-bound date to week page past-task fetch      | XS     | Prevent unbounded DB query                 | `src/app/week/page.tsx`           |
| Move `NotificationsPanel` to mobile nav                | S      | Mobile users get notifications             | `src/components/NavBar.tsx`       |
| Migrate spaces GET/PATCH to `spaceService`             | S      | Architecture consistency                   | `src/app/api/spaces/route.ts`     |

---

## Recommended Sprints

### Sprint 1 — Quick Wins & P0 Fixes

- Fix fake fallback in QuestDisplay
- Add auth to `/api/support`
- Mount SearchBar in NavBar
- Add Zod to `PATCH /goals/[id]`
- Replace raw fetch in FocusTimer with apiClient
- Add date lower-bound to week page fetch

### Sprint 2 — Frontend for Dead Backend Features

- Add recurrence_rule UI to TaskEditModal / TaskInput
- Expose task dependencies in FlowBoard/KanbanBoard
- Add API routes for task dependencies
- Mount ShortcutsDialog
- Surface suggestSubtasksAction in task creation flow

### Sprint 3 — Architecture Consistency

- Add REST API routes for projects (GET /api/projects, GET /api/projects/[id])
- Migrate spaces routes to use spaceService
- Standardize all mutation patterns (decide: Server Actions or API routes)
- Add Zod to all PATCH endpoints

### Sprint 4 — Infrastructure

- Replace in-memory rate limiter with Redis (Upstash)
- Add pagination to all list endpoints
- Add structured logging middleware
- Implement SSE or WebSocket for notifications (remove polling)
- Add transaction support for plan/apply

---

## Entity Relationship Summary

```
User (email = PK across all tables)
 ├── Spaces (1:N)
 │    ├── Tasks (N)  — status, priority, scheduled_for, micro_steps, recurrence_rule
 │    │    ├── Subtasks (self-ref: parent_task_id)
 │    │    ├── Comments (1:N)
 │    │    ├── Labels (M:N via task_label_assignments)
 │    │    ├── Dependencies (M:N via task_dependencies) ← NO UI
 │    │    └── FocusSessions (1:N via task_id nullable FK)
 │    ├── Goals (N) — horizon (week/month/year/life), why, archived
 │    └── Projects (N) — status (active/completed/on_hold)
 │         └── Tasks (via project_id FK)
 ├── Labels (1:N, global — NOT space-scoped)
 ├── UserStats (1:1) — xp, level, current_streak
 ├── UserSettings (1:1) — preferences
 └── Notifications (1:N) — type, read flag
```

---

## DB Migration History

| Migration                     | Contents                                                           |
| ----------------------------- | ------------------------------------------------------------------ |
| 0000_init                     | spaces, goals, tasks, focus_sessions                               |
| 0001_gamification             | user_stats                                                         |
| 0002_projects_and_ai          | projects, ai_chat_messages                                         |
| 0003_fix_user_stats_id        | Fix user_stats PK                                                  |
| 0004_fix_rls_for_email        | RLS policies using email                                           |
| 0005_fix_missing_rls          | Add missing RLS policies                                           |
| 0006_standardize_rls          | Standardize RLS across tables                                      |
| 0007_fix_user_stats_userid    | user_stats user_id type fix                                        |
| 0008_subtasks_labels_comments | task_comments, task_labels, task_label_assignments, parent_task_id |
| 0009_recurring_tasks          | recurrence_rule, parent_recurring_task_id                          |
| 0010_user_settings            | user_settings table                                                |
| 0011_notifications            | notifications table                                                |
| 0012_task_dependencies        | task_dependencies junction table                                   |
