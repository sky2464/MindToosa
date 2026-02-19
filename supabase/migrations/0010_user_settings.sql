-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  user_id TEXT PRIMARY KEY, -- Using TEXT to match existing schema (email), but distinct from auth.users for now
  theme TEXT DEFAULT 'system', -- 'light', 'dark', 'system'
  working_hours_start TIME DEFAULT '09:00',
  working_hours_end TIME DEFAULT '17:00',
  notifications_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own settings"
  ON user_settings FOR SELECT
  USING (user_id = current_setting('request.jwt.claim.email', true));

CREATE POLICY "Users can update their own settings"
  ON user_settings FOR UPDATE
  USING (user_id = current_setting('request.jwt.claim.email', true));

CREATE POLICY "Users can insert their own settings"
  ON user_settings FOR INSERT
  WITH CHECK (user_id = current_setting('request.jwt.claim.email', true));
