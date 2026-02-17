---
name: create_feature
description: Scaffold a new full-stack feature (Page + Component + Server Action) following MindToosa architecture.
---

# Create Feature Skill

Use this skill to create a new feature in the MindToosa Application.
This follows the "Feature Folder" architecture rooted in `src/app`.

## Feature Structure

A clear feature (e.g., `goals`) should look like this:

- `src/app/goals/page.tsx` (Server Component - Page Root)
- `src/app/goals/GoalsView.tsx` (Client/UI Component)
- `src/app/goals/actions.ts` (Server Actions - Optional)

## Steps

1.  **Create the Page (Server Component)**
    - Path: `src/app/[feature_name]/page.tsx`
    - Logic: Fetch initial data here.
    - Render: Pass data to the View component.

2.  **Create the View (Client/UI Component)**
    - Path: `src/app/[feature_name]/[Feature]View.tsx`
    - Logic: Interactive UI, State.
    - Props: Accept initial data from Page.

3.  **Create Server Actions (If data mutation needed)**
    - Path: `src/app/[feature_name]/actions.ts`
    - Logic: `use server` functions.
    - Validation: Use **Zod** for all arguments.
    - Security: Check authentication (NextAuth/Supabase).

## Example: `create-todo`

### 1. `src/app/todos/page.tsx`

```tsx
import { createClient } from "@/utils/supabase/server";
import TodosView from "./TodosView";

export default async function TodosPage() {
  const supabase = createClient();
  const { data: todos } = await supabase.from("todos").select("*");

  return <TodosView initialTodos={todos || []} />;
}
```

### 2. `src/app/todos/actions.ts`

```ts
"use server";

import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

const schema = z.object({
  title: z.string().min(1),
});

export async function addTodo(formData: FormData) {
  const supabase = createClient();
  const { title } = schema.parse({ title: formData.get("title") });

  await supabase.from("todos").insert({ title });
  revalidatePath("/todos");
}
```
