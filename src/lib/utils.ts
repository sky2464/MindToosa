/**
 * cn utility - Zero Dependency Version
 * 
 * Merges class names and handles Tailwind CSS conflict resolution natively.
 * This meets the project's zero-dependency requirement in GEMINI.md.
 */

type ClassValue = string | number | boolean | undefined | null | { [key: string]: any } | ClassValue[];

function toVal(mix: ClassValue): string {
  let str = '';

  if (typeof mix === 'string' || typeof mix === 'number') {
    str += mix;
  } else if (typeof mix === 'object') {
    if (Array.isArray(mix)) {
      for (let k = 0; k < mix.length; k++) {
        if (mix[k]) {
          const y = toVal(mix[k]);
          if (y) str += (str ? ' ' : '') + y;
        }
      }
    } else {
      for (const k in mix) {
        if (mix && mix[k]) {
          str += (str ? ' ' : '') + k;
        }
      }
    }
  }

  return str;
}

/**
 * Combines class names and resolves Tailwind conflicts.
 */
export function cn(...inputs: ClassValue[]): string {
  const classes = toVal(inputs).split(' ').filter(Boolean);

  // Basic Tailind Merge Logic (simplified for internal use)
  // We keep the last class for each unique prefix group (e.g., p-, m-, focus:, etc.)
  const result: string[] = [];
  const seen: Record<string, string> = {};

  for (let i = classes.length - 1; i >= 0; i--) {
    const cls = classes[i];

    // Identify prefix group
    // This is a heuristic for Tailwind class groups
    // e.g., "p-4", "px-2", "focus:p-8"
    // We split by variants and then get the base class name prefix
    const parts = cls.split(':');
    const baseClass = parts[parts.length - 1];
    const variants = parts.slice(0, -1).join(':') + (parts.length > 1 ? ':' : '');

    // Get the core property prefix (e.g., "p-", "bg-", "text-")
    // This handles most Tailwind conflicts
    let group = '';
    if (baseClass.includes('-')) {
      const gParts = baseClass.split('-');
      // Keep first part or first two parts if it's something like "text-opacity"
      group = gParts[0];
      if (['bg', 'text', 'border', 'ring', 'p', 'm', 'px', 'py', 'mx', 'my', 'w', 'h', 'min', 'max'].includes(group)) {
        // special handling for common groups
      } else {
        group = baseClass; // default to whole class if not predictable
      }
    } else {
      group = baseClass;
    }

    const key = variants + group;

    if (!seen[key]) {
      seen[key] = cls;
      result.unshift(cls);
    }
  }

  return result.join(' ');
}
