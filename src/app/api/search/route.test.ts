import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";
import { searchService } from "@/server/services/searchService";
import { rateLimit } from "@/server/rateLimit";

// Mock dependencies
vi.mock("@auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/server/services/searchService", () => ({
  searchService: {
    search: vi.fn(),
  },
}));

vi.mock("@/server/rateLimit", () => ({
  rateLimit: vi.fn(),
}));

import { auth } from "@auth";

describe("Search API Route", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return 401 if not authenticated", async () => {
    (auth as any).mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/search?q=test");

    // In Next.js 16/React 19, strict mocks might behave differently, but let's try standard response check
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("should return 429 if rate limited", async () => {
    (auth as any).mockResolvedValue({ user: { email: "test@example.com" } });
    (rateLimit as any).mockResolvedValue(false); // Rate limit exceeded

    const req = new NextRequest("http://localhost/api/search?q=test");
    const res = await GET(req);

    expect(res.status).toBe(429);
  });

  it("should return search results on success", async () => {
    (auth as any).mockResolvedValue({ user: { email: "test@example.com" } });
    (rateLimit as any).mockResolvedValue(true);
    (searchService.search as any).mockResolvedValue([]);

    const req = new NextRequest("http://localhost/api/search?q=test");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    // Response is now wrapped in the API envelope
    expect(body.__envelope).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("should handle service errors gracefully", async () => {
    (auth as any).mockResolvedValue({ user: { email: "test@example.com" } });
    (rateLimit as any).mockReturnValue(true);
    (searchService.search as any).mockRejectedValue(new Error("Service failure"));

    const req = new NextRequest("http://localhost/api/search?q=test");
    const res = await GET(req);

    expect(res.status).toBe(500);
  });
});
