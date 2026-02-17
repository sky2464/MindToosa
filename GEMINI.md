# 🏛️ MindToosa Development Standards & Context

This document serves as the primary context source for AI agents working on the MindToosa codebase. It combines universal development principles with specific project constraints and technology choices.

## 1. 🛠️ Technology Stack (Updated Feb 2026)

- **Framework**: Next.js 16.1.6 (App Router)
- **Language**: TypeScript 5.9.3 (`StrictMode` enabled)
- **Styling**: Tailwind CSS 4.0.0
- **Database & Auth**: Supabase (PostgreSQL), NextAuth.js (v5 Beta)
- **AI Integration**: Google GenAI SDK (`@google/genai` v1.41.0)
- **Validation**: Zod (v4.3.6)
- **Icons**: Lucide React (v0.574.0)
- **Environment**: ESM (eslint 10.x, postcss 8.4.45)
- **Package Manager**: NPM

## 2. 📂 Project Structure

```
/
├── src/
│   ├── app/            # Next.js App Router pages and layouts
│   ├── components/     # Reusable React components
│   ├── lib/            # Shared utilities, constants, and helper functions
│   ├── server/         # Server-side logic (Server Actions, DTOs)
│   └── auth.ts         # NextAuth configuration
├── supabase/           # Supabase migrations and configuration
├── public/             # Static assets
└── .env.local          # Environment variables (do not commit secrets!)
```

## 3. 📐 Code Organization & Architecture

### Domain-Driven Design (Lightweight)

- Organize code by **Feature/Domain** where possible within `src/app` or specific folders in `src/components` if they are highly specific.
- Shared UI components belong in `src/components/ui` (if using shadcn-like structure) or `src/components`.

### Next.js App Router Best Practices

- **Server Components by Default**: Use Server Components for data fetching and heavy lifting. Add `'use client'` only when interactivity (state, effects, event listeners) is strictly needed.
- **Server Actions**: Use Server Actions for mutations and form submissions instead of API routes where appropriate to keep logic co-located.
- **Data Fetching**: Fetch data directly in Server Components using `await`. Use `Suspense` for loading states.

### Supabase & Auth

- **Client/Server separation**: Use specifically typed clients for browser vs. server contexts (`createClient` from `@supabase/ssr`).
- **Row Level Security (RLS)**: ALWAYS enable RLS on database tables. Never rely solely on application logic for security.

## 4. 🧱 Coding Standards

### TypeScript

- **No `any`**: Explicitly define types. Use `unknown` if strictly necessary and narrow it down.
- **Zod for Validation**: Use Zod schemas to validate all external inputs (API requests, form data, env vars).
- **Interfaces over Types**: Prefer `interface` for object definitions (better error messages/extensibility).

### Tailwind CSS

- **Utility-First**: Use utility classes for styling.
- **Consistency**: Use the defined design tokens (colors, spacing) in `globals.css` / Tailwind config rather than arbitrary values (e.g., `bg-primary` instead of `bg-[#123456]`).
- **Mobile-First**: Style for mobile first, then add breakpoints (e.g., `md:flex`).

### Custom Utilities (Zero Dependency)

- **Prefer Direct TypeScript**: For small utilities (e.g., class merging, sound effects, animations), prefer custom TypeScript implementations over external packages to maintain a lean dependency tree and ensure long-term stability.
- **Current Implementations**:
  - `src/lib/utils.ts`: Custom `clsx` implementation.
  - `src/hooks/useSoundEffects.ts`: Custom `useAudio` hook using native Browser API.
  - `src/lib/confetti.ts`: Custom Canvas-based confetti implementation (replaces `canvas-confetti`).

## 5. 📦 Supply Chain Security & Build Integrity (SLSA)

We enforce three gates for build integrity to ensure a secure and reproducible supply chain:

1.  **Deterministic Resolution**: `package-lock.json` is the sole source of truth. It must be committed and never bypassed.
2.  **Frozen Installs**: CI environments must use `npm ci` to ensure installs are reproducible and fail if the lockfile is out of sync.
3.  **Vulnerability Gate**: Automated vulnerability scanning (e.g., `npm audit`, `OSV-Scanner`) is mandatory. High/critical vulnerabilities block releases.

### 🛡️ Dependency Guardrails (Strict Enforcement)

To maintain a secure and state-of-the-art codebase, the following rules are **MANDATORY**:

- **Zero Outdated Packages**: All direct dependencies MUST be kept at their latest stable version.
- **No Downgrades**: Downgrading a package to fix a temporary conflict is FORBIDDEN. Instead, resolve the environmental issue (e.g., using `--legacy-peer-deps`) or use `overrides` to patch sub-dependencies.
- **Custom Logic over Bloat**: Before adding any new utility dependency (e.g., string manipulation, small hooks, or UI helpers), check if it can be implemented in < 50 lines of TypeScript. If so, implement it internally.
- **Pre-Flight Check**: Any agent or developer modifying `package.json` MUST run `npm audit` and verify with a web search that they are using the absolute latest stable versions of all added/updated packages.

## 6. 🔒 Security & Performance

- **Environment Variables**: Access private env vars ONLY on the server. Prefix public vars with `NEXT_PUBLIC_`.
- **Images**: Use `next/image` for all images to leverage automatic optimization.
- **Secrets**: NEVER commit `.env` files or secrets to Git.

## 7. 🧪 Workflow

- **Dependency Management**: Treat dependency changes as code changes. Use `npm ci` for clean environments.
- **Linting**: Ensure `npm run lint` passes before committing.
- **Type Checking**: Ensure no TypeScript errors exist.
