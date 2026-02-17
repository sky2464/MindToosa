---
name: database_migration
description: Create and apply a new database migration using Supabase CLI.
---

# Database Migration Skill

Use this skill whenever you need to modify the database schema (Tables, RLS policies, Functions).
**NEVER** modify the database directly via the SQL Editor in production. Always use migrations.

## Steps

1.  **Generate Migration File**
    - Run: `supabase migration new [migration_name]`
    - Example: `supabase migration new add_profiles_table`
    - This creates a file in `/supabase/migrations/<timestamp>_add_profiles_table.sql`.

2.  **Write SQL**
    - Edit the generated file.
    - **RLS Mandatory:** Always include `alter table X enable row level security;` and strict policies.
    - **Idempotency:** Use `create table if not exists`, `do $$ begin ... end $$;` blocks for robust migrations.

3.  **Apply Migration (Local)**
    - Run: `supabase db reset` (to fully reset local DB) OR `supabase migration up` (to apply pending migrations).
    - **Tip:** If working on a new feature, `supabase db reset` ensures a clean state mirroring production migration history.

4.  **Update Types**
    - Run: `supabase gen types typescript --local > src/types/supabase.ts` (or wherever types are stored, typically `src/types/database.types.ts` or `src/lib/database.types.ts`).
    - _Check `package.json` for a `gen-types` script if available._

## Example SQL (RLS)

```sql
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  username text unique,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
on public.profiles for select
using ( auth.uid() = id );
```
