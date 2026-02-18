---
name: Tailwind CSS 4 Development
description: Guide for using Tailwind CSS v4 with CSS-first configuration and new engine
---

# Tailwind CSS 4 Development Guide

## 1. CSS-First Configuration

- **Native CSS**: v4 moves configuration into CSS variables and `@theme` blocks.
- **Variables**: Use native CSS variables for theme values.

  ```css
  @import "tailwindcss";

  @theme {
    --color-primary: #3b82f6;
    --font-sans: "Inter", sans-serif;
    --breakpoint-3xl: 1920px;
  }
  ```

## 2. Zero Configuration File

- **No `tailwind.config.js`**: In v4, you often don't need a JS config file. The `@theme` directive handles customization.
- **Content Detection**: The new engine automatically detects content files. You rarely need to configure `content` paths manually unless your structure is very non-standard.

## 3. P3 Color Gamut

- **OKLCH**: v4 uses `oklch` colors by default for wider gamut support.
- **Opacity**: Use the `/` syntax for opacity modifiers, e.g., `bg-primary/50`.

## 4. Modern Reset

- The preflight reset is essentially the same but optimized.
- Ensure you import the styles correctly in your root layout:
  ```css
  @import "tailwindcss";
  ```

## 5. Dynamic Utilities

- Arbitrary values are still supported `w-[500px]`, but v4's engine is faster at generating them on the fly.
- Use `@apply` sparingly; prefer utility classes in markup.
