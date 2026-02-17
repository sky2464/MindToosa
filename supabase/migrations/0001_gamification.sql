-- Create table for user gamification stats
create table if not exists user_stats (
  user_id uuid references auth.users(id) primary key,
  xp integer default 0 not null,
  level integer default 1 not null,
  current_streak integer default 0 not null,
  longest_streak integer default 0 not null,
  last_activity_date date,
  created_at timestamptz default now()
);

-- RLS policies
alter table user_stats enable row level security;

create policy "Users can view their own stats"
  on user_stats for select
  using (auth.uid() = user_id);

create policy "Users can update their own stats" -- In a real app, this might be server-only, but for now we allow it securely via API
  on user_stats for update
  using (auth.uid() = user_id);

-- Function to handle level calculation (optional, but good for DB logic)
-- For MVP we can handle logic in application layer, but let's keep it simple here.
