-- Migration 0008: Add subtasks, labels, and comments
-- Adds parent_task_id to tasks for subtask hierarchy
-- Creates task_labels, task_label_assignments, and task_comments tables

-- 1. Add parent_task_id to tasks for subtask hierarchy
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE;

-- 2. Task labels
CREATE TABLE IF NOT EXISTS task_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Junction table for task <-> label (many-to-many)
CREATE TABLE IF NOT EXISTS task_label_assignments (
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  label_id UUID REFERENCES task_labels(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, label_id)
);

-- 4. Task comments
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_label_assignments_task ON task_label_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_labels_user ON task_labels(user_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user ON task_comments(user_id);

-- 6. RLS policies
ALTER TABLE task_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_label_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- task_labels: user owns their labels
CREATE POLICY "task_labels_select" ON task_labels FOR SELECT
  USING (user_id = current_setting('request.jwt.claim.email', true));
CREATE POLICY "task_labels_insert" ON task_labels FOR INSERT
  WITH CHECK (user_id = current_setting('request.jwt.claim.email', true));
CREATE POLICY "task_labels_update" ON task_labels FOR UPDATE
  USING (user_id = current_setting('request.jwt.claim.email', true));
CREATE POLICY "task_labels_delete" ON task_labels FOR DELETE
  USING (user_id = current_setting('request.jwt.claim.email', true));

-- task_label_assignments: user can manage their own task's labels
CREATE POLICY "task_label_assignments_select" ON task_label_assignments FOR SELECT
  USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_id AND tasks.user_id = current_setting('request.jwt.claim.email', true)));
CREATE POLICY "task_label_assignments_insert" ON task_label_assignments FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_id AND tasks.user_id = current_setting('request.jwt.claim.email', true)));
CREATE POLICY "task_label_assignments_delete" ON task_label_assignments FOR DELETE
  USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_id AND tasks.user_id = current_setting('request.jwt.claim.email', true)));

-- task_comments: user owns their comments
CREATE POLICY "task_comments_select" ON task_comments FOR SELECT
  USING (user_id = current_setting('request.jwt.claim.email', true));
CREATE POLICY "task_comments_insert" ON task_comments FOR INSERT
  WITH CHECK (user_id = current_setting('request.jwt.claim.email', true));
CREATE POLICY "task_comments_delete" ON task_comments FOR DELETE
  USING (user_id = current_setting('request.jwt.claim.email', true));
