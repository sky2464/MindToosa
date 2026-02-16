-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Spaces
create table spaces (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  name text not null,
  created_at timestamp with time zone default now(),
  archived boolean default false
);

-- Goals
create table goals (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  space_id uuid references spaces(id) on delete cascade not null,
  title text not null,
  horizon text, -- 'week', 'month', 'year'
  why text,
  created_at timestamp with time zone default now(),
  archived boolean default false
);

-- Tasks
create table tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  space_id uuid references spaces(id) on delete cascade not null,
  goal_id uuid references goals(id) on delete set null,
  title text not null,
  priority text default 'normal', -- 'must_do', 'optional'
  estimated_minutes integer default 25,
  scheduled_for date, -- YYYY-MM-DD
  status text default 'todo',
  micro_steps jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now()
);

-- Focus Sessions
create table focus_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  task_id uuid references tasks(id) on delete set null,
  started_at timestamp with time zone default now(),
  duration_minutes integer not null,
  completed boolean default false
);

-- Indexes (optional but recommended)
create index spaces_user_id_idx on spaces(user_id);
create index goals_user_id_idx on goals(user_id);
create index tasks_user_id_idx on tasks(user_id);
create index focus_sessions_user_id_idx on focus_sessions(user_id);
