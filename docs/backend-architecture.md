# MindToosa Backend Architecture

**Last Updated:** 2026-02-19  
**Status:** Analysis & Documentation Phase

## 1. System Overview

MindToosa is a Next.js 16.1.6 application with a multi-layer backend architecture:

```
Client (Browser)
  ↓
NextAuth OAuth (Google)
  ↓
Proxy (historically `middleware.ts`) (auth gate) (historically middleware)
  ↓
Next.js API Routes / Server Actions
    ↓
Service Layer (12 specialized services)
    ↓
Supabase Client (service-role key bypasses RLS)
    ↓
PostgreSQL Database (RLS as second layer)
```

**Key Principle:** Defense-in-depth authentication. Each layer validates `user_id` (email).

---

## 2. Technology Stack

| Component      | Technology           | Version        | Purpose                                   |
| -------------- | -------------------- | -------------- | ----------------------------------------- |
| **Framework**  | Next.js              | 16.1.6         | App Router, Server Components, API routes |
| **Language**   | TypeScript           | 5.9.3          | Type safety (strict mode)                 |
| **Auth**       | NextAuth.js          | v5.0.0-beta.30 | OAuth 2.0 (Google), JWT sessions          |
| **Database**   | Supabase             | PostgreSQL     | Relational data + RLS policies            |
| **AI**         | Google Generative AI | v1.42.0        | Gemini 2.0 Flash for plan generation      |
| **Validation** | Zod                  | v4.3.6         | Runtime schema validation                 |
| **Runtime**    | Node.js              | ESM            | Async/await, modern JS                    |

---

## 3. Architecture Layers

### 3.1 Authentication & Authorization Layer

**Entry Point:** `src/auth.ts` (NextAuth configuration)

```typescript
// NextAuth Config
Provider: Google OAuth 2.0
Session: JWT-based (email, name, image)
Secret: NEXTAUTH_SECRET (env var, ≥32 chars)
```

**Flow:**

1. User logs in via Google → OAuth callback
2. NextAuth issues JWT session token
3. `session.user.email` becomes the unique user identifier
4. Proxy (`proxy.ts`) protects all page routes (historically `proxy.ts`).

**Session Structure:**

```typescript
{
  user: {
    email: string (TEXT, matches auth.users.email)
    name?: string
    image?: string
  },
  expires: ISO timestamp
}
```

**Proxy Enforcement (`proxy.ts`) (historically `proxy.ts`):**

- Matcher: excludes `/api/**`, `/_next/**`, `/static/**`
- All page routes require valid `session.user.email`
- Returns 401 if session missing or expired

### 3.2 API Layer

**Location:** `src/app/api/**`

**Patterns:**

1. **Authentication Check** (every route)

   ```typescript
   const session = await auth();
   if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });
   const userId = session.user.email;
   ```

2. **Input Validation** (mutating endpoints)

   ```typescript
   const parsed = MySchema.safeParse(await req.json());
   if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });
   ```

3. **Service Call** (business logic delegation)

   ```typescript
   const result = await myService.method(userId, parsed.data);
   return NextResponse.json(result);
   ```

4. **Error Handling** (structured responses)
   - 400: Validation errors
   - 401: Missing/invalid session
   - 404: Resource not found
   - 429: Rate limited (search only)
   - 500: Server errors

**Routes by Category:**

| Category          | Endpoints                                                                                             | Pattern                                  |
| ----------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| **Tasks**         | GET/POST /tasks, PATCH/DELETE /tasks/[id], GET/POST /tasks/[id]/comments, GET/POST /tasks/[id]/labels | Service layer ✓                          |
| **Goals**         | GET/POST /goals, PATCH/DELETE /goals/[id]                                                             | Service layer ✓                          |
| **Projects**      | N/A (server actions only)                                                                             | Server action ✓                          |
| **Spaces**        | GET/POST /spaces, PATCH /spaces/[id]                                                                  | Mixed (GET direct DB ⚠️, POST service ✓) |
| **Labels**        | GET/POST /labels, DELETE /labels/[id]                                                                 | Service layer ✓                          |
| **Settings**      | GET/PATCH /settings                                                                                   | Service layer ✓                          |
| **Notifications** | GET/PATCH /notifications                                                                              | Service layer ✓                          |
| **Gamification**  | GET/POST /gamification                                                                                | Service layer ✓                          |
| **Focus**         | GET/POST /focus                                                                                       | Service layer ✓                          |
| **Search**        | GET /search (rate limited: 20/min)                                                                    | Service layer ✓                          |
| **AI Planning**   | POST /plan/daily, POST /plan/apply                                                                    | Service layer + LLM ✓                    |

**Inconsistencies Found:**

- ⚠️ `GET /spaces` queries DB directly (bypasses spaceService)
- ⚠️ `PATCH /spaces/[id]` uses manual field filtering instead of Zod schema

### 3.3 Service Layer

**Location:** `src/server/services/`

**12 Specialized Services:**

1. **taskService** - Task CRUD, dependencies, comments, recurrence
2. **goalService** - Goal management, horizons
3. **projectService** - Project CRUD, task associations
4. **spaceService** - Workspace organization
5. **labelService** - Task labels and categorization
6. **userService** - User settings/preferences
7. **gamificationService** - XP, streaks, level tracking
8. **focusService** - Focus session logging
9. **notificationService** - User notifications
10. **recurrenceService** - Recurring task logic (validates rrule, calculates next date)
11. **searchService** - Full-text search across tasks/projects/goals
12. **llmClient** - Google AI integration (plan generation, chat, subtask suggestions)

**Service Pattern:**

```typescript
export const myService = {
  async getItems(userId: string, filters: Filters): Promise<Item[]> {
    // 1. Validate input
    if (!userId) throw new AuthError("Missing userId");

    // 2. Query database with userId filter
    const { data, error } = await db.from("table").select("*").eq("user_id", userId);

    // 3. Handle errors
    if (error) throw new AppError(error.message);

    // 4. Return typed data
    return data as Item[];
  },
};
```

**Key Characteristics:**

- Every method receives `userId` as first parameter
- Every query includes `.eq("user_id", userId)` filter
- Input validation via Zod schemas
- Consistent error handling (typed errors: AppError, ValidationError, AuthError)
- No cross-service calls (except taskService → recurrenceService dynamic import)

### 3.4 Server Actions

**Location:** `src/app/projects/actions.ts`

```typescript
"use server";

export async function createProjectAction(formData: FormData) {
  // 1. Extract and validate session
  const session = await auth();
  const userId = session?.user?.email;
  if (!userId) throw new Error("Unauthorized");

  // 2. Parse form data
  const name = formData.get("name") as string;
  if (!name) throw new Error("Name required");

  // 3. Call service
  await projectService.createProject(userId, { name, description, color });

  // 4. Revalidate cache
  revalidatePath("/projects");
}
```

**Pattern:**

- Extract `userId` from session
- Parse and validate input manually (no Zod)
- Call service method
- Revalidate affected pages

**Actions:** createProjectAction, deleteProjectAction, chatWithProjectAction, suggestSubtasksAction

### 3.5 Database & Data Access

**Client:** Supabase (service-role key)

```typescript
// src/server/db.ts
const db = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY // Bypasses RLS intentionally
);
```

**Design Decision:**

- Service role key bypasses RLS policies
- Authorization enforced in service layer (`.eq("user_id", userId)`)
- RLS policies serve as documentation of intended access patterns
- Benefits: simpler queries, testability, fallback security

**Row-Level Security (RLS):**

Every table has email-based RLS policy:

```sql
-- Standard pattern (most tables)
CREATE POLICY user_isolation ON table_name
  FOR ALL USING (user_id = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Variation for junction tables (task_labels)
USING (EXISTS (SELECT 1 FROM tasks WHERE id = task_id AND user_id = current_setting('request.jwt.claim.email')));
```

**Schema Overview:**

```
┌─────────────────────────────────────────────────────┐
│                  auth.users (Supabase)              │
│  id (uuid) | email (text) | name | image           │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┼────────────┬─────────────┐
        │            │            │             │
   ┌────▼─────┐ ┌──▼─────┐ ┌────▼──┐ ┌───────▼──┐
   │  spaces   │ │  goals │ │ tasks │ │ projects │
   │ (PK: id) │ │(PK: id)│ │(PK:id)│ │(PK: id) │
   │ user_id ◄┼─┤user_id │ │user_id│ │user_id  │
   │  (email) │ │(email) │ │(email)│ │(email) │
   └──────────┘ └─┬──────┘ └──┬────┘ └────────┘
                  │           │
         ┌─────────┘           │
         │           ┌─────────┴──────────┐
         │           │                    │
     ┌───▼──────┐ ┌──▼────────┐ ┌──────▼──┐
     │task_deps  │ │task_labels│ │comments │
     │(Junction) │ │(Junction) │ │(PK: id) │
     └────┬──────┘ └───┬──────┘ └─────────┘
          │            │
    ┌─────▼──┐ ┌──────▼──┐ ┌─────────────┐
    │ labels │ │gamif.   │ │focus_       │
    │        │ │stats    │ │sessions     │
    └────────┘ └─────────┘ └─────────────┘
```

**User Identity Field:**

- Type: TEXT (email string)
- NOT UUID
- Matches `auth.users.email` exactly
- Pros: Human-readable, deduplicates OAuth user
- Cons: Prevents email changes, case sensitivity issues

---

## 4. Data Flows

### 4.1 Authentication Flow

```
User (Browser)
  ↓
[Clicks "Sign in with Google"]
  ↓
Google OAuth → Callback to /api/auth/callback/google
  ↓
NextAuth exchanges code for tokens
  ↓
Creates JWT session: { user: { email, name, image }, expires }
  ↓
Session cookie set (secure, HTTP-only)
  ↓
Proxy checks session on next page load (historically middleware)
  ↓
If valid → Render page; Extract session.user.email as userId
  ↓
Every API call includes userId in headers/query (implicit in auth() call)
```

### 4.2 Task CRUD Flow

**Create Task:**

```
POST /api/tasks (from component)
  ↓
[Auth check] session.user.email → userId
  ↓
[Validation] TaskSchema.safeParse(body)
  ↓
taskService.createTask(userId, { title, description, space_id, ... })
  ↓
[Service validation] Verify space_id belongs to user
  ↓
db.from("tasks").insert({ user_id: userId, ... })
  ↓
[Side Effects]
  - If recurrence_rule: Call recurrenceService.getNextDueDate()
  - Update gamificationService (XP tracking)
  ↓
Return Task with ID to client
```

**Update Task (Status Change):**

```
PATCH /api/tasks/[taskId]
  ↓
[Auth + Ownership] Verify task belongs to userId
  ↓
[Validation] TaskUpdateSchema (strict, rejects unknown fields)
  ↓
taskService.updateTask(userId, taskId, updates)
  ↓
[Complex Logic]
  - If status="done" AND recurrence_rule:
    → recurrenceService.getNextDueDate()
    → createTask(...) for next occurrence
  - If status="done" AND blocking dependencies:
    → Throw error "Cannot complete task with blocking dependencies"
  ↓
db.from("tasks").update(...).eq("id", taskId).eq("user_id", userId)
  ↓
[Side Effects]
  - gamificationService.addXP(userId, points)
  - notificationService.create() if mentioned users
  ↓
Return updated Task
```

**Delete Task (Cascade):**

```
DELETE /api/tasks/[taskId]
  ↓
taskService.deleteTask(userId, taskId)
  ↓
db.from("tasks").delete().eq("id", taskId).eq("user_id", userId)
  ↓
[Database Cascade]
  - task_comments (DELETE CASCADE)
  - task_dependencies (DELETE CASCADE)
  - task_label_assignments (DELETE CASCADE)
  - focus_sessions (SET NULL on task_id)
  ↓
[Service side effect]
  - gamificationService updates (streak reset if applicable)
  ↓
Return success
```

### 4.3 Daily Planning Flow

```
User navigates to /today
  ↓
[Server Component] getAuthUserId()
  ↓
Call POST /api/plan/daily (from component)
  ↓
[Auth check] Extract userId from session
  ↓
[Fetch context]
  - taskService.getTasks(userId, { date: today, archived: false })
  - goalService.getGoals(userId, { archived: false })
  ↓
[AI Generation]
  - llmClient.generateDailyPlan(userId, { tasks, goals, settings })
  - Sends to Gemini 2.0 Flash: "Optimize today's tasks given goals"
  - Returns: DailyPlan { tasks: [ { id, order, priority, duration_min } ] }
  ↓
Return DailyPlan to client
  ↓
User reviews and clicks "Apply Plan"
  ↓
POST /api/plan/apply
  ↓
[Validation] ApplyPlanSchema { date, tasks: [ { id, order, priority, duration_min } ] }
  ↓
[Atomic update loop]
  FOR each task in plan:
    taskService.updateTask(userId, taskId, { order, priority, duration_minutes })
  ↓
[Side effects]
  - revalidatePath("/today")
  ↓
Return success
```

### 4.4 Recurring Task Flow

```
User creates task with recurrence_rule: "FREQ=DAILY;INTERVAL=1"
  ↓
taskService.createTask(userId, { ..., recurrence_rule })
  ↓
[Validation] recurrenceService.validateRule(rule) → boolean
  ↓
db.from("tasks").insert({ ..., recurrence_rule, parent_recurring_task_id: null })
  ↓
Task created
  ↓
--- LATER: User marks task as done ---
  ↓
PATCH /api/tasks/[taskId] { status: "done" }
  ↓
taskService.updateTask(userId, taskId, { status: "done" })
  ↓
[Check recurrence]
  if (recurrence_rule && status="done") {
    nextDueDate = recurrenceService.getNextDueDate(recurrence_rule, due_date)
    if (nextDueDate) {
      taskService.createTask(userId, {
        title, description, space_id, ...,
        recurrence_rule,
        parent_recurring_task_id: taskId,
        due_date: nextDueDate
      })
    }
  }
  ↓
db.from("tasks").update({ status: "done" }).eq("id", taskId)
  ↓
Return updated task with next_recurrence_date
```

### 4.5 Project Chat Flow

```
User navigates to Project detail
  ↓
[Server Component] loads project + tasks
  ↓
User types message in chat and clicks Send
  ↓
[Client Action] chatWithProjectAction(projectId, message)
  ↓
[Auth + Ownership] Extract userId, verify project ownership
  ↓
[Service fetch]
  projectService.getProjectById(userId, projectId)
  → Returns: { id, name, description, tasks: [...] }
  ↓
[Serialize context]
  context = `Project: ${project.name}\nTasks:\n${tasks.map(t => t.title).join('\n')}`
  ↓
[LLM call]
  llmClient.chatWithProject(userId, projectId, message, context)
  → Sends to Gemini: message + project context
  → Returns: string (AI response)
  ↓
Return response to client
  ↓
[UI] Display message in chat
```

### 4.6 Search Flow (Rate Limited)

```
User types in search box
  ↓
[Debounce] 300ms wait before query
  ↓
GET /api/search?q=query_string
  ↓
[Auth check] userId = session.user.email
  ↓
[Rate limit check] rateLimit(userId, "search", 20, 60000)
  if (exceeded) return 429 { error: "Rate limited" }
  ↓
searchService.search(userId, query)
  ↓
[Parallel queries]
  - db.from("tasks").select(...).ilike("title", `%${query}%`).eq("user_id", userId)
  - db.from("projects").select(...).ilike("name", `%${query}%`).eq("user_id", userId)
  - db.from("goals").select(...).ilike("title", `%${query}%`).eq("user_id", userId)
  ↓
[Combine & return]
  SearchResult { tasks: [...], projects: [...], goals: [...] }
  ↓
⚠️ Issue: In-memory rate limiter breaks on serverless (needs Redis)
```

### 4.7 Error Propagation Flow

```
Client calls API route
  ↓
Service method throws error
  ↓
[Error Type Dispatch]
  - AppError("msg", "code") → 500
  - ValidationError("msg", "field") → 400
  - AuthError("msg") → 401
  - Generic Error → 500 (catch-all)
  ↓
Route catches error
  ↓
Return NextResponse.json({ error: message, code?, field? }, { status })
  ↓
Client receives error response
  ↓
[Frontend] Display error toast/alert
```

---

## 5. Service Layer Details

### Service Method Patterns

**Get Methods:**

```typescript
async getItems(userId: string, filters?: Filters): Promise<Item[]> {
  if (!userId) throw new AuthError("Missing userId");
  const { data, error } = await db
    .from("items")
    .select("*")
    .eq("user_id", userId)
    .match(filters);
  if (error) throw new AppError(error.message);
  return data as Item[];
}
```

**Create Methods:**

```typescript
async createItem(userId: string, item: CreateItemInput): Promise<Item> {
  if (!userId) throw new AuthError("Missing userId");
  const parsed = ItemSchema.safeParse(item);
  if (!parsed.success) throw new ValidationError("Invalid item", parsed.error);

  const { data, error } = await db
    .from("items")
    .insert({ ...parsed.data, user_id: userId })
    .select()
    .single();
  if (error) throw new AppError(error.message);
  return data as Item;
}
```

**Update Methods with Side Effects:**

```typescript
async updateTask(userId: string, taskId: string, updates: TaskUpdates): Promise<Task> {
  // Ownership check
  const task = await db.from("tasks").select("*").eq("id", taskId).eq("user_id", userId).single();
  if (!task) throw new AuthError("Task not found");

  // Main update
  const { data, error } = await db
    .from("tasks")
    .update(updates)
    .eq("id", taskId)
    .select()
    .single();
  if (error) throw new AppError(error.message);

  // Side effects
  if (updates.status === "done" && task.recurrence_rule) {
    const nextDueDate = recurrenceService.getNextDueDate(task.recurrence_rule, task.due_date);
    if (nextDueDate) {
      await createTask(userId, { ...task, due_date: nextDueDate });
    }
  }

  return data as Task;
}
```

### Service Interdependencies

| Service     | Calls                                                            | Reason                                    |
| ----------- | ---------------------------------------------------------------- | ----------------------------------------- |
| taskService | recurrenceService.validateRule, recurrenceService.getNextDueDate | Validate and compute recurring task dates |
| llmClient   | N/A (standalone)                                                 | LLM integration                           |
| All others  | N/A                                                              | Standalone domain services                |

**Current State:** Minimal coupling. Services do NOT call each other (except taskService → recurrenceService).

---

## 6. Input Validation Strategy

### Zod Schemas (Applied at Route Level)

| Endpoint                  | Schema                     | Validation                                                            |
| ------------------------- | -------------------------- | --------------------------------------------------------------------- |
| POST /tasks               | TaskSchema                 | title, description, space_id, goal_id, project_id, priority, due_date |
| PATCH /tasks/[id]         | TaskUpdateSchema (strict)  | Subset of fields; rejects unknown fields                              |
| POST /tasks/[id]/comments | CommentCreateSchema        | content, mentioned_user_emails                                        |
| POST /tasks/[id]/labels   | LabelAssignSchema          | label_id (uuid)                                                       |
| POST /goals               | GoalSchema                 | title, description, horizon, space_id                                 |
| PATCH /goals/[id]         | N/A ⚠️                     | No schema validation (inconsistency)                                  |
| POST /labels              | LabelCreateSchema          | name, color (default #6366f1)                                         |
| POST /settings            | Partial UserSettingsSchema | Subset of fields (upsert)                                             |
| POST /plan/apply          | ApplyPlanSchema            | date (YYYY-MM-DD), tasks (50 max), priorities validated               |

### Service-Level Validation

| Service      | Validation                                                           |
| ------------ | -------------------------------------------------------------------- |
| taskService  | UUID format, circular dependency detection, parent task validation   |
| labelService | Ownership check (label must belong to user)                          |
| All services | User ID verification (every method starts with `if (!userId) throw`) |

### Database Constraints

| Table                  | Constraint                        | Type                               |
| ---------------------- | --------------------------------- | ---------------------------------- |
| task_dependencies      | no_self_dependency                | CHECK (task_id ≠ blocking_task_id) |
| task_dependencies      | unique_dependency                 | UNIQUE (task_id, blocking_task_id) |
| spaces                 | unique user space                 | UNIQUE (user_id, name)             |
| task_label_assignments | FOREIGN KEY task_id → tasks(id)   | Cascade delete                     |
| task_label_assignments | FOREIGN KEY label_id → labels(id) | Cascade delete                     |

---

## 7. Caching & Revalidation

### Next.js Cache Revalidation

| Operation      | Revalidates              | Method                             |
| -------------- | ------------------------ | ---------------------------------- |
| Create project | /projects                | revalidatePath("/projects")        |
| Delete project | /projects                | revalidatePath("/projects")        |
| Update task    | /today (if today's task) | Implicit (route refresh on client) |

**Pattern:** Server actions call `revalidatePath()` after mutations.

**Current State:** Limited revalidation; mostly relies on client-side re-fetching.

---

## 8. Security Model

### Defense-in-Depth

**Layer 1: NextAuth JWT**

- Google OAuth validates identity
- JWT issued with email + expiration

**Layer 2: Middleware (`proxy.ts`)**

- All page routes require valid session
- 401 if missing or expired

**Layer 3: API Route Auth Check**

- Every route extracts `session.user.email` as userId
- 401 if missing

**Layer 4: Service Layer Ownership Check**

- Every service method filters by `.eq("user_id", userId)`
- Prevents cross-user data access

**Layer 5: Database RLS**

- Email-based policies (backup security)
- Enforced if JWT bypass discovered

### Known Security Gaps

| Issue                               | Severity | Notes                                                           |
| ----------------------------------- | -------- | --------------------------------------------------------------- |
| focus_sessions lacks RLS            | Medium   | No RLS policy; service-layer check only                         |
| Task ownership for label assignment | Medium   | Service updates label without re-checking task ownership        |
| LLM prompt injection                | Low      | No sanitization of user data sent to Gemini                     |
| Error message details               | Low      | Some routes leak internal details (e.g., constraint violations) |
| No CSRF protection                  | Low      | Server actions don't require CSRF tokens (default Next.js)      |

---

## 9. Infrastructure Gaps

| Gap                       | Impact                 | Current                    | Ideal                         |
| ------------------------- | ---------------------- | -------------------------- | ----------------------------- |
| **Rate Limiting**         | Breaks on serverless   | In-memory Map              | Redis-backed                  |
| **Request Logging**       | Can't debug issues     | console.error (sparse)     | Structured logging middleware |
| **Pagination**            | Scalability            | Fetch all (`.select("*")`) | Limit + offset utilities      |
| **Request Tracing**       | Debugging              | None                       | Request ID + trace ID         |
| **Error Standardization** | Inconsistent responses | Mixed error types          | Unified error format          |
| **Audit Logging**         | No accountability      | None                       | Track who changed what/when   |

---

## 10. API Response Formats

### Success Responses

```typescript
// Single resource
GET /api/tasks/[id]
→ 200 { Task }

// Collection
GET /api/tasks?spaceId=X
→ 200 { tasks: Task[] }

// Mutation
POST /api/tasks
→ 201 { Task }

// No content
DELETE /api/tasks/[id]
→ 204 (no body)
```

### Error Responses

```typescript
// Validation error
400 {
  error: "Validation error",
  details: {
    field: "title",
    message: "Required"
  }
}

// Auth error
401 {
  error: "Unauthorized"
}

// Rate limited
429 {
  error: "Rate limited",
  retryAfter: 60
}

// Server error
500 {
  error: "Internal server error"
}
```

---

## 11. Key Architectural Decisions

| Decision                 | Rationale                              | Trade-off                                    |
| ------------------------ | -------------------------------------- | -------------------------------------------- |
| Email as user_id         | Matches OAuth provider; human-readable | Prevents email changes; normalization issues |
| Service role key         | Simpler app-layer auth; testability    | Requires diligent service-layer checks       |
| Service-layer caching    | None by default                        | Client re-fetches on every action (latency)  |
| In-memory rate limit     | Quick to implement                     | Breaks on serverless/multi-instance          |
| Minimal service coupling | Simpler to test/maintain               | No cross-service transactions                |
| NextAuth v5 beta         | Latest features                        | Potential stability issues (beta version)    |

---

## 12. Checklist for Future Developers

**Understanding the System:**

- [ ] Read src/auth.ts to understand OAuth flow
- [ ] Trace a task creation from component → API → service → DB
- [ ] Find where userId is validated at each layer
- [ ] Identify all side effects in taskService (recurrence, gamification)
- [ ] Understand why service role key is acceptable (app-layer auth)

**Adding a New Feature:**

- [ ] Create Zod schema for input validation
- [ ] Add service method with userId filter
- [ ] Create API route with auth check
- [ ] Add RLS policy to database table
- [ ] Test ownership isolation (userId mismatch fails)
- [ ] Add revalidatePath() to server action if needed

**Security Review:**

- [ ] Verify every service method includes `.eq("user_id", userId)`
- [ ] Check API routes reject missing session
- [ ] Confirm RLS policies exist and match service filters
- [ ] Test cross-user data access (should fail)
- [ ] Validate Zod schemas prevent injection

---

## References

- **Auth:** src/auth.ts, proxy.ts (historically src/proxy.ts)
- **Services:** src/server/services/\*\*
- **Routes:** src/app/api/\*\*
- **Database:** supabase/migrations/
- **Types:** src/core/planTypes.ts, src/core/types.ts
