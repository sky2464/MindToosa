# MindToosa — GitHub Copilot Instructions

This document helps Copilot work effectively in the MindToosa repository. For complete context, refer to `CLAUDE.md`, `GEMINI.md`, and `Agents.md` in the repository root.

## Assistant Rules for AI / Automation

- **Framework rule (hard):** This project uses Next.js 16 (App Router). Always use `proxy.ts` for auth gating; do NOT create, edit, or introduce `middleware.ts` (or `middleware.js`/`middleware.tsx`). Agents must prefer `proxy.ts` and follow the `proxy.ts` auth pattern documented in `CLAUDE.md` and `Agents.md`.
- **Machine-readable rules:** Check for `.ai/assistant-config.json` at the repo root and honor rules marked `type: "hard"` before making changes.
- **Canonical machine manifest:** `.ai/assistant-config.json` is the authoritative, versioned machine-readable rule manifest — prefer its `type: "hard"` rules over duplicated guidance in human docs.
- **Validation:** Validate ALL external inputs with Zod for any new API routes, Server Actions, or form handlers.
- **If unsure:** Ask a human reviewer or create a draft PR flagged `wip` instead of pushing breaking changes (especially for major dependency or Next.js infra changes).

CI checks are provided to block PRs that introduce deprecated Next.js artifacts. See `.github/workflows/detect-deprecated-next.yml`.

## Quick Start Commands

### Build & Development

```bash
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Production build
npm run start            # Start production server
```

### Testing & Quality

```bash
npm run type-check       # Run TypeScript type checking (no emit)
npm run test             # Run unit tests in watch mode (Vitest + jsdom)
npm run test:ci          # Run tests once (CI mode)
npm run test:e2e         # Run Playwright E2E tests
npm run test:e2e:ui      # Run Playwright tests with UI
npm run audit            # Security audit (fails on high/critical)
npm run format           # Format code with Prettier
```

### Single Test File

```bash
npx vitest tests/lib/utils.test.ts    # Run specific test file
npx vitest -t "test name"             # Run specific test by name
```

## Technology Stack

| Category      | Technology             | Version     | Notes                                                                   |
| ------------- | ---------------------- | ----------- | ----------------------------------------------------------------------- |
| Framework     | Next.js (App Router)   | 16.1.6      | `proxy.ts` replaces deprecated `middleware.ts` for auth gating          |
| Language      | TypeScript             | 5.9.3       | `strict: true` enforced; no `any` type allowed                          |
| Styling       | Tailwind CSS           | 4.1.18      | Dark glassmorphism theme; use CSS custom properties (see below)         |
| Database/Auth | Supabase + NextAuth.js | v5 Beta 30  | Service-role key bypasses RLS; auth enforced in services via userId     |
| Validation    | Zod                    | 4.3.6       | Required for ALL external inputs                                        |
| Icons         | Lucide React           | 0.574.0     | Icon-only buttons must have `aria-label` or `title`                     |
| Testing       | Vitest + Playwright    | ^4.0, ^1.58 | Vitest uses jsdom and `@` alias mapping                                 |
| **Linting**   | **Removed** (ESLint)   | N/A         | ESLint v10+ has unresolved vulnerabilities; TypeScript strict covers it |

## Architecture & Key Patterns

### Project Structure

```
src/
├── app/                    # Next.js App Router (pages, layouts, API)
│   ├── api/               # REST endpoints (auth checked per-route)
│   ├── today/             # Daily planning + focus timer
│   ├── week/              # Weekly grid view
│   ├── goals/             # Goal management
│   ├── projects/          # Project + Kanban
│   ├── spaces/            # Context organization
│   ├── settings/          # User preferences
│   ├── help/ docs/ about/ support/  # Public pages (no auth)
│   └── layout.tsx         # Root layout
├── components/            # Reusable React components
│   ├── NavBar.tsx        # Main navigation (protected) + resource nav (public)
│   ├── FaqItem.tsx       # Collapsible accordion for FAQs
│   ├── DocSection.tsx    # Content section wrapper with heading
│   └── ContactCard.tsx   # Icon + link card for contact/social
├── core/                  # Zod schemas + shared types (planTypes.ts)
├── hooks/                 # Custom hooks (useSoundEffects.ts)
├── lib/                   # Utilities (cn, apiClient, confetti, errors)
├── server/                # Server-side logic
│   └── services/         # Domain services (task, project, goal, space, focus, gamification)
└── auth.ts               # NextAuth configuration
```

### Public vs. Protected Pages

**Protected Routes** (require auth via `proxy.ts`):

- `/today`, `/week`, `/goals`, `/projects`, `/spaces`, `/settings`

**Public Routes** (no auth required):

- `/help`, `/docs`, `/about`, `/support`
- These are statically prerendered and globally accessible
- Should use `md:ml-16` padding on desktop to account for sidebar

### Authentication & Authorization Pattern

```typescript
// API Route Example (src/app/api/tasks/route.ts)
export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.email; // Use email as userId
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const json = await req.json();
  const parsed = TaskSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const result = await taskService.create(userId, parsed.data);
  return NextResponse.json(result);
}

// Service Pattern (src/server/services/taskService.ts)
export const taskService = {
  async getItems(userId: string, filters: Filters): Promise<Task[]> {
    const { data, error } = await db.from("tasks").select("*").eq("user_id", userId); // Enforce userId filtering
    if (error) throw new Error(error.message);
    return data as Task[];
  },
};
```

**Key Rule**: Services accept `userId` as a parameter and filter all queries by it. This ensures authorization is consistent and testable.

### Design System — Midnight Glass

**Dark theme only**. Use CSS custom properties via Tailwind:

| Token                | Value              | Usage                   |
| -------------------- | ------------------ | ----------------------- |
| `--background`       | `#09090b`          | Page backgrounds        |
| `--card`             | `#18181b`          | Cards, panels           |
| `--primary`          | `#6366f1` (indigo) | Accents, buttons, focus |
| `--secondary`        | `#27272a`          | Secondary surfaces      |
| `--muted-foreground` | `#a1a1aa` (gray)   | Subtle text             |
| `--destructive`      | `#ef4444` (red)    | Errors, delete          |

Use classes like `bg-background`, `text-foreground`, `bg-card`, `.glass-panel`, `.glass-card`.

### Content Components for Public Pages

- **`FaqItem`** — Collapsible accordion

  ```tsx
  <FaqItem question="How do I start?" answer={<p>Click Today...</p>} isOpen={false} />
  ```

- **`DocSection`** — Section with heading and scroll anchor

  ```tsx
  <DocSection title="Getting Started" id="getting-started">
    <p>Your content...</p>
  </DocSection>
  ```

- **`ContactCard`** — Icon + link card
  ```tsx
  <ContactCard
    icon={Mail}
    title="Email Support"
    description="Contact us"
    href="mailto:support@mindtoosa.com"
  />
  ```

## Code Standards

### TypeScript

- **Strict mode enabled** — Use `unknown` for error handlers, never `any`
- **Zod validation** — Validate ALL external inputs (API params, form data, env vars)
- **Interfaces > Types** — Prefer `interface` for objects (better error messages)
- **Error handling** — Use structured classes from `src/lib/errors.ts`

### React & Server Components

- **Server Components by default** — Only add `'use client'` for interactivity (state, effects, listeners)
- **Server Actions** — Prefer for mutations over API routes where possible
- **Avoid sync setState in effects** — Use deferred updates or event handlers to prevent render cascades
- **React 19 optimized** — Code targets React 19+

### Tailwind CSS

- **Utility-first** — Use tailwind classes; avoid custom CSS unless defining global animations
- **Design tokens** — Use configured values from `globals.css` (no arbitrary colors)
- **Mobile-first** — Style mobile, then add breakpoints (e.g., `md:flex`)

### Custom Implementations (Zero Dependency Philosophy)

Instead of adding packages, implement small utilities in TypeScript:

- `src/lib/utils.ts` — Native `cn()` for class merging (zero deps)
- `src/lib/apiClient.ts` — Typed Fetch wrapper with error handling
- `src/hooks/useSoundEffects.ts` — Custom `useAudio` hook using Browser API
- `src/lib/confetti.ts` — Canvas-based confetti (replaces `canvas-confetti`)

### Accessibility (A11y)

- **Icon-only buttons** — Must have `aria-label` or `title`
- **Form labels** — Always use `<label htmlFor="id">` with matching `<input id="id">`
- **Semantic HTML** — Use `<header>`, `<main>`, `<section>`, `<article>`, `<footer>`
- **List structure** — `<ul>` and `<ol>` can only directly contain `<li>` elements

## Supply Chain & Security

### Dependency Management

- **Frozen lockfile** — `package-lock.json` is source of truth; use `npm ci` in CI
- **Zero outdated packages** — All direct dependencies at latest stable version
- **No downgrades** — Resolve conflicts via `overrides` or `--legacy-peer-deps`, not downgrades
- **Custom logic over bloat** — Implement < 50 line utilities in TypeScript instead of adding deps
- **Vulnerability gate** — `npm audit` must pass; high/critical blocks releases

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml runs:
1. Type check (tsc --noEmit)
2. Unit tests (npm run test:ci)
3. Audit (npm audit --audit-level=high)
4. Build (npm run build)
```

Run locally before pushing:

```bash
npm run type-check && npm run test:ci && npm audit && npm run build
```

## Known Constraints

- `user_stats` table uses `text` for `user_id` (email-based, matching other tables)
- RLS policies exist but are bypassed by service-role key; they document access patterns
- Single-user app (no team/multi-user support yet)
- Supabase migrations are in `supabase/` directory; always use migrations for schema changes

## When Adding Dependencies

1. Run `npm audit` to check for conflicts
2. Verify the package is at latest stable via web search
3. Check if it can be implemented in < 50 lines of TypeScript
4. If < 50 lines, implement it instead of adding a dependency
5. Update `package-lock.json` and commit

## References

- **Complete Architecture**: `CLAUDE.md` (NextAuth, Services, Auth patterns)
- **Development Standards**: `GEMINI.md` (Accessibility, HTML structure, styling)
- **DevOps & Workflow**: `Agents.md` (Conventions, commit messages, agent context)
- **Frontend Docs**: `README.md` (Docker setup, deployment)
