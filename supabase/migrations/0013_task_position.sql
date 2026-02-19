-- Add position field to tasks for explicit ordering within a status group.
-- Initial positions are assigned based on creation order (oldest = 0, next = 1000, etc.)
-- so that existing tasks have a defined sort order immediately after migration.

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0;

-- Assign initial positions per user, ordered by created_at ascending
WITH ranked AS (
    SELECT
        id,
        (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC) - 1) * 1000 AS initial_position
    FROM tasks
)
UPDATE tasks
SET position = ranked.initial_position
FROM ranked
WHERE tasks.id = ranked.id;

-- Index to speed up ordered queries within a user's task list
CREATE INDEX IF NOT EXISTS idx_tasks_user_position ON tasks (user_id, position);
