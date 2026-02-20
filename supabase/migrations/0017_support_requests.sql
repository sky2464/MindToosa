-- Migration: 0017_support_requests.sql
-- Stores user support requests submitted via /api/support.
-- Allows admins to see submitted tickets and track resolution status.

CREATE TABLE IF NOT EXISTS support_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT NOT NULL,
  email        TEXT NOT NULL,
  subject      TEXT NOT NULL,
  message      TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for admin lookups by status
CREATE INDEX IF NOT EXISTS support_requests_status_idx ON support_requests(status, created_at DESC);
-- Index for user looking up their own tickets
CREATE INDEX IF NOT EXISTS support_requests_user_idx ON support_requests(user_id, created_at DESC);
