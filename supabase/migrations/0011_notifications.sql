CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id text NOT NULL,
  title text NOT NULL,
  message text,
  type text DEFAULT 'info', -- 'info', 'success', 'warning', 'error', 'reminder'
  read boolean DEFAULT false,
  link text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = current_setting('request.jwt.claim.email', true));

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = current_setting('request.jwt.claim.email', true));

-- Index for performance
CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE read = false;
