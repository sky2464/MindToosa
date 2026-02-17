# 🏛️ MindToosa Development Guidelines

This document serves as the primary context and rulebook for the MindToosa codebase. It integrates universal Gemini development standards with the specific constraints and technology stack of this project.

## 1. 🛠️ Technology Stack & Context

| Category | Technology | Version / Note |
|Base| **Next.js** | v16 (App Router) |
|Language| **TypeScript** | v5+ (Strict Mode) |
|Styling| **Tailwind CSS** | v4 |
|Database| **Supabase** | PostgreSQL |
|Auth| **NextAuth.js** | v5 Beta |
|AI| **Google Generative AI** | SDK |
|Validation| **Zod** | For all inputs/env vars |
|Icons| **Lucide React** | |
|Linting| **ESLint** | v10.0.0 (Flat Config) |

**Note:** ESLint 10 requires specific `overrides` in `package.json` for Next.js plugin compatibility and explicit React version setting in `eslint.config.mjs` for React 19 detection.

### Project Structure

```
/
├── src/
│   ├── app/            # Next.js App Router (Routes & Layouts)
│   ├── components/     # Reusable React components
│   ├── lib/            # Shared utilities, constants, helpers
│   ├── server/         # Server-side logic (Actions, DTOs)
│   └── auth.ts         # NextAuth configuration
├── supabase/           # Migrations & Config
├── public/             # Static Assets
└── .env.local          # Secrets (Never commit!)
```

## 2. 📐 Code Organization & Architecture

**Core Principle:** Domain-Driven & Feature-First.

- **Feature Folders:** Organize code by feature (e.g., `src/app/dashboard`, `src/components/dashboard`) rather than technical layers.
- **Dependency Rule:** `src/app` (UI/Page) -> `src/components` (UI) -> `src/lib` / `src/server` (Logic). Dependencies point inward.
- **Keep it Simple:** Avoid over-engineering. Use Next.js conventions (Server Components, Actions) effectively.

### Next.js Specifics

- **Server Components:** Default choice. Use for fetching data and rendering static content.
- **Client Components:** Add `'use client'` _only_ for interactivity (hooks, event listeners).
- **Server Actions:** Use for data mutations and form handling. Co-locate actions with the feature if possible, or in `src/server/actions`.

### Supabase & Data

- **RLS (Row Level Security):** MANDATORY on all tables. Security is enforced at the database layer.
- **Typed Clients:** Use generated TypeScript types for Supabase clients (`@supabase/ssr`).

## 3. 🧱 Design & Coding Standards

### TypeScript

- **Strict Typing:** No `any`. Use `unknown` for error handlers and external data.
- **Error Handling:** Use `catch (error: unknown)` and check `if (error instanceof Error)`.
- **Interfaces:** Prefer `interface` over `type` for object definitions.
- **Validation:** All external data (API params, Environment variables) MUST be validated with Zod.

### React Hooks

- **Focus Safety:** Avoid synchronous `setState` in `useEffect`. Use deferred updates or functional state updates to prevent cascading renders.

### Styling (Tailwind CSS)

- **Utility-First:** Use tailwind classes. Avoid custom CSS files unless defining global animations.
- **Design Tokens:** Use configured tokens (colors, spacing) from `globals.css` / theme.
- **Mobile-First:** Write responsive properties (e.g., `flex md:grid`).

### Universal Principles (SOLID & Functional)

- **SRP:** Files and components should do one thing well. (> 400 LOC is a smell).
- **Functional:** Prefer pure functions. Immutability where possible.
- **Composition:** Compose UI from smaller components. Avoid deep inheritance.

## 4. 🔒 Security & Data Privacy

- **Zero Trust:** Validate ALL inputs (Zod).
- **Secrets:** stored in `.env.local`. Accessed ONLY on server. Public vars prefixed with `NEXT_PUBLIC_`.
- **Database:** RLS policies are the source of truth for data access.
- **Dependencies:** Regular `npm audit`. Use pinned versions.

## 5. 🚀 Performance & Scalability

- **Server-Side Rendering:** Maximize use of SSR/RSC for initial load performance.
- **Images:** Always use `next/image`.
- **Stateless:** Server actions and APIs are stateless.
- **Caching:** Leverage Next.js request memoization and data cache.

## 6. 🧪 Testing & Quality

- **Linting:** `npm run lint` must pass.
- **Type Check:** Zero TypeScript errors.
- **Testing Strategy:**
  - **Unit:** For complex logic (e.g., `src/lib`).
  - **Integration:** Test Server Actions and API routes.
  - **E2E:** Critical user flows (Login, Core Feature).

## 7. 📝 Maintainability & Workflow

- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`).
- **Documentation:** Update `GEMINI.md` / `General.md` as architecture evolves.
- **Code Review:** Mandatory for all changes.

## 8. 🧠 Agent Context Strategy

- **Context Source:** rules in `General.md` / `GEMINI.md`.
- **Skills:** Use `.gemini/skills/` for complex, repeatable tasks (Deploy, Migration).

## 9. 📦 Dependency & Version Management

- **Manifests:** `package.json` is the source of truth.
- **Lockfiles:** Commit `package-lock.json`.
- **Vulnerability Scanning:** Run `npm audit` in CI.

## 10. ❌ Error Handling & Observability

- **Structured Logging:** Log as JSON with context (TraceID) where possible.
- **Graceful Failure:** UI should handle errors gracefully (Error Boundaries).
- **Zero Silent Failures:** Log all errors.

## 11. 💾 Data Integrity (Supabase)

- **ACID:** Prefer transactions for multi-step writes.
- **Migrations:** All schema changes MUST use Supabase migrations.
- **Idempotency:** Design generic actions to be idempotent.

## 12. 🌐 API Design

- **standardization:** Use standard HTTP status codes (200, 400, 500).
- **Versioning:** Version public APIs if applicable (not typical for internal Server Actions).

## 13. ⚙️ DevOps & CI/CD

- **IaC:** Infrastructure as Code (Supabase config).
- **Pipelines:** Lint -> Build -> Test -> Deploy.
- **Feature Flags:** Decouple deploy from release where useful.
