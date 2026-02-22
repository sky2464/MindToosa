const MAX_LLM_INPUT_LENGTH = 2000;
const MAX_LLM_ARRAY_ITEM_LENGTH = 500;
const MAX_LLM_ARRAY_ITEMS = 20;

/**
 * Strips characters that are commonly used in prompt injection attempts and
 * truncates to a safe maximum length. Applied to all user-supplied strings
 * before they are interpolated into LLM prompts.
 */
export function sanitizeLLMInput(input: string, maxLength = MAX_LLM_INPUT_LENGTH): string {
  return input
    .replace(/[<>]/g, "") // remove angle brackets (HTML/XML injection)
    .replace(/```/g, "") // remove markdown code fences (used to escape context)
    .replace(/\[INST\]|\[\/INST\]|<\|system\|>|<\|user\|>/gi, "") // common prompt delimiters
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitize an array of strings (e.g. constraints, micro-steps) for LLM use.
 */
export function sanitizeLLMArray(
  items: string[],
  maxItems = MAX_LLM_ARRAY_ITEMS,
  maxItemLength = MAX_LLM_ARRAY_ITEM_LENGTH
): string[] {
  return items.slice(0, maxItems).map((item) => sanitizeLLMInput(item, maxItemLength));
}
