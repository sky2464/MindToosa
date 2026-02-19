# MindToosa Backend: Inconsistencies & Architectural Gaps Analysis

**Last Updated:** 2026-02-19  
**Purpose:** Document deviations from expected patterns and design principles

---

## 1. Pattern Inconsistencies

### 1.1 Mixed Service/Direct-DB Access

**Issue:** Spaces API inconsistently bypasses service layer for GET operations.

| Endpoint | Pattern | Expected | Issue |
|----------|---------|----------|-------|
| `GET /spaces` | Direct DB query | Use `spaceService.getSpaces()` | ✓ Inconsistent with other resources |
| `POST /spaces` | Uses spaceService ✓ | ✓ Consistent | N/A |
| `PATCH /spaces/[id]` | Direct DB query | Use `spaceService.updateSpace()` | ✓ Manual field filtering |

**Code Location:** `src/app/api/spaces/route.ts`

```typescript
// Current (inconsistent)
const { data } = await db
  .from("spaces")
  .select("*")
  .eq("user_id", userId);

// Expected (consistent)
const spaces = await spaceService.getSpaces(userId);
```

**Impact:**
- ⚠️ Inconsistent with architecture intent (all mutations through services)
- ⚠️ Bypasses any future service-layer middleware (logging, caching)
- ⚠️ Duplicates ownership validation logic
- ⚠️ Harder to test (direct DB dependency instead of service)

**Recommendation:** Migrate to `spaceService.getSpaces()` and `spaceService.updateSpace()`

---

### 1.2 Server Actions vs. API Routes

**Issue:** Projects use server actions; all other resources use API routes.

| Resource | Mutation Pattern | Query Pattern | Consistency |
|----------|-----------------|--------------|-------------|
| Tasks | API routes | API routes | ✓ |
| Goals | API routes | API routes | ✓ |
| Projects | Server actions | N/A ⚠️ | ✗ Inconsistent |
| Spaces | API routes + Direct DB | API routes | ⚠️ Partial inconsistency |
| Labels | API routes | API routes | ✓ |
| Settings | API routes | API routes | ✓ |

**Code Locations:**
- Server Actions: `src/app/projects/actions.ts`
- API Routes: `src/app/api/**`

**Issue:** Projects have no dedicated API routes; only server actions.

```typescript
// Project mutations via server action only
'use server'
export async function createProjectAction(formData: FormData) { ... }

// But tasks have full API coverage
POST /api/tasks       ← API route
GET /api/tasks        ← API route
PATCH /api/tasks/[id] ← API route
```

**Impact:**
- ⚠️ Inconsistent client mutation pattern
- ⚠️ Projects can't be managed via REST client or external tools
- ⚠️ Different error handling patterns (server actions throw; API routes return responses)
- ⚠️ Harder for new developers to predict where to add mutations

**Recommendation:** Decide:
1. Migrate all projects to API routes (consistent with other resources)
2. OR migrate all resources to server actions (simpler, but less flexible)
3. OR document the decision and keep both (with clear guidelines)

---

### 1.3 Input Validation Inconsistencies

| Endpoint | Validation Pattern | Validated | Issue |
|----------|------------------|-----------|-------|
| `POST /tasks` | Zod schema | ✓ Complete | N/A |
| `PATCH /tasks/[id]` | Zod schema (strict) | ✓ Complete | N/A |
| `PATCH /goals/[id]` | None | ✗ Missing | ⚠️ Accepts any field |
| `PATCH /spaces/[id]` | Manual field whitelist | Partial | ⚠️ Not Zod |
| `POST /spaces` | Zod schema | ✓ Complete | N/A |

**Examples:**

```typescript
// ✓ Good: Strict validation
const parsed = TaskUpdateSchema.strict().safeParse(body);
if (!parsed.success) return error;

// ✗ Bad: No validation
async function PATCH(req) {
  const body = await req.json();
  await goalService.updateGoal(userId, goalId, body); // Any field accepted
}

// ⚠️ Partial: Manual whitelist
const name = (await req.json()).name;
const archived = (await req.json()).archived;
// But what if client sends other fields? Silent ignore.
```

**Impact:**
- ⚠️ Allows arbitrary field updates on goals (could corrupt data)
- ⚠️ Inconsistent error messages (goals accept anything; tasks reject unknown fields)
- ⚠️ Harder to enforce business rules (e.g., prevent editing certain fields)

**Recommendation:** Use Zod schemas for ALL mutating endpoints with `.strict()` to reject unknown fields.

---

### 1.4 Error Handling Inconsistencies

| Layer | Pattern | Consistency |
|-------|---------|-------------|
| Service | Throws typed errors (AppError, ValidationError, AuthError) | ✓ Consistent |
| API Routes | Catch all; return NextResponse.json | ⚠️ Partial |
| API Routes | Some routes have no error handling | ✗ Unsafe |

**Examples:**

```typescript
// ✓ Good: Structured error handling
try {
  const result = await service.method(userId, data);
  return NextResponse.json(result);
} catch (error: unknown) {
  if (error instanceof ValidationError) return json({ error }, { status: 400 });
  if (error instanceof AuthError) return json({ error }, { status: 401 });
  return json({ error: "Unknown error" }, { status: 500 });
}

// ✗ Bad: No error handling
const result = await service.method(userId, data);
return NextResponse.json(result); // If service throws, unhandled!
```

**Endpoints with Potentially Unsafe Error Handling:**
- `GET /gamification` - No try-catch (might throw if stats don't exist)
- `POST /plan/daily` - LLM errors not explicitly caught
- `POST /plan/apply` - Batch updates could fail mid-way

**Impact:**
- ⚠️ Unhandled promise rejections crash API routes
- ⚠️ Clients receive 500 errors without structured response
- ⚠️ Debugging difficult (no error details in response)

**Recommendation:** Wrap all service calls in try-catch with typed error handling.

---

### 1.5 Authorization Verification Patterns

| Method | Pattern | Consistency |
|--------|---------|-------------|
| Tasks | Service-layer check `.eq("user_id", userId)` | ✓ |
| Goals | Service-layer check `.eq("user_id", userId)` | ✓ |
| Comments | Service-layer check + task ownership verification | ✓ Strict |
| Labels | Manual loop to verify ownership on every label | ⚠️ Verbose |
| Projects | Service-layer check `.eq("user_id", userId)` | ✓ |
| Spaces | Direct DB, no service wrapper | ✗ Missing wrapper |

**Example (Labels - verbose approach):**
```typescript
// Current: Verify ownership for EVERY label
const { data: tasks } = await db.from("task_labels").select("task_id").eq("user_id", userId).eq("id", labelId);
if (tasks.length === 0) throw new AuthError("Label not found");

// Expected: Simpler service wrapper
const label = await labelService.getLabel(userId, labelId);
```

**Impact:**
- ⚠️ Inconsistent complexity
- ⚠️ Duplication of authorization logic
- ⚠️ Harder to audit security

**Recommendation:** Standardize to service-layer `.eq("user_id", userId)` pattern across all resources.

---

## 2. Database Design Issues

### 2.1 User Identity Field Design

**Current State:** Email (TEXT) used as `user_id` instead of UUID.

**Trade-offs:**

| Aspect | Email | UUID |
|--------|-------|------|
| **Human-readable** | ✓ Yes | ✗ No |
| **Deduplication** | ✓ Matches OAuth | ⚠️ Need mapping |
| **Email changes** | ✗ Cannot update | ✓ Can change |
| **Query performance** | ⚠️ String comparison | ✓ Integer/UUID |
| **Normalization** | ✗ Case-sensitive | ✓ Consistent |
| **Data model clarity** | ⚠️ Mixed types | ✓ Single type |

**Issues:**
- ⚠️ If user email changes (rare but possible), all records become orphaned
- ⚠️ Case sensitivity could cause duplicate users (example@gmail.com vs Example@gmail.com)
- ⚠️ String joins slower than UUID joins at scale
- ⚠️ Inconsistent with auth.users table structure (which uses UUID id)

**Code Evidence:**
```typescript
// Tables use TEXT for user_id
CREATE TABLE tasks (
  user_id TEXT NOT NULL, -- ← Email string
  ...
  FOREIGN KEY (user_id) REFERENCES auth.users(email)
);

// But auth.users has both uuid id and email
-- auth.users
-- id: uuid (primary key)
-- email: text (unique)
```

**Recommendation:** Long-term migration to `auth.users.id` (UUID) as user_id, with email as secondary lookup.

---

### 2.2 Cascading Delete Complexity

**Issue:** Cascading deletes on complex dependency trees could silently delete unexpected data.

**Example Cascade Chain:**
```
DELETE task
  ↓ CASCADE
  ├─ task_comments (cleaned)
  ├─ task_dependencies (cleaned)
  ├─ task_label_assignments (cleaned)
  ├─ focus_sessions (task_id SET NULL, but not deleted)
  └─ Child tasks (parent_task_id SET NULL)
```

**Risk:** Deleting a project cascades to:
1. All tasks in project
2. All comments on those tasks
3. All labels assigned
4. All focus sessions lose reference
5. All subtasks orphaned (parent_task_id = NULL)

**Impact:**
- ⚠️ Difficult to audit what was deleted
- ⚠️ No soft-delete option (hard delete permanent)
- ⚠️ No recovery mechanism

**Recommendation:** Implement soft-delete (archived flag) before hard delete, or add audit logging.

---

### 2.3 Missing Indexes

**Potential Performance Issues:**

| Table | Column | Current Index | Needed |
|-------|--------|--------|--------|
| tasks | parent_task_id | ✗ | ✓ (for fetching subtasks) |
| focus_sessions | task_id | ✗ | ✓ (for task focus history) |
| task_comments | created_at | ✗ | ✓ (for sorting by time) |
| notifications | created_at | ✗ | ✓ (for reverse-chronological feeds) |

**Code Location:** `supabase/migrations/0006-*.sql`

**Impact:**
- ⚠️ Table scans on historical queries (focus sessions by date range)
- ⚠️ Slow subtask fetches as user accumulates tasks

**Recommendation:** Add indexes on foreign keys and timestamp columns.

---

## 3. Cross-Cutting Concerns

### 3.1 Missing Infrastructure

#### 3.1.1 Rate Limiting (Broken on Serverless)

**Current Implementation:**
```typescript
// src/server/rateLimit.ts
const userRequests = new Map<string, number[]>();

export function rateLimit(userId: string, endpoint: string, limit: number, window: number): boolean {
  const key = `${userId}:${endpoint}`;
  const now = Date.now();
  const requests = userRequests.get(key) || [];
  
  // Keep only recent requests
  const recent = requests.filter(t => now - t < window);
  
  if (recent.length >= limit) return false;
  
  recent.push(now);
  userRequests.set(key, recent);
  return true;
}
```

**Issues:**
- ✗ In-memory Map shared across processes
- ✗ Breaks on serverless (Vercel has ephemeral processes)
- ✗ No persistence across container restarts
- ✓ Works locally; fails in production

**Current Usage:**
- Search endpoint only (20 requests/min per user)
- Other endpoints have no rate limiting

**Recommendation:** Migrate to Redis-backed rate limiter for production.

---

#### 3.1.2 Request Logging & Observability

**Current State:** Sparse console.error calls; no structured logging.

```typescript
// Sparse logging
if (error) {
  console.error("Search error:", error);
}

// No request-level logging
// No trace IDs
// No performance metrics
// No request/response logging
```

**Missing:**
- Request ID / Trace ID
- Request duration (latency)
- Status codes
- Error stack traces
- User actions audit trail

**Recommendation:** Add middleware for structured logging (JSON format with trace IDs).

---

#### 3.1.3 Pagination

**Current State:** All `.select("*")` queries fetch entire result sets.

```typescript
// ✗ Fetches ALL tasks
const { data } = await db
  .from("tasks")
  .select("*")
  .eq("user_id", userId);

// ✓ Expected with pagination
const { data } = await db
  .from("tasks")
  .select("*")
  .eq("user_id", userId)
  .range(0, 49); // First 50 results

// ✓ Expected: Client specifies page
.range((page - 1) * pageSize, page * pageSize - 1);
```

**Endpoints Missing Pagination:**
- `GET /tasks` (could be 1000+ tasks)
- `GET /goals` (could be 100+ goals)
- `GET /projects` (could be 50+ projects)
- `GET /notifications` (could be 1000+ notifications)

**Impact:**
- ⚠️ Slow on users with lots of data
- ⚠️ Memory bloat (all results in memory)
- ⚠️ Network bloat (send all records to client)
- ⚠️ No scroll/pagination UX in frontend

**Recommendation:** Add `.limit(50).offset(page * 50)` to all list endpoints.

---

#### 3.1.4 Transaction Support

**Current State:** No multi-step transactions.

**Issue Example:**
```
User applies AI plan with 50 tasks:
  1. Update task 1 ← success
  2. Update task 2 ← success
  ...
  45. Update task 45 ← SUCCESS
  46. Update task 46 ← DATABASE ERROR (constraint violation)
  47-50. NEVER EXECUTED
  ↓
Partial data corruption: 45 tasks updated, 5 tasks not.
```

**Current `plan/apply` Code:**
```typescript
for (const task of plan.tasks) {
  await taskService.updateTask(userId, task.id, { order, priority });
  // If fails on task 10, tasks 1-9 already updated!
}
```

**Recommendation:** Wrap multi-update operations in database transactions.

---

### 3.2 Service-Level Gaps

#### 3.2.1 No Pagination Support

**All services fetch full result sets:**

```typescript
// taskService.getTasks
const { data } = await db.from("tasks").select("*").eq("user_id", userId);
return data as Task[]; // No limit/offset
```

**Recommendation:** Add optional limit/offset parameters to all list methods.

---

#### 3.2.2 No Batch Operations

**Issue:** No support for bulk updates/deletes.

```typescript
// Current: Delete one at a time
for (const taskId of taskIds) {
  await taskService.deleteTask(userId, taskId);
}
// N queries instead of 1

// Expected: Batch delete
await taskService.deleteTasks(userId, taskIds);
// 1 query
```

**Recommendation:** Add batch operations for performance.

---

#### 3.2.3 Incomplete Error Messages

**Example:**

```typescript
// ✗ Generic message
if (error) throw new AppError(error.message);

// ✓ Specific message
if (error.code === "PGRST116") throw new Error("Task not found");
if (error.code === "23505") throw new Error("Duplicate label name");
```

**Recommendation:** Map database error codes to human-friendly messages.

---

### 3.3 API Route Gaps

#### 3.3.1 Missing DELETE Endpoints

| Resource | GET | POST | PATCH | DELETE | Issue |
|----------|-----|------|-------|--------|-------|
| Tasks | ✓ | ✓ | ✓ | ✓ | Complete |
| Goals | ✓ | ✓ | ⚠️ No validation | ✓ | Validation gap |
| Projects | N/A | Server action | N/A | Server action | Inconsistent |
| Spaces | ✓ | ✓ | ✓ | ✗ Missing | No DELETE route |
| Labels | ✓ | ✓ | N/A | ✓ | N/A |

**Spaces Issue:**
```typescript
// No DELETE /spaces/[id] endpoint
// But DELETE logic exists in service
await spaceService.archiveSpace(userId, spaceId);
// Only archival, not true delete
```

**Recommendation:** Add DELETE endpoints for spaces (or clarify that soft-delete via archive is the standard).

---

#### 3.3.2 No Batch Endpoints

**Issue:** No bulk operations supported.

```
❌ DELETE /api/tasks?ids=task1,task2,task3
❌ PATCH /api/tasks/bulk { operations: [...] }
```

**Recommendation:** Add batch endpoints for bulk operations.

---

## 4. Documentation & Clarity Gaps

### 4.1 Implicit Service Dependencies

**taskService dynamically imports recurrenceService:**

```typescript
import { recurrenceService } from "./recurrenceService"; // ← Dynamic
```

**Issue:**
- Not obvious from static analysis
- No typescript error if recurrenceService removed
- Circular dependency risk

**Recommendation:** Document or make explicit in service interface.

---

### 4.2 Side Effect Documentation

**Side effects are scattered and not documented:**

```typescript
// In taskService.updateTask
if (updates.status === "done" && task.recurrence_rule) {
  // ← Side effect: Creates next recurring task instance
  // NOT documented in service interface
}
```

**Recommendation:** Document side effects in service method JSDoc comments.

---

### 4.3 RLS Policy Inconsistency

**RLS policies use different patterns:**

```sql
-- Pattern 1: Email comparison
USING (user_id = (SELECT email FROM auth.users WHERE id = auth.uid()))

-- Pattern 2: JWT claim
USING (auth.uid()::text = user_id)

-- Pattern 3: Complex subquery
USING (EXISTS (SELECT 1 FROM tasks WHERE id = task_id AND user_id = current_setting(...)))
```

**Issue:** Inconsistency makes policies hard to audit.

**Recommendation:** Standardize to single pattern (probably Pattern 1: email comparison).

---

## 5. Summary: Critical vs. Nice-to-Have

### 🔴 Critical Issues (Security/Correctness)

1. **No validation on PATCH /goals/[id]** ← Arbitrary field updates
2. **Spaces API bypasses service layer** ← Inconsistent authorization
3. **Rate limiter broken on serverless** ← Easy DoS in production
4. **No error handling in some routes** ← Unhandled promise rejections
5. **focus_sessions lacks RLS** ← Potential cross-user data access

### 🟠 High Priority (Architecture)

1. **Inconsistent mutation patterns** (server actions vs. API routes)
2. **No pagination support** ← Performance/scalability issue
3. **Mixed validation approaches** (Zod, manual, none)
4. **Missing batch operations** ← Client needs many requests

### 🟡 Medium Priority (Infrastructure)

1. **No structured logging**
2. **No transaction support** for multi-step operations
3. **No request tracing**
4. **Cascading delete audit trail**

### 🟢 Low Priority (Polish)

1. **Email as user_id design** ← Long-term migration
2. **Missing indexes** ← Optimize later
3. **Service error messages** ← Better error UX

---

## Recommendations for Next Phase

**Immediate (Week 1):**
- Add Zod validation to PATCH /goals/[id]
- Migrate spaces GET/PATCH to spaceService
- Wrap all service calls in try-catch error handling

**Short-term (Week 2-3):**
- Implement pagination for list endpoints
- Standardize mutation pattern (API routes for all)
- Add structured logging middleware

**Medium-term (Month 2):**
- Implement Redis-backed rate limiting
- Add transaction support for bulk operations
- Document and consolidate RLS policies

**Long-term (Q2-Q3):**
- Migrate user_id from email to UUID
- Add audit logging for compliance
- Performance optimization (indexes, caching)

