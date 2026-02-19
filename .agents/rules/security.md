---
trigger: always_on
---

# PROJECT RULES — ENFORCE ALL OF THESE WITHOUT EXCEPTION

## Stack Constraints
- Framework: Next.js 16.1.6 (App Router ONLY — never suggest Pages Router patterns)
-- Next.js 16 Compliance: valid middleware.ts is deprecated in favor of proxy.ts.
- Runtime: Node.js 24.x LTS — never suggest APIs removed or deprecated in Node 24
- UI: React 19.x — use React 19 patterns (use(), useFormStatus, useOptimistic, Server Components)
- Auth: next-auth@5.0.0-beta.26 (Auth.js v5)
  - Use `auth()` universal method — NEVER use `getServerSession`, `getSession`, `withAuth`
  - Use AUTH_SECRET env var — NEVER use NEXTAUTH_SECRET or NEXTAUTH_URL
  - Use AUTH_URL env var for base URL

## Absolute Package Rules

### Before Installing ANY Package
1. Run `npm view <package-name> --json` in terminal first
2. Confirm the package EXISTS on the live npm registry
3. Confirm `"time"` shows a publish date within the last 18 months
4. Confirm weekly downloads > 50,000 via npmjs.com
5. STOP and report to me if ANY of the above checks fail
6. WAIT for my explicit "yes, install it" before running npm install

### Package Quality Gates — All Must Pass
- Package must have been updated within 18 months
- Package must have >50k weekly npm downloads
- Package must explicitly support React 19 and/or Next.js 16+
- Package must NOT have any HIGH or CRITICAL CVEs (check via `npm audit` after adding)
- Package must have >500 GitHub stars OR be from a verified org (vercel, facebook, google, etc.)
- CJS-only packages are FORBIDDEN — ESM or dual CJS/ESM only

### Forbidden Packages (Do Not Suggest or Install)
- Any package last published before 2026
- Any package with <10k weekly downloads unless it is a type definition (@types/*)
- `moment` → use `date-fns` or `dayjs` instead
- `request` or `node-fetch` → use native fetch (built into Node 24)
- `lodash` → use native JS or `es-toolkit` instead
- `express` (unless specifically asked for a standalone server)
- Any package with "legacy", "deprecated" or "unmaintained" in its readme
- react-query v3 → must use TanStack Query v5
- next-auth@4.x → must use next-auth@5.x (Auth.js)
- Any package that installs a postinstall script without my review

### Pinning Rules
- ALWAYS pin to exact versions: `"next": "16.1.6"` NOT `"next": "^16.1.6"`
- NEVER use `"latest"` as a version
- NEVER use `*` as a version
- After any install, run `npm audit --audit-level=high` and show me the output

## Next.js 16 Specific Rules
- Use App Router file conventions: `app/`, `layout.tsx`, `page.tsx`, `loading.tsx`, `error.tsx`
- Server Components by default — only add `"use client"` when strictly necessary (event handlers, hooks, browser APIs)
- Use Next.js 16 native `fetch()` with `cache` and `revalidate` options — NEVER use axios for server-side fetching
- Middleware lives at `middleware.ts` in root — never in `app/`
- Environment variables: server-only vars have no prefix, public vars use `NEXT_PUBLIC_` prefix
- Image optimization: always use `next/image`, never raw `<img>` tags
- Font optimization: always use `next/font`, never external font CDN links in layout
- Never suggest `getServerSideProps` or `getStaticProps` — these are Pages Router only

## Auth.js (next-auth v5) Specific Rules
- Auth config lives in a single `auth.ts` file at the root
- Route handler lives at `app/api/auth/[...nextauth]/route.ts`
- Protect routes via `middleware.ts` using the `auth` export
- Session access in Server Components: `const session = await auth()`
- Session access in Client Components: `useSession()` from `next-auth/react`
- NEVER store sensitive data in the session JWT
- ALWAYS validate session on the server before any data mutation

## Security Rules
- NEVER hardcode secrets, API keys, or credentials in source code
- ALL secrets go in `.env.local` (never committed) — add to `.gitignore` immediately if missing
- NEVER suggest storing auth tokens in localStorage — use httpOnly cookies only
- Input validation: use `zod` for ALL form and API input validation
- API routes must validate auth session before processing any request
- CSP headers must be set in `next.config.ts` for any new project setup
- NEVER use `dangerouslySetInnerHTML` unless sanitized with DOMPurify first

## Code Quality Rules
- TypeScript ONLY — never write plain `.js` files (except config files that require it)
- Strict mode must be on in `tsconfig.json`
- No `any` types — use `unknown` and narrow, or define proper types
- Prefer `async/await` over `.then()` chains
- Always handle errors explicitly — no silent catches

## Terminal Command Rules
- ALWAYS ask before running ANY terminal command
- Show me the exact command and explain what it does before executing
- Never run `rm -rf` on anything
- Never run install commands in parallel — one at a time so audit results are clear
- After EVERY npm install, immediately run: `npm audit --audit-level=moderate`