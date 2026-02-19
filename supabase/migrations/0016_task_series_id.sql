-- Migration: 0016_task_series_id.sql
-- Adds series_id to link all recurring instances of the same task series.
-- When a recurring task is first created with a recurrence_rule, series_id = id.
-- All spawned instances share the same series_id, enabling grouping in the week view.

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES tasks(id) ON DELETE SET NULL;

-- Backfill existing recurring tasks: root recurring tasks (no parent) get series_id = id
UPDATE tasks
SET series_id = id
WHERE recurrence_rule IS NOT NULL
  AND parent_recurring_task_id IS NULL
  AND series_id IS NULL;
