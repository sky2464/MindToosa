---
description: MindToosa Workspace Best Practices & Workflow
---

# 🎯 MindToosa Workspace Workflow

This workflow provides specific guidance for the MindToosa application, integrating Global Antigravity Best Practices with the project's unique tech stack and architectural decisions.

## 🏛️ Project Principles

- **Next.js 16 (App Router)**: Favor Server Components for data fetching. Use `'use client'` sparingly.
- **Supabase Integrity**: ALWAYS enable Row Level Security (RLS) on all PostgreSQL tables.
- **Zero-Dependency Utilities**: Prioritize internal TypeScript implementations for small helpers (e.g., `src/lib/utils.ts`, `src/hooks/useSoundEffects.ts`).
- **Premium Aesthetics**: Align with the "Sensory Experience" goal. Use Tailwind 4.0 tokens and custom animations.

## 🔄 Development Loops

### 1. Feature Implementation

- **Domain-First**: Group logic by domain/feature in `src/app` or `src/components`.
- **Validation**: Use **Zod** for all external inputs and environment variables.
- **Type Safety**: Strictly avoid `any`. Use `unknown` with narrowing for error boundaries.

### 2. UI/UX Refinement

- **Interactivity**: Use `useAudio` for sound effects and the custom confetti utility for success states.
- **Animation**: Implement smooth transitions and micro-animations to enhance focus.
- **Icons**: Standardize on **Lucide React**.

### 3. Security & Build

- **Dependency Guardrails**: Never downgrade packages. Use `overrides` in `package.json` for ESLint 10 compatibility.
- **Secrets**: Access private variables ONLY on the server. Prefix public ones with `NEXT_PUBLIC_`.
- **Reproducibility**: Use `npm ci` for testing and deployment.

## ✅ Verification Checklist

- [ ] `npm run lint` passes (ESLint 10 Flat Config).
- [ ] `npm run type-check` reveals no errors.
- [ ] RLS policies are verified for any new database tables.
- [ ] Design adheres to the premium, vibrant, and interactive MindToosa aesthetic.

---

// turbo-all
_Reference this workflow for any task within the MindToosa workspace._
