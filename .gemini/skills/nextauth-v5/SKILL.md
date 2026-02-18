---
name: NextAuth v5 Development
description: Guide for using NextAuth.js v5 (Beta) with Next.js App Router
---

# NextAuth v5 Development Guide

## 1. Architecture Changes

- **Universal `auth()` Helper**: Replaces `getServerSession`. Works in Server Components, Server Actions, and API Routes.
  ```typescript
  import { auth } from "@/auth";
  const session = await auth();
  ```
- **Configuration**: Kept in `src/auth.ts` (or root).
- **Route Handler**: Found in `app/api/auth/[...nextauth]/route.ts`, exporting `GET` and `POST` from `handlers`.

## 2. Configuration (`auth.ts`)

- **Strict Exports**: Must export `handlers`, `auth`, `signIn`, `signOut`.

  ```typescript
  import NextAuth from "next-auth"

  export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [ ... ],
    callbacks: { ... },
  })
  ```

## 3. Edge Compatibility

- v5 is designed for Edge runtimes. Ensure your database adapter (if used) is Edge-compatible or split auth logic into edge-safe (middleware) and node-dependent parts.

## 4. Middleware

- **`auth` Wrapper**: Middleware is simpler.
  ```typescript
  export { auth as middleware } from "@/auth";
  ```
- **Matchers**: Configure strict matchers to avoid running auth logic on static assets.

## 5. Types

- **Module Augmentation**: To add custom properties (like `id`) to `session.user`, you must augment the `next-auth` module types.
  ```typescript
  declare module "next-auth" {
    interface Session {
      user: {
        id: string;
        // ... other properties
      } & DefaultSession["user"];
    }
  }
  ```
