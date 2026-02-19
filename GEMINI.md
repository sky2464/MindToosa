# 🏛️ MindToosa Development Standards & Context

This document serves as the primary context source for AI agents working on the MindToosa codebase. It combines universal development principles with specific project constraints and technology choices.

## 1. 🛠️ Technology Stack (Updated Feb 2026)

- **Framework**: Next.js 16.1.6 (App Router)
- **Language**: TypeScript 5.9.3 (`StrictMode` enabled)
- **Styling**: Tailwind CSS 4.1.18
- **Database & Auth**: Supabase (PostgreSQL), NextAuth.js (v5 Beta 30)
- **AI Integration**: Google GenAI SDK (`@google/genai` v1.42.0)
- **Validation**: Zod (v4.3.6)
- **Icons**: Lucide React (v0.574.0)
- **Environment**: ESM (postcss 8.4.45)
- **Linting**: **REMOVED** - ESLint v10+ has unresolved vulnerabilities in transitive dependencies (`ajv` < 8.18.0, `@eslint-community/eslint-utils`). Removed per zero-tolerance policy until ecosystem resolves these issues. TypeScript's strict mode provides sufficient type checking.
- **Package Manager**: NPM (frozen lockfile recommended)

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

### React & Client Components

- **React 19+**: Code is optimized for React 19.
- **Hook Rules**:
  - **Avoid Synchronous setState in Effects**: To prevent cascading renders, avoid calling `setState` directly in the body of an effect. Use `Promise.resolve().then(() => setState(...))` for deferred updates or refactor to event handlers.
  - **Dependencies**: Always include all used variables in the dependency array. Wrap complex functions in `useCallback` to maintain stability.

## 4. 🧱 Coding Standards

### TypeScript

- **No `any`**: Explicitly define types. Use `unknown` for error handlers and external data before validation.
- **Error Handling Pattern**: Use structured error classes from `src/lib/errors.ts` (`AppError`, `ApiError`, `ValidationError`). Catch errors and handle according to type.
- **Zod for Validation**: Use Zod schemas to validate all external inputs (API requests, form data, env vars).
- **Interfaces over Types**: Prefer `interface` for object definitions (better error messages/extensibility).

### Tailwind CSS

- **Utility-First**: Use utility classes for styling.
- **Consistency**: Use the defined design tokens (colors, spacing) in `globals.css` / Tailwind config rather than arbitrary values (e.g., `bg-primary` instead of `bg-[#123456]`).
- **Mobile-First**: Style for mobile first, then add breakpoints (e.g., `md:flex`).

### Custom Utilities (Zero Dependency)

- **Prefer Direct TypeScript**: For small utilities (e.g., class merging, sound effects, animations), prefer custom TypeScript implementations over external packages to maintain a lean dependency tree and ensure long-term stability.
- **Current Implementations**:
  - `src/lib/utils.ts`: Custom native `cn()` implementation (zero external dependencies).
  - `src/lib/apiClient.ts`: Typed Fetch wrapper with automatic structured error handling.
  - `src/hooks/useSoundEffects.ts`: Custom `useAudio` hook using native Browser API.
  - `public/sounds/`: Local royalty-free MP3 assets for timer and UI feedback.
  - `src/lib/confetti.ts`: Custom Canvas-based confetti implementation (replaces `canvas-confetti`).

## 5. 📦 Supply Chain Security & Build Integrity (SLSA)

We enforce three gates for build integrity to ensure a secure and reproducible supply chain:

1.  **Deterministic Resolution**: `package-lock.json` is the sole source of truth. It must be committed and never bypassed.
2.  **Frozen Installs**: CI environments must use `npm ci` to ensure installs are reproducible and fail if the lockfile is out of sync.
3.  **Vulnerability Gate**: Automated vulnerability scanning (`npm run audit`) is mandatory in CI. High/critical vulnerabilities block releases.
4.  **Automated CI**: GitHub Actions (`ci.yml`) runs on every push/PR, performing `type-check`, `test:ci`, `audit`, and `build`.

### 🛡️ Dependency Guardrails (Strict Enforcement)

To maintain a secure and state-of-the-art codebase, the following rules are **MANDATORY**:

- **Zero Outdated Packages**: All direct dependencies MUST be kept at their latest stable version.
- **No Downgrades**: Downgrading a package to fix a temporary conflict is FORBIDDEN. Instead, resolve the environmental issue (e.g., using `--legacy-peer-deps`) or use `overrides` to patch sub-dependencies.
- **Custom Logic over Bloat**: Before adding any new utility dependency (e.g., string manipulation, small hooks, or UI helpers), check if it can be implemented in < 50 lines of TypeScript. If so, implement it internally.
- **Pre-Flight Check**: Any agent or developer modifying `package.json` MUST run `npm audit` and verify with a web search that they are using the absolute latest stable versions of all added/updated packages.
- **Zero Tolerance for Vulnerabilities**: If a tool causing vulnerabilities cannot be fixed via updates or overrides (like ESLint peerdeps), it must be removed until the ecosystem catches up. We prioritize security and clean audits over tooling.

## 6. 🔒 Security & Performance

- **Environment Variables**: Access private env vars ONLY on the server. Prefix public vars with `NEXT_PUBLIC_`.
- **Images**: Use `next/image` for all images to leverage automatic optimization.
- **Secrets**: NEVER commit `.env` files or secrets to Git.

## 7. 🧪 Workflow & Quality Standards

### ♿ Accessibility (A11y)

- **Discernible Text**: Buttons without visible text MUST have an `aria-label` or `title`. Links with only icons MUST also have an `aria-label`.
- **Form Labels**: Use `<label htmlFor="id">` paired with `<input id="id">` (or similar for `textarea`/`select`) for ALL form elements. Never rely solely on placeholders or non-associated text.
- **Icon-Only Interactive Elements**: MUST include an `aria-label` that describes the action (e.g., `aria-label="Close modal"`, `aria-label="Send message"`).
- **Icon Buttons**: When using Lucide or other icons inside buttons, ensure the button itself has a descriptive label for screen readers.
- **Color Contrast**: Ensure text has sufficient contrast against background colors.
- **Screen Reader Navigation**: Use semantic HTML and ARIA landmarks where appropriate to facilitate easy navigation.

### 🏗️ HTML Structure

- Strictly follow nesting rules (e.g., `<ul>` must only contain `<li>` as direct children).
- Use semantic elements (`<header>`, `<main>`, `<section>`, `<article>`, `<footer>`) to improve document structure.

### 🔍 Validation & Type Checking

- **No TypeScript Errors**: Ensure no TypeScript errors exist (`npm run type-check`).
- **Consistent Casing**: `forceConsistentCasingInFileNames: true` is enabled in `tsconfig.json` to prevent issues across different OS environments.
- **Runtime Validation**: Use Zod for all external data boundaries.
