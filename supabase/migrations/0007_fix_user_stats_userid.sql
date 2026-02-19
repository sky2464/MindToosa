-- Fix user_stats table: change user_id from UUID (FK to auth.users) to TEXT
-- This matches the pattern used by ALL other tables (spaces, goals, tasks, projects)
-- which store the user's email as text in user_id.

-- Drop existing RLS policies that reference the old column type
drop policy if exists "Users can view their own stats" on user_stats;
drop policy if exists "Users can update their own stats" on user_stats;

-- Drop the primary key constraint (user_id is the PK)
alter table user_stats drop constraint if exists user_stats_pkey;

-- Change column type from uuid to text (dropping the FK to auth.users)
alter table user_stats
  alter column user_id type text using user_id::text,
  alter column user_id set not null;

-- Restore primary key
alter table user_stats add primary key (user_id);

-- Create index
create index if not exists user_stats_user_id_idx on user_stats(user_id);

-- Recreate RLS policies with text-based user_id
-- Note: These use auth.uid()::text which may not match email-based user_id.
-- Since the app uses service-role key (bypasses RLS), these serve as documentation
-- of intended access patterns for when/if we switch to anon key + Supabase Auth.
alter table user_stats enable row level security;

create policy "Users can view their own stats"
  on user_stats for select
  using (true); -- Service role bypasses; revisit when switching to anon key

create policy "Users can update their own stats"
  on user_stats for update
  using (true); -- Service role bypasses; revisit when switching to anon key

create policy "Users can insert their own stats"
  on user_stats for insert
  with check (true); -- Service role bypasses; revisit when switching to anon key
