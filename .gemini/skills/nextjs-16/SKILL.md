---
name: Next.js 16 Development
description: Best practices for developing with Next.js 16 App Router, Server Actions, and Turbopack
---

# Next.js 16 Development Guide

## 1. Core Principles

- **App Router**: Use the `app/` directory for all routes.
- **Server Components by Default**: All components are Server Components unless marked with `'use client'`.
- **Async Params**: In Next.js 15+, `params` and `searchParams` in pages/layouts/routes are PROMISES and MUST be awaited.

  ```typescript
  // CORRECT
  export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <div>Project {id}</div>;
  }

  // INCORRECT
  export default function Page({ params }: { params: { id: string } }) {
    return <div>Project {params.id}</div>; // Error!
  }
  ```

## 2. Server Actions

- **Use Instead of API Routes**: Prefer Server Actions for mutations (form submissions, button clicks) to keep logic co-located.
- **Validation**: Always validate input with Zod inside the action.
- **Security**: Check authentication at the start of every action.

  ```typescript
  "use server";

  import { auth } from "@/auth";
  import { z } from "zod";

  const schema = z.object({ title: z.string().min(1) });

  export async function createItem(formData: FormData) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const data = schema.parse({ title: formData.get("title") });
    // ... logic ...
  }
  ```

## 3. Data Fetching

- **Direct Fetching**: Fetch data directly in async Server Components.
- **No `useEffect`**: Do not use `useEffect` for initial data load.
- **Caching**: Next.js 15+ fetch requests are no longer cached by default. Use `unstable_cache` or `force-cache` if needed.

## 4. Turbopack

- **Development**: Run `next dev --turbo` (or just `next dev` if configured) for instant HMR.
- **Optimization**: Turbopack handles bundling. Ensure no legacy Webpack configuration conflicts.

## 5. Metadata

- **Static**: Export a `metadata` object.
- **Dynamic**: Export a `generateMetadata` function (handled as async).
  ```typescript
  export async function generateMetadata({ params }: Props) {
    const { id } = await params;
    return { title: `Project ${id}` };
  }
  ```
