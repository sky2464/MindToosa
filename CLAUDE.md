# 🏛️ MindToosa Development Context — Claude Standards

This document serves as the primary context source for Claude-based AI agents working on the MindToosa codebase.

## 1. 🛠️ Technology Stack

- **Framework**: Next.js 16.1.6 (App Router, `proxy.ts` convention replaces deprecated `middleware.ts`)
- **Language**: TypeScript 5.9.3 (`StrictMode` enabled)
- **Styling**: Tailwind CSS 4.1.18 (Midnight Glass dark theme — see `globals.css` for design tokens)
- **Database & Auth**: Supabase (PostgreSQL via service-role key), NextAuth.js v5 Beta 30 (Google OAuth)
- **AI**: Google GenAI SDK (`@google/genai` v0.24.1)
- **Validation**: Zod v4.3.6
- **Icons**: Lucide React v0.574.0
- **Runtime**: ESM, Node.js
- **Testing**: Vitest + Playwright
- **No ESLint**: Removed due to transitive dependency vulnerabilities; TypeScript strict mode covers type safety.

## 2. 📂 Project Structure

```
/
├── src/
│   ├── app/            # Next.js App Router (pages, layouts, API routes)
│   │   ├── api/        # REST API routes (auth checked per-route)
│   │   ├── today/      # Daily planning + focus timer
│   │   ├── week/       # Weekly grid view
│   │   ├── goals/      # North Stars / long-term goals
│   │   ├── projects/   # Project management + Kanban
│   │   ├── spaces/     # Context organization
│   │   └── settings/   # User preferences
│   ├── components/     # Reusable React components
│   ├── core/           # Zod schemas + shared types (planTypes.ts)
│   ├── hooks/          # Custom hooks (useSoundEffects)
│   ├── lib/            # Utilities (cn, apiClient, confetti)
│   ├── server/         # Services, DB client, LLM client, env validation
│   │   └── services/   # Domain services (task, project, goal, space, focus, gamification)
│   ├── auth.ts         # NextAuth config
│   └── proxy.ts        # Next.js 16 proxy (auth gate for page routes)
├── supabase/           # DB migrations (0000-0006)
├── public/             # Static assets + sounds
└── .env.local          # Secrets (never commit)
```

## 3. 🎨 Design System — Midnight Glass

**CRITICAL**: The entire app uses a dark glassmorphism theme. NEVER use light-theme classes.

| Token                | Value                  | Usage                         |
| -------------------- | ---------------------- | ----------------------------- |
| `--background`       | `#09090b` (zinc-950)   | Page backgrounds              |
| `--card`             | `#18181b` (zinc-900)   | Cards, panels                 |
| `--primary`          | `#6366f1` (indigo-500) | Accents, buttons, focus rings |
| `--secondary`        | `#27272a` (zinc-800)   | Secondary surfaces, borders   |
| `--muted-foreground` | `#a1a1aa` (zinc-400)   | Subtle text                   |
| `--destructive`      | `#ef4444` (red-500)    | Delete, errors                |

Use CSS custom properties via Tailwind: `bg-background`, `text-foreground`, `bg-card`, `text-muted-foreground`, `border-border`.
Use `.glass-panel` and `.glass-card` classes for glassmorphism effects.

## 4. 🔒 Auth & Security Architecture

- **Proxy (`proxy.ts`)**: Wraps NextAuth `auth()` to protect all page routes. API routes are excluded (they check auth individually).
- **DB Client**: Uses Supabase **service-role key** which bypasses RLS. All authorization MUST be enforced in service-layer code via `user_id` filtering.
- **Auth Pattern**: API routes call `auth()` → extract `session.user.email` as `userId` → pass to service methods.
- **Services**: Accept `userId` as parameter (not `auth()` internally). This ensures testability and consistent authorization.

## 5. 📐 Code Rules

- **No `any`**: Use `unknown` for error handlers, proper types everywhere else.
- **Zod for ALL inputs**: Validate API request bodies, form data, and env vars.
- **Server Components by default**: Only add `'use client'` for interactivity.
- **Server Actions for mutations**: Prefer over API routes for form submissions.
- **`router.refresh()`**: Never use `window.location.reload()`.
- **Custom utilities over deps**: Implement small helpers in TypeScript.
- **No ESLint**: Removed. Rely on TypeScript strict mode.
- **Frozen lockfile**: Use `npm ci` in CI.

## 6. 📋 Key Patterns

### API Route Pattern

```typescript
export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.email;
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const json = await req.json();
  const parsed = MySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const result = await myService.create(userId, parsed.data);
  return NextResponse.json(result);
}
```

### Service Pattern

```typescript
export const myService = {
  async getItems(userId: string, filters: Filters): Promise<Item[]> {
    const { data, error } = await db.from("items").select("*").eq("user_id", userId);
    if (error) throw new Error(error.message);
    return data as Item[];
  },
};
```

## 7. 🧪 Testing

- **Unit**: `npx vitest run` — Vitest with jsdom, `@` alias mapped.
- **E2E**: Playwright (config exists but minimal tests).
- **Type-check**: `npx tsc --noEmit`.
- **Build**: `npm run build`.

## 8. 🚫 Known Constraints

- `user_stats` table uses `text` for `user_id` (email-based, matching other tables).
- RLS policies exist but are bypassed by service-role key. They serve as documentation of intended access patterns.
- No multi-user/team support yet — single-user app.
