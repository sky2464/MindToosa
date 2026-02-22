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

## 6. Proxy (historically `middleware.ts`) (Formerly Middleware)

> [!WARNING]
> **Middleware Renamed to Proxy**: As of Next.js 16, `proxy.ts` has been renamed to `proxy.ts`. The term "middleware" was confusing (often mistaken for Express middleware), and "proxy" better describes its purpose: running code at the network boundary before requests reach your app.

### When to Use Proxy

- **Use as Last Resort**: Only use proxy when no other Next.js API can solve your problem.
- **Common Use Cases**: Authentication checks, redirects, rewrites, setting headers, CORS handling.
- **Avoid**: Business logic, data fetching, complex computations (use Server Actions or Route Handlers instead).

### Migration from Middleware

If you have an existing `proxy.ts` file, migrate using the official codemod:

```bash
npx @next/codemod@canary middleware-to-proxy .
```

This will:

- Rename `proxy.ts` → `proxy.ts`
- Rename `export function proxy()` → `export function proxy()`

### Basic Proxy Structure

```typescript
// src/proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  // Your logic here
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Exclude API routes, static files, images
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
```

### Using with NextAuth

For authentication, wrap the `auth()` function from NextAuth:

```typescript
// src/proxy.ts
import { auth } from "@/auth";

export default auth((req) => {
  // Custom logic here (e.g., role-based redirects)
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

### Best Practices

1. **Precise Matchers**: Use specific path matchers to avoid running proxy on every request.
2. **Keep It Light**: Proxy runs on every matched request - keep logic minimal.
3. **Edge Runtime**: Proxy defaults to Edge Runtime (fast, but limited Node.js APIs).
4. **Prefer Alternatives**: Use Server Actions, Route Handlers, or `headers()`/`cookies()` when possible.
