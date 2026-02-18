-- Change user_id from UUID to TEXT to match NextAuth email identifier
ALTER TABLE user_stats 
  DROP CONSTRAINT user_stats_user_id_fkey,
  ALTER COLUMN user_id TYPE text;

-- We can't reference auth.users(id) anymore if we use email, 
-- unless we join on email, but for simple stats TEXT is fine.
-- If we wanted to keep referential integrity we would need to look up the UUID from email,
-- but since we are using Google Auth emails as IDs in other tables (projects),
-- consistency suggests using TEXT email here too.
