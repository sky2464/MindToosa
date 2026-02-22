# MindToosa Frontend Analysis

**Last Updated:** 2026-02-19  
**Scope:** All frontend pages, client components, API call patterns, and discovered flows  
**Related Docs:** `backend-architecture.md`, `inconsistencies-and-gaps.md`

---

## 1. Auth & Navigation Architecture

### Proxy Gate

```
Browser GET /page/*
  → proxy.ts  (wraps NextAuth auth())
  → matcher: excludes /api/**, /_next/**, favicon.ico
  → No valid session → redirect /api/auth/signin
  → Valid session → render Server Component
```

### NavBar Structure

```
<NavBar>  (Client Component, always rendered in RootLayout)
  ├─ Mobile:  bottom fixed bar — shows: Today, Week, Goals, Projects, Spaces, Settings
  │           NO notifications, NO search
  └─ Desktop: left sidebar (w-16) — shows: Home, Notifications, + all nav + resource items
              resource items (desktop only): Help, Docs, About, Support
```

**⚠️ Gap:** Notifications only accessible on desktop. Mobile users have zero notification surface.

---

## 2. Page Inventory

| Route            | Auth Guard              | SSR Data Fetched                                         | Key Client Components                                         |
| ---------------- | ----------------------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| `/`              | ❌ Public               | None                                                     | Static hero; links to /today, /goals, sign-in                 |
| `/today`         | ✅ → `/api/auth/signin` | tasks (today), ensureDefaultSpace                        | FlowBoard, FocusTimer, QuestDisplay, PlanGenerator, TaskInput |
| `/week`          | ✅ → redirect           | weekTasks + pastIncompleteCandidates, ensureDefaultSpace | WeekCarryForward                                              |
| `/goals`         | ✅ → redirect           | goals (active/archived), ensureDefaultSpace              | GoalForm, GoalItem                                            |
| `/projects`      | ✅ → redirect           | projects, project tasks (parallel), ensureDefaultSpace   | NewProjectForm, ProjectProgress                               |
| `/projects/[id]` | ✅ → redirect           | project by id + project tasks                            | KanbanBoard, AIChat                                           |
| `/spaces`        | ✅ → redirect           | all spaces (active + archived)                           | SpaceForm, SpaceCard                                          |
| `/settings`      | ✅ → redirect           | none (client fetches)                                    | SettingsClient                                                |
| `/help`          | ❌ Public               | None                                                     | Static                                                        |
| `/docs`          | ❌ Public               | None                                                     | Static                                                        |
| `/about`         | ❌ Public               | None                                                     | Static                                                        |
| `/support`       | ❌ Public               | None                                                     | SupportForm → POST /api/support                               |

---

## 3. Client-Side Data Flows

### 3.1 Today Page (`/today`)

```
SSR:
  auth() → redirect if no session
  spaceService.ensureDefaultSpace(userId)   ← WRITE side-effect on page load
  taskService.getTasks(userId, { date: today })
  → render FlowBoard, QuestDisplay, PlanGenerator, TaskInput, FocusTimer

Client flows:
  FlowBoard:
    PATCH /api/tasks/[id] { status: "done" }    → router.refresh()
    PATCH /api/tasks/[id] { status: ... }       → optimistic update, then router.refresh()
    Drag-and-drop reorder                        → local state only (NOT persisted to API)

  TaskInput:
    POST /api/tasks { title, space_id }
    → apiClient.post → router.refresh()

  QuestDisplay:
    GET /api/gamification → show XP/level/streak
    .catch(() => setStats({ xp:1250, level:3, streak:5 }))  ← ⚠️ FAKE FALLBACK DATA

  FocusTimer (on timer complete):
    fetch("/api/focus", POST)                   ← raw fetch, NOT apiClient
    fetch("/api/gamification", POST { action:"add_xp" })
    fetch("/api/gamification", POST { action:"update_streak" })
    → router.refresh()

  PlanGenerator (AI flow):
    Step 1: POST /api/plan/daily { timeAvailable, constraints, notes }
    Step 2: user reviews plan
    Step 3: POST /api/plan/apply { date, mustDo[], optional[] }
            └─ space_id injected client-side (t.space_id || spaceId) before POST
    → router.refresh()
```

### 3.2 Week Page (`/week`)

```
SSR:
  auth() → redirect if no session
  spaceService.ensureDefaultSpace(userId)   ← WRITE side-effect
  taskService.getTasks(userId, { dateFrom: mon, dateTo: sun })  ← weekTasks
  taskService.getTasks(userId, { dateTo: today })                ← ⚠️ UNBOUNDED past fetch
  → merge & deduplicate
  → pastIncompleteTasks = tasks with scheduled_for < today and non-terminal status

Client flows:
  WeekCarryForward:
    PATCH /api/tasks/[id] { scheduled_for: today }   → reschedule task
    → router.refresh()
```

### 3.3 Goals Page (`/goals`)

```
SSR:
  auth() → redirect if no session
  spaceService.ensureDefaultSpace(userId)   ← WRITE side-effect
  goalService.getGoals(userId, { archived: false | true })

Client flows:
  GoalForm:
    POST /api/goals { title, why, horizon, space_id }
    → apiClient.post → router.refresh()

  GoalItem:
    PATCH /api/goals/[id] { archived: true }         → archive
    DELETE /api/goals/[id]                           → delete
    → router.refresh()
```

### 3.4 Projects Page (`/projects`)

```
SSR:
  auth() → redirect if no session
  projectService.getProjects(userId)
  Promise.all([projectService.getProjectTasks(userId, p.id) for each project])
  spaceService.ensureDefaultSpace(userId)

Client flows:
  NewProjectForm → createProjectAction(formData) [Server Action]
    → projectService.createProject → revalidatePath("/projects")
```

### 3.5 Project Detail (`/projects/[id]`)

```
SSR:
  auth() → redirect if no session
  projectService.getProjectById(userId, id) → notFound() if null
  projectService.getProjectTasks(userId, id)

Client flows:
  KanbanBoard:
    POST /api/tasks (create new task in project)
    PATCH /api/tasks/[id] (move between columns = status change)
    DELETE /api/tasks/[id]

  AIChat:
    chatWithProjectAction(projectId, message) [Server Action]
    → llmClient.chatWithProject(project, tasks, message)
    → no rate limiting, no API route, direct server action
```

### 3.6 Spaces Page (`/spaces`)

```
SSR:
  auth() → redirect if no session
  spaceService.getSpaces(userId) → all spaces

Client flows:
  SpaceForm → POST /api/spaces { name }
    → apiClient.post → router.refresh()

  SpaceCard:
    PATCH /api/spaces/[id] { name } or { archived: true }
    → apiClient.patch → router.refresh()
    ⚠️ No hard delete available (archive-only)
```

### 3.7 Settings Page (`/settings`)

```
SSR: auth() → redirect; passes userEmail to SettingsClient

Client flows (SettingsClient on mount):
  GET /api/settings → load preferences
  PATCH /api/settings { ...changes } → save
```

### 3.8 Notifications Panel (Desktop sidebar only)

```
On mount:
  GET /api/notifications → populate badge count + list

Every 60 seconds (setInterval):
  GET /api/notifications → poll for new (⚠️ no backoff, no WebSocket)

On mark read:
  PATCH /api/notifications { action: "mark_read", id }

On mark all read:
  PATCH /api/notifications { action: "mark_all_read" }
```

---

## 4. Component Inventory

### Active Components (mounted and wired)

| Component            | Location                       | API Calls                                  | Notes                                           |
| -------------------- | ------------------------------ | ------------------------------------------ | ----------------------------------------------- |
| `NavBar`             | Root layout                    | None (client routing)                      | Mobile vs. desktop differ significantly         |
| `AmbientBackground`  | Root layout                    | None                                       | CSS canvas animation                            |
| `FlowBoard`          | /today                         | PATCH /api/tasks/[id]                      | Drag-drop reorder is local-only (not persisted) |
| `FocusTimer`         | /today (embedded in FlowBoard) | POST /api/focus, POST /api/gamification    | Uses raw `fetch()` not `apiClient`              |
| `TaskInput`          | /today                         | POST /api/tasks                            | `apiClient.post`                                |
| `PlanGenerator`      | /today                         | POST /api/plan/daily, POST /api/plan/apply | Injects space_id client-side                    |
| `QuestDisplay`       | /today                         | GET /api/gamification                      | Fake fallback data on error                     |
| `NotificationsPanel` | Desktop NavBar only            | GET + PATCH /api/notifications             | Polls every 60s                                 |
| `WeekCarryForward`   | /week                          | PATCH /api/tasks/[id]                      | Reschedule past tasks                           |
| `GoalForm`           | /goals                         | POST /api/goals                            | apiClient                                       |
| `GoalItem`           | /goals                         | PATCH + DELETE /api/goals/[id]             | apiClient                                       |
| `NewProjectForm`     | /projects                      | createProjectAction (Server Action)        | Form POST                                       |
| `ProjectProgress`    | /projects                      | None (data from SSR props)                 | Pure display                                    |
| `KanbanBoard`        | /projects/[id]                 | POST/PATCH/DELETE /api/tasks               | apiClient                                       |
| `AIChat`             | /projects/[id]                 | chatWithProjectAction (Server Action)      | No rate limit                                   |
| `SpaceForm`          | /spaces                        | POST /api/spaces                           | apiClient                                       |
| `SpaceCard`          | /spaces                        | PATCH /api/spaces/[id]                     | apiClient                                       |
| `TaskEditModal`      | FlowBoard (edit)               | PATCH /api/tasks/[id]                      | Full task editing                               |
| `AmbientControls`    | /today header                  | None                                       | UI toggle for ambient background                |

### Dead / Orphaned Components (built but never mounted)

| Component         | File                                 | State           | Description                                                                                             |
| ----------------- | ------------------------------------ | --------------- | ------------------------------------------------------------------------------------------------------- |
| `SearchBar`       | `src/components/SearchBar.tsx`       | ⚠️ **Orphaned** | Full search UI with debounce, Cmd+K shortcut, type-ahead. Calls GET /api/search. NOT imported anywhere. |
| `ShortcutsDialog` | `src/components/ShortcutsDialog.tsx` | ⚠️ **Orphaned** | Keyboard shortcuts reference dialog. NOT imported anywhere.                                             |

---

## 5. API Client Patterns

### Standard: `apiClient` (typed wrapper)

```typescript
// src/lib/apiClient.ts — used by most components
apiClient.get<T>(url);
apiClient.post<T>(url, body);
apiClient.patch<T>(url, body);
apiClient.delete<T>(url);
// → throws ApiError on non-2xx; parses JSON; handles 204
```

### Exception: raw `fetch()` (FocusTimer only)

```typescript
// FocusTimer.tsx — silently swallows errors
await fetch("/api/focus", { method: "POST", ... });
await fetch("/api/gamification", { method: "POST", ... });
// No error handling wrapper; errors are silently dropped
```

### Server Actions (Projects only)

```typescript
// "use server" — bypasses API layer entirely
chatWithProjectAction(projectId, message);
createProjectAction(formData);
deleteProjectAction(id);
suggestSubtasksAction(taskTitle);
// No rate limiting; no REST client compatibility
```

---

## 6. Hidden & Non-obvious Frontend Behaviors

### 🔴 Data & Correctness Issues

| #   | Location        | Issue                                                                                                                                                                                                                     | Impact                     |
| --- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| 1   | `QuestDisplay`  | On gamification API failure, shows **hardcoded fake stats** `{ xp: 1250, level: 3, current_streak: 5 }` — user sees fabricated data                                                                                       | User trust / misleading UI |
| 2   | `FlowBoard`     | Drag-to-reorder updates **local state only** — task order is NOT persisted to the API. On page reload, order resets                                                                                                       | Confusing UX               |
| 3   | `PlanGenerator` | `space_id` is injected **client-side** before `POST /api/plan/apply`. If the AI returns tasks without `space_id`, they get the default space. If apply is called without this injection (e.g., cURL), FK constraint fails | Fragile dependency         |

### 🟡 Architecture & Consistency Issues

| #   | Location             | Issue                                                                                                                                                                                       |
| --- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4   | `FocusTimer`         | Uses raw `fetch()` not `apiClient`. Errors silently swallowed — XP and session saves can fail invisibly                                                                                     |
| 5   | `NotificationsPanel` | Only mounted in **desktop sidebar**. Mobile users (bottom nav) cannot see or interact with notifications                                                                                    |
| 6   | `AIChat`             | Uses Server Action `chatWithProjectAction` — bypasses API layer, no rate limiting, inconsistent with other AI call (plan/daily uses API route)                                              |
| 7   | Week page SSR        | `getTasks(userId, { dateTo: today })` fetches **all tasks from beginning of time** up to today for carry-forward detection. No lower-bound date filter — grows unbounded                    |
| 8   | 4 pages              | `spaceService.ensureDefaultSpace(userId)` is a **write side-effect** triggered on every SSR render of `/today`, `/week`, `/goals`, `/projects` — silently creates DB records on first visit |

### 🟢 Dead Code / Unused Features

| #   | Item                        | State                                                                                                                                             |
| --- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 9   | `SearchBar` component       | Fully implemented (debounce, Cmd+K, type-ahead, `GET /api/search`) — **never mounted** in NavBar or any page                                      |
| 10  | `ShortcutsDialog` component | Built — **never mounted** anywhere                                                                                                                |
| 11  | Task recurrence UI          | `recurrence_rule` field exists in `Task` schema and DB — `TaskEditModal` does NOT expose it — **no UI surface for creating recurring tasks**      |
| 12  | Task dependencies UI        | `task_dependencies` table exists, `taskService` has full dependency logic — **no UI in KanbanBoard or FlowBoard** to add/view/remove dependencies |

---

## 7. Frontend ↔ Backend Feature Matrix

This table shows which backend-implemented features have corresponding frontend UI:

| Feature                 | Backend             | API Route                              | Frontend UI                          | Status                      |
| ----------------------- | ------------------- | -------------------------------------- | ------------------------------------ | --------------------------- |
| Task CRUD               | ✅                  | ✅                                     | ✅ FlowBoard, KanbanBoard, TaskInput | ✅ Complete                 |
| Task comments           | ✅                  | ✅ GET+POST /tasks/[id]/comments       | ⚠️ TaskEditModal (read + write)      | ⚠️ Partial                  |
| Task labels             | ✅                  | ✅ GET+POST+DELETE /tasks/[id]/labels  | ⚠️ TaskEditModal only                | ⚠️ Partial                  |
| Task recurrence         | ✅                  | ✅ (via updateTask)                    | ❌ No UI to set recurrence_rule      | ❌ Dead backend             |
| Task dependencies       | ✅                  | ❌ No route                            | ❌ No UI                             | ❌ Fully dead               |
| Task subtasks           | ✅ (parent_task_id) | ⚠️ Via POST /tasks with parent_task_id | ⚠️ TaskEditModal only                | ⚠️ Partial                  |
| Goals                   | ✅                  | ✅                                     | ✅ /goals page                       | ✅ Complete                 |
| Projects + Kanban       | ✅                  | ⚠️ Server Actions only                 | ✅ /projects pages                   | ⚠️ Inconsistent API         |
| Spaces                  | ✅                  | ✅                                     | ✅ /spaces page                      | ✅ Complete                 |
| Focus sessions          | ✅                  | ✅                                     | ✅ FocusTimer                        | ✅ Complete                 |
| AI daily plan           | ✅                  | ✅                                     | ✅ PlanGenerator                     | ✅ Complete                 |
| AI project chat         | ✅                  | ❌ Server Action only                  | ✅ AIChat                            | ⚠️ No REST API              |
| AI subtask suggest      | ✅                  | ❌ Server Action only                  | ❌ Not surfaced in UI                | ❌ Dead                     |
| Gamification (XP/level) | ✅                  | ✅                                     | ✅ QuestDisplay                      | ⚠️ Fake fallback            |
| Notifications           | ✅                  | ✅                                     | ⚠️ Desktop only                      | ⚠️ Mobile gap               |
| Search                  | ✅                  | ✅ (rate limited)                      | ❌ SearchBar not mounted             | ❌ Dead frontend            |
| Settings                | ✅                  | ✅                                     | ✅ /settings                         | ✅ Complete                 |
| Labels (global)         | ✅                  | ✅                                     | ⚠️ TaskEditModal only                | ⚠️ No label management page |

---

## 8. Frontend Security Observations

| Issue                               | Location                       | Severity | Notes                                                                                        |
| ----------------------------------- | ------------------------------ | -------- | -------------------------------------------------------------------------------------------- |
| No auth guard on home `/`           | `page.tsx`                     | Low      | Intentional? Acts as marketing page. Other pages redirect correctly.                         |
| `POST /api/support` unauthenticated | `SupportForm` → `/api/support` | Medium   | No `auth()` call in route. Spam risk when email provider is wired.                           |
| AI prompt input unsanitized         | `PlanGenerator`, `AIChat`      | Low      | User notes/messages sent directly to Gemini without sanitization. Prompt injection possible. |
| Error details exposed               | `apiClient.ts`                 | Low      | Full server error messages surfaced to UI — may leak internal details.                       |

---

## 9. Performance Observations

| Issue                       | Location             | Impact                                                                    |
| --------------------------- | -------------------- | ------------------------------------------------------------------------- |
| Unbounded task fetch        | `/week` SSR          | `getTasks({ dateTo: today })` grows with time                             |
| Parallel project task fetch | `/projects` SSR      | `Promise.all(projects.map(getProjectTasks))` — N DB queries per page load |
| 60s polling                 | `NotificationsPanel` | No WebSocket/SSE — constant background requests                           |
| No pagination anywhere      | All list pages       | Full result sets loaded on every render                                   |

---

## References

- **Pages:** `src/app/*/page.tsx`
- **Components:** `src/components/`
- **API Client:** `src/lib/apiClient.ts`
- **Auth:** `src/auth.ts`, `proxy.ts`
- **API Routes:** `src/app/api/**`
- **Server Actions:** `src/app/projects/actions.ts`
