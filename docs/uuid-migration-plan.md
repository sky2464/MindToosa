# UUID User ID Migration Plan

## Context

All tables use `user_id TEXT` = `session.user.email`.
This plan migrates to `user_id UUID` for proper foreign key integrity, join performance,
and to decouple identity from email (email can change, UUID cannot).

## ⚠️ WARNING

**DO NOT run this automatically.**
This is a multi-phase migration requiring coordinated app + DB deploys.
Execute manually with Supabase's `supabase db push` after reviewing each phase.

---

## Phase 1 — Backfill UUID mapping

```sql
-- Run in Supabase SQL editor
CREATE TABLE IF NOT EXISTS user_id_map (
  email TEXT PRIMARY KEY,
  uuid  UUID NOT NULL DEFAULT gen_random_uuid()
);

-- Populate from all tables that use user_id
INSERT INTO user_id_map (email)
SELECT DISTINCT user_id FROM tasks         WHERE user_id NOT LIKE '%-%-%'
UNION
SELECT DISTINCT user_id FROM goals         WHERE user_id NOT LIKE '%-%-%'
UNION
SELECT DISTINCT user_id FROM projects      WHERE user_id NOT LIKE '%-%-%'
UNION
SELECT DISTINCT user_id FROM spaces        WHERE user_id NOT LIKE '%-%-%'
UNION
SELECT DISTINCT user_id FROM notifications WHERE user_id NOT LIKE '%-%-%'
ON CONFLICT (email) DO NOTHING;
```

## Phase 2 — Add UUID columns (non-destructive)

```sql
ALTER TABLE tasks         ADD COLUMN IF NOT EXISTS user_uuid UUID;
ALTER TABLE goals         ADD COLUMN IF NOT EXISTS user_uuid UUID;
ALTER TABLE projects      ADD COLUMN IF NOT EXISTS user_uuid UUID;
ALTER TABLE spaces        ADD COLUMN IF NOT EXISTS user_uuid UUID;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_uuid UUID;
ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS user_uuid UUID;
ALTER TABLE user_stats    ADD COLUMN IF NOT EXISTS user_uuid UUID;

-- Backfill
UPDATE tasks t         SET user_uuid = m.uuid FROM user_id_map m WHERE t.user_id = m.email;
UPDATE goals g         SET user_uuid = m.uuid FROM user_id_map m WHERE g.user_id = m.email;
UPDATE projects p      SET user_uuid = m.uuid FROM user_id_map m WHERE p.user_id = m.email;
UPDATE spaces s        SET user_uuid = m.uuid FROM user_id_map m WHERE s.user_id = m.email;
UPDATE notifications n SET user_uuid = m.uuid FROM user_id_map m WHERE n.user_id = m.email;
```

## Phase 3 — App code update

1. Update `src/auth.ts`: `session.user.id` returns UUID (from `user_id_map` lookup).
2. Update all service files to accept `userId: string` (UUID string, same type).
3. Update all `.eq("user_id", userId)` calls — no type change needed.
4. Deploy app.

## Phase 4 — Swap columns (maintenance window)

```sql
-- After all writes use UUIDs
ALTER TABLE tasks         RENAME COLUMN user_id TO user_email;
ALTER TABLE tasks         RENAME COLUMN user_uuid TO user_id;
-- Repeat for all tables
-- Add NOT NULL constraint
ALTER TABLE tasks ALTER COLUMN user_id SET NOT NULL;
-- Add FK to auth.users if using Supabase Auth
```

## Phase 5 — Drop legacy columns

```sql
ALTER TABLE tasks         DROP COLUMN user_email;
-- Repeat for all tables
DROP TABLE user_id_map;
```

## Rollback

Each phase is independently reversible.  
Phase 1-2: drop `user_id_map` and `user_uuid` columns.  
Phase 3: revert app code.  
Phase 4+: requires data migration back — plan carefully.
