-- Migration 0009: Add recurring tasks support
-- Adds recurrence_rule and parent_recurring_task_id to tasks table

-- 1. Add columns
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_rule TEXT; -- RFC 5545 string, e.g., "FREQ=DTSTART;INTERVAL=1"
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_recurring_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL;

-- 2. Index for finding all instances of a recurring task
CREATE INDEX IF NOT EXISTS idx_tasks_parent_recurring ON tasks(parent_recurring_task_id);
