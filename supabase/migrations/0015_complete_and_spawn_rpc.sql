-- Migration: 0015_complete_and_spawn_rpc.sql
-- Creates an atomic RPC for completing a recurring task and spawning the next occurrence.
-- This prevents the race condition where task completion succeeds but the new spawn fails,
-- or vice versa.

CREATE OR REPLACE FUNCTION complete_and_spawn(
  p_task_id     UUID,
  p_user_id     TEXT,
  p_next_title  TEXT,
  p_next_date   TEXT,
  p_space_id    UUID,
  p_project_id  UUID,
  p_goal_id     UUID,
  p_priority    TEXT,
  p_estimated_minutes INTEGER,
  p_micro_steps JSONB,
  p_recurrence_rule TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_id  UUID;
  v_series  UUID;
BEGIN
  -- Mark the original task as done
  UPDATE tasks
  SET status = 'done', updated_at = NOW()
  WHERE id = p_task_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task % not found or not owned by user', p_task_id;
  END IF;

  -- Resolve series_id: inherit from parent, or use parent's own id as series root
  SELECT COALESCE(series_id, p_task_id) INTO v_series FROM tasks WHERE id = p_task_id;

  -- Spawn the next recurring instance
  INSERT INTO tasks (
    user_id, title, scheduled_for, space_id, project_id, goal_id,
    priority, estimated_minutes, micro_steps, recurrence_rule,
    parent_recurring_task_id, series_id, status, position
  )
  VALUES (
    p_user_id, p_next_title, p_next_date::DATE, p_space_id, p_project_id, p_goal_id,
    p_priority, p_estimated_minutes, p_micro_steps, p_recurrence_rule,
    p_task_id, v_series, 'todo', 0
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

-- Add parent_recurring_task_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'parent_recurring_task_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN parent_recurring_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL;
  END IF;
END;
$$;

