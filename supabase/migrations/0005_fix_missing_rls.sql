-- Enable RLS for existing tables
alter table spaces enable row level security;
alter table goals enable row level security;
alter table tasks enable row level security;
alter table focus_sessions enable row level security;

-- Helper function to get the current user's email from auth.users (matches 0004 pattern)
-- Using the subquery directly in policies for consistency with 0004.

-- Policies for SPACES
create policy "Users can view their own spaces"
  on spaces for select
  using ( user_id = (select email from auth.users where id = auth.uid()) );

create policy "Users can insert their own spaces"
  on spaces for insert
  with check ( user_id = (select email from auth.users where id = auth.uid()) );

create policy "Users can update their own spaces"
  on spaces for update
  using ( user_id = (select email from auth.users where id = auth.uid()) );

create policy "Users can delete their own spaces"
  on spaces for delete
  using ( user_id = (select email from auth.users where id = auth.uid()) );

-- Policies for GOALS
create policy "Users can view their own goals"
  on goals for select
  using ( user_id = (select email from auth.users where id = auth.uid()) );

create policy "Users can insert their own goals"
  on goals for insert
  with check ( user_id = (select email from auth.users where id = auth.uid()) );

create policy "Users can update their own goals"
  on goals for update
  using ( user_id = (select email from auth.users where id = auth.uid()) );

create policy "Users can delete their own goals"
  on goals for delete
  using ( user_id = (select email from auth.users where id = auth.uid()) );

-- Policies for TASKS
create policy "Users can view their own tasks"
  on tasks for select
  using ( user_id = (select email from auth.users where id = auth.uid()) );

create policy "Users can insert their own tasks"
  on tasks for insert
  with check ( user_id = (select email from auth.users where id = auth.uid()) );

create policy "Users can update their own tasks"
  on tasks for update
  using ( user_id = (select email from auth.users where id = auth.uid()) );

create policy "Users can delete their own tasks"
  on tasks for delete
  using ( user_id = (select email from auth.users where id = auth.uid()) );

-- Policies for FOCUS_SESSIONS
create policy "Users can view their own focus_sessions"
  on focus_sessions for select
  using ( user_id = (select email from auth.users where id = auth.uid()) );

create policy "Users can insert their own focus_sessions"
  on focus_sessions for insert
  with check ( user_id = (select email from auth.users where id = auth.uid()) );

create policy "Users can update their own focus_sessions"
  on focus_sessions for update
  using ( user_id = (select email from auth.users where id = auth.uid()) );

create policy "Users can delete their own focus_sessions"
  on focus_sessions for delete
  using ( user_id = (select email from auth.users where id = auth.uid()) );
