---
name: create_component
description: Create a new UI component with Tailwind CSS styling and proper typing.
---

# Create Component Skill

Use this skill to create consistent, reusable React components.

## Component Structure

- **Path:** `src/components/[Category]/[ComponentName].tsx` OR `src/components/ui/[ComponentName].tsx` (for primitives).
- **Naming:** PascalCase (e.g., `Button.tsx`, `UserCard.tsx`).
- **Exports:** Default export is preferred for Next.js consistency, but named exports are acceptable for utility bundles.

## Styling (Tailwind)

- Use standard Tailwind utility classes.
- For conditional classes, use template literals or a utility like `clsx`/`tailwind-merge` if available.
- **Micro-interactions:** Add `:hover`, `:active`, `:focus-visible` states.
- **Accessibility:** Ensure buttons have `type="button"` if not submits, use semantic HTML.

## Template

```tsx
import React from "react";

interface ComponentNameProps {
  title: string;
  isActive?: boolean;
  onClick?: () => void;
  className?: string; // Allow overrides
}

export default function ComponentName({
  title,
  isActive = false,
  onClick,
  className = "",
}: ComponentNameProps) {
  return (
    <div
      className={`\${ isActive ? 'bg-blue-50 text-blue-700' : 'bg-white hover:border-gray-300' } \${className} rounded-lg border border-blue-200 border-gray-200 p-4 text-gray-700 transition-all`}
      onClick={onClick}
    >
      <h3 className="font-medium">{title}</h3>
    </div>
  );
}
```
