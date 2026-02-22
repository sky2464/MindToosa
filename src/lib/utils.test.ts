import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils"; // Adjust based on your alias

describe("cn utility", () => {
  it("combines classes correctly", () => {
    expect(cn("bg-red-500", "text-white")).toBe("bg-red-500 text-white");
  });

  it("merges tailwind conflicts", () => {
    expect(cn("p-4", "p-8")).toBe("p-8");
  });

  it("handles conditional classes", () => {
    expect(cn("text-sm", true && "font-bold", false && "hidden")).toBe("text-sm font-bold");
  });
});
