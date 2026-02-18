---
name: React 19 Development
description: Guide for React 19 features including Actions, useOptimistic, and new hook patterns
---

# React 19 Development Guide

## 1. Actions

- **Form Actions**: Pass functions to `action` props on `<form>`.
- **`useActionState`**: Replaces `useFormState`. Use this to pinpoint form state (e.g., errors, success message) returned from a Server Action.
  ```typescript
  const [state, formAction, isPending] = useActionState(
    serverAction,
    initialState,
  );
  ```

## 2. Optimistic Updates

- **`useOptimistic`**: Show immediate UI updates while a Server Action is pending.
  ```typescript
  const [optimisticTasks, addOptimisticTask] = useOptimistic(
    tasks,
    (state, newTask) => [...state, newTask],
  );
  ```

## 3. New Hook Patterns

- **`use` API**:
  - Read contexts: `const theme = use(ThemeContext)` (can be conditional!).
  - Read promises: `const data = use(promise)` (suspends component).
- **`ref` as Prop**: `forwardRef` is no longer needed. Pass `ref` directly as a prop.
  ```typescript
  function MyInput({ type, ref }) {
    return <input type={type} ref={ref} />;
  }
  ```

## 4. Helper Hooks

- **`useFormStatus`**: Access the loading state of a parent `<form>` without prop drilling.
  ```typescript
  const { pending } = useFormStatus();
  return <button disabled={pending}>Submit</button>;
  ```

## 5. Strict Mode & Hydration

- React 19 is stricter about hydration mismatches. Ensure server-rendered HTML matches client-side initial render exactly.
- Avoid using `typeof window !== 'undefined'` for rendering logic; use `useEffect` or specific client-only wrappers.
