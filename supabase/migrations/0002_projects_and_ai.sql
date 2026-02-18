-- Create Projects table
create table projects (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  space_id uuid references spaces(id) on delete cascade not null,
  title text not null,
  description text,
  status text default 'active', -- 'active', 'completed', 'on_hold'
  due_date date,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add indexes for projects
create index projects_user_id_idx on projects(user_id);
create index projects_space_id_idx on projects(space_id);

-- Enable RLS for projects
alter table projects enable row level security;

create policy "Users can view their own projects"
  on projects for select
  using (auth.uid()::text = user_id);

create policy "Users can insert their own projects"
  on projects for insert
  with check (auth.uid()::text = user_id);

create policy "Users can update their own projects"
  on projects for update
  using (auth.uid()::text = user_id);

create policy "Users can delete their own projects"
  on projects for delete
  using (auth.uid()::text = user_id);


-- Update Tasks table to link to Projects
alter table tasks 
add column project_id uuid references projects(id) on delete set null;

create index tasks_project_id_idx on tasks(project_id);
