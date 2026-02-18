-- Standardize RLS policies across all tables to use consistent email lookup pattern
-- This migration ensures all tables use the same authorization pattern for consistency and maintainability

-- Drop existing projects policies that use auth.uid()::text pattern
drop policy if exists "Users can view their own projects" on projects;
drop policy if exists "Users can insert their own projects" on projects;
drop policy if exists "Users can update their own projects" on projects;
drop policy if exists "Users can delete their own projects" on projects;

-- Create new policies using the standardized email lookup pattern
-- This matches the pattern used in migrations 0004 and 0005 for other tables
create policy "Users can view their own projects"
  on projects for select
  using ( user_id = (select email from auth.users where id = auth.uid()) );

create policy "Users can insert their own projects"
  on projects for insert
  with check ( user_id = (select email from auth.users where id = auth.uid()) );

create policy "Users can update their own projects"
  on projects for update
  using ( user_id = (select email from auth.users where id = auth.uid()) );

create policy "Users can delete their own projects"
  on projects for delete
  using ( user_id = (select email from auth.users where id = auth.uid()) );
