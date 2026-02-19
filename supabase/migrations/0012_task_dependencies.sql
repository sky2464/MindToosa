CREATE TABLE IF NOT EXISTS task_dependencies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  blocking_task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT unique_dependency UNIQUE (task_id, blocking_task_id),
  CONSTRAINT no_self_dependency CHECK (task_id != blocking_task_id)
);

-- Enable RLS
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view dependencies for their tasks"
  ON task_dependencies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks WHERE id = task_dependencies.task_id AND user_id = current_setting('request.jwt.claim.email', true)
    )
  );

CREATE POLICY "Users can create dependencies for their tasks"
  ON task_dependencies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks WHERE id = task_dependencies.task_id AND user_id = current_setting('request.jwt.claim.email', true)
    )
    AND
    EXISTS (
      SELECT 1 FROM tasks WHERE id = task_dependencies.blocking_task_id AND user_id = current_setting('request.jwt.claim.email', true)
    )
  );

CREATE POLICY "Users can delete dependencies for their tasks"
  ON task_dependencies FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM tasks WHERE id = task_dependencies.task_id AND user_id = current_setting('request.jwt.claim.email', true)
    )
  );
