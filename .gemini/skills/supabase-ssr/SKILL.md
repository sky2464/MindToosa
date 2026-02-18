---
name: Supabase SSR Development
description: Guide for integrating Supabase with Next.js App Router using @supabase/ssr
---

# Supabase SSR Development Guide

## 1. Client Architecture

- **`@supabase/ssr`**: Use this package, NOT just `@supabase/supabase-js`, for Next.js integration.
- **Browser Client**: Singleton pattern for client components.
- **Server Client**: Created per-request for Server Components/Actions.

## 2. Server Client Pattern

- **Cookie Handling**: You MUST pass cookie methods (getAll, setAll) to `createServerClient`.

  ```typescript
  import { createServerClient } from "@supabase/ssr";
  import { cookies } from "next/headers";

  export async function createClient() {
    const cookieStore = await cookies();

    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            // Only valid in Server Actions / Route Handlers
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );
  }
  ```

## 3. Row Level Security (RLS)

- **Mandatory**: ALL tables must have RLS enabled.
- **Policies**: Use `auth.uid()` to scope data access.
  ```sql
  create policy "User can see their own data"
  on public.todos
  for select
  using (auth.uid() = user_id); /* Assuming user_id is type text/uuid matching auth.uid() */
  ```
- **Service Key**: Use `supabase-js` with `SUPABASE_SERVICE_ROLE_KEY` ONLY for admin tasks or background jobs where user context is missing.

## 4. Auth & User Context

- **`getUser` vs `getSession`**: Prefer `getUser()` for security on the server side as it re-validates the token with Supabase Auth. `getSession()` can be spoofed if the token is stale but not expired locally.
