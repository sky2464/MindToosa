-- Migration 0019: Repair schema gap
-- Adds all columns and tables that exist in local migrations 0008-0018
-- but were never applied to the production database.
-- Uses IF NOT EXISTS throughout — safe to run on any existing schema.

-- ============================================================
-- 1. Missing columns on tasks
-- ============================================================
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_task_id          UUID        REFERENCES tasks(id) ON DELETE CASCADE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_rule         TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_recurring_task_id UUID       REFERENCES tasks(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS series_id               UUID        REFERENCES tasks(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS position                INTEGER     NOT NULL DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS soft_deleted_at         TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at              TIMESTAMPTZ DEFAULT NOW();

-- Spread initial positions so existing tasks have a defined sort order
WITH ranked AS (
    SELECT id,
           (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC) - 1) * 1000 AS p
    FROM tasks
)
UPDATE tasks SET position = ranked.p FROM ranked WHERE tasks.id = ranked.id;

-- ============================================================
-- 2. New tables
-- ============================================================

CREATE TABLE IF NOT EXISTS task_labels (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT        NOT NULL,
  name       TEXT        NOT NULL,
  color      TEXT        NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_label_assignments (
  task_id  UUID REFERENCES tasks(id)       ON DELETE CASCADE,
  label_id UUID REFERENCES task_labels(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, label_id)
);

CREATE TABLE IF NOT EXISTS task_comments (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    UUID        REFERENCES tasks(id) ON DELETE CASCADE,
  user_id    TEXT        NOT NULL,
  content    TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id                TEXT        PRIMARY KEY,
  theme                  TEXT        DEFAULT 'system',
  working_hours_start    TIME        DEFAULT '09:00',
  working_hours_end      TIME        DEFAULT '17:00',
  notifications_enabled  BOOLEAN     DEFAULT FALSE,
  timezone               TEXT,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT        NOT NULL,
  title      TEXT        NOT NULL,
  message    TEXT,
  type       TEXT        DEFAULT 'info',
  read       BOOLEAN     DEFAULT FALSE,
  link       TEXT,
  metadata   JSONB       DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_dependencies (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id          UUID        NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  blocking_task_id UUID        NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_dependency  UNIQUE (task_id, blocking_task_id),
  CONSTRAINT no_self_dependency CHECK (task_id != blocking_task_id)
);

CREATE TABLE IF NOT EXISTS support_requests (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT        NOT NULL,
  email      TEXT        NOT NULL,
  subject    TEXT        NOT NULL,
  message    TEXT        NOT NULL,
  status     TEXT        NOT NULL DEFAULT 'open'
               CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_tasks_parent              ON tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_recurring    ON tasks(parent_recurring_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_position       ON tasks(user_id, position);
CREATE INDEX IF NOT EXISTS idx_tasks_soft_deleted        ON tasks(user_id, soft_deleted_at) WHERE soft_deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_task_labels_user          ON task_labels(user_id);
CREATE INDEX IF NOT EXISTS idx_task_label_assignments_task ON task_label_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_task        ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user        ON task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE read = false;
CREATE INDEX IF NOT EXISTS support_requests_status_idx   ON support_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS support_requests_user_idx     ON support_requests(user_id, created_at DESC);

-- ============================================================
-- 4. RLS
-- ============================================================
ALTER TABLE task_labels            ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_label_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications          ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies      ENABLE ROW LEVEL SECURITY;

-- task_labels
CREATE POLICY "task_labels_select" ON task_labels FOR SELECT
  USING (user_id = current_setting('request.jwt.claim.email', true));
CREATE POLICY "task_labels_insert" ON task_labels FOR INSERT
  WITH CHECK (user_id = current_setting('request.jwt.claim.email', true));
CREATE POLICY "task_labels_update" ON task_labels FOR UPDATE
  USING (user_id = current_setting('request.jwt.claim.email', true));
CREATE POLICY "task_labels_delete" ON task_labels FOR DELETE
  USING (user_id = current_setting('request.jwt.claim.email', true));

-- task_label_assignments
CREATE POLICY "task_label_assignments_select" ON task_label_assignments FOR SELECT
  USING (EXISTS (SELECT 1 FROM tasks WHERE id = task_id AND user_id = current_setting('request.jwt.claim.email', true)));
CREATE POLICY "task_label_assignments_insert" ON task_label_assignments FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM tasks WHERE id = task_id AND user_id = current_setting('request.jwt.claim.email', true)));
CREATE POLICY "task_label_assignments_delete" ON task_label_assignments FOR DELETE
  USING (EXISTS (SELECT 1 FROM tasks WHERE id = task_id AND user_id = current_setting('request.jwt.claim.email', true)));

-- task_comments
CREATE POLICY "task_comments_select" ON task_comments FOR SELECT
  USING (user_id = current_setting('request.jwt.claim.email', true));
CREATE POLICY "task_comments_insert" ON task_comments FOR INSERT
  WITH CHECK (user_id = current_setting('request.jwt.claim.email', true));
CREATE POLICY "task_comments_delete" ON task_comments FOR DELETE
  USING (user_id = current_setting('request.jwt.claim.email', true));

-- user_settings
CREATE POLICY "user_settings_select" ON user_settings FOR SELECT
  USING (user_id = current_setting('request.jwt.claim.email', true));
CREATE POLICY "user_settings_insert" ON user_settings FOR INSERT
  WITH CHECK (user_id = current_setting('request.jwt.claim.email', true));
CREATE POLICY "user_settings_update" ON user_settings FOR UPDATE
  USING (user_id = current_setting('request.jwt.claim.email', true));

-- notifications
CREATE POLICY "notifications_select" ON notifications FOR SELECT
  USING (user_id = current_setting('request.jwt.claim.email', true));
CREATE POLICY "notifications_update" ON notifications FOR UPDATE
  USING (user_id = current_setting('request.jwt.claim.email', true));

-- task_dependencies
CREATE POLICY "task_dependencies_select" ON task_dependencies FOR SELECT
  USING (EXISTS (SELECT 1 FROM tasks WHERE id = task_id AND user_id = current_setting('request.jwt.claim.email', true)));
CREATE POLICY "task_dependencies_insert" ON task_dependencies FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM tasks WHERE id = task_id          AND user_id = current_setting('request.jwt.claim.email', true))
    AND
    EXISTS (SELECT 1 FROM tasks WHERE id = blocking_task_id AND user_id = current_setting('request.jwt.claim.email', true))
  );
CREATE POLICY "task_dependencies_delete" ON task_dependencies FOR DELETE
  USING (EXISTS (SELECT 1 FROM tasks WHERE id = task_id AND user_id = current_setting('request.jwt.claim.email', true)));

-- ============================================================
-- 5. complete_and_spawn RPC
-- ============================================================
CREATE OR REPLACE FUNCTION complete_and_spawn(
  p_task_id           UUID,
  p_user_id           TEXT,
  p_next_title        TEXT,
  p_next_date         TEXT,
  p_space_id          UUID,
  p_project_id        UUID,
  p_goal_id           UUID,
  p_priority          TEXT,
  p_estimated_minutes INTEGER,
  p_micro_steps       JSONB,
  p_recurrence_rule   TEXT
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_new_id UUID;
  v_series UUID;
BEGIN
  UPDATE tasks SET status = 'done', updated_at = NOW()
  WHERE id = p_task_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task % not found or not owned by user', p_task_id;
  END IF;

  SELECT COALESCE(series_id, p_task_id) INTO v_series FROM tasks WHERE id = p_task_id;

  INSERT INTO tasks (
    user_id, title, scheduled_for, space_id, project_id, goal_id,
    priority, estimated_minutes, micro_steps, recurrence_rule,
    parent_recurring_task_id, series_id, status, position
  ) VALUES (
    p_user_id, p_next_title, p_next_date::DATE, p_space_id, p_project_id, p_goal_id,
    p_priority, p_estimated_minutes, p_micro_steps, p_recurrence_rule,
    p_task_id, v_series, 'todo', 0
  ) RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;
