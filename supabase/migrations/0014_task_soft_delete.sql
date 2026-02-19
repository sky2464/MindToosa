-- Add soft_deleted_at to tasks for non-destructive deletes.
-- When set, the task is hidden from normal queries and appears only in the Trash view.

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS soft_deleted_at TIMESTAMPTZ;

-- Index for efficient trash queries
CREATE INDEX IF NOT EXISTS idx_tasks_soft_deleted ON tasks (user_id, soft_deleted_at) WHERE soft_deleted_at IS NOT NULL;
