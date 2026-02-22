import { describe, it, expect } from "vitest";
import { sanitizeLLMInput, sanitizeLLMArray } from "@/lib/sanitize";

describe("sanitizeLLMInput", () => {
  it("strips HTML angle brackets", () => {
    expect(sanitizeLLMInput("<script>alert(1)</script>")).not.toContain("<");
    expect(sanitizeLLMInput("<script>alert(1)</script>")).not.toContain(">");
  });

  it("removes triple backtick code fences", () => {
    expect(sanitizeLLMInput("```python\nmalicious```")).not.toContain("```");
  });

  it("strips prompt injection delimiters", () => {
    expect(sanitizeLLMInput("[INST]inject[/INST]")).not.toContain("[INST]");
    expect(sanitizeLLMInput("<|system|>override")).not.toContain("<|system|>");
    expect(sanitizeLLMInput("<|user|>inject")).not.toContain("<|user|>");
  });

  it("truncates to maxLength", () => {
    const long = "a".repeat(3000);
    expect(sanitizeLLMInput(long).length).toBeLessThanOrEqual(2000);
  });

  it("respects custom maxLength", () => {
    const long = "a".repeat(500);
    expect(sanitizeLLMInput(long, 100).length).toBeLessThanOrEqual(100);
  });

  it("returns empty string for undefined/null-like values", () => {
    expect(sanitizeLLMInput("")).toBe("");
  });

  it("preserves safe normal text", () => {
    const text = "Write a report about machine learning";
    expect(sanitizeLLMInput(text)).toBe(text);
  });
});

describe("sanitizeLLMArray", () => {
  it("sanitizes each element", () => {
    const input = ["safe text", "<malicious>", "[INST]bad[/INST]"];
    const result = sanitizeLLMArray(input);
    expect(result[0]).toBe("safe text");
    expect(result[1]).not.toContain("<");
    expect(result[2]).not.toContain("[INST]");
  });

  it("preserves array length (does not filter)", () => {
    const input = ["valid", "also valid", "third"];
    expect(sanitizeLLMArray(input)).toHaveLength(3);
  });

  it("respects maxItems limit", () => {
    const input = Array.from({ length: 30 }, (_, i) => `item ${i}`);
    expect(sanitizeLLMArray(input).length).toBeLessThanOrEqual(20);
  });

  it("returns empty array for empty input", () => {
    expect(sanitizeLLMArray([])).toEqual([]);
  });
});
