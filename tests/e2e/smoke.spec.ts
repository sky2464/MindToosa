import { test, expect } from "@playwright/test";

test.describe("Public pages", () => {
  test("homepage has MindToosa title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/MindToosa/);
  });

  test("homepage loads without JS errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/");
    expect(errors).toHaveLength(0);
  });
});

test.describe("Auth guard — unauthenticated redirects", () => {
  const protectedRoutes = ["/today", "/week", "/goals", "/projects", "/spaces", "/settings"];

  for (const route of protectedRoutes) {
    test(`${route} redirects to auth when unauthenticated`, async ({ page }) => {
      await page.goto(route);
      // Should redirect to NextAuth signin or a login page
      await expect(page).not.toHaveURL(route, { timeout: 5000 });
      const url = page.url();
      expect(url).toMatch(/signin|login|auth/i);
    });
  }
});

test.describe("API health — public endpoints", () => {
  test("GET /api/auth/providers returns JSON", async ({ request }) => {
    const res = await request.get("/api/auth/providers");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toBeTruthy();
  });

  test("GET /api/tasks returns 401 without auth", async ({ request }) => {
    const res = await request.get("/api/tasks");
    expect(res.status()).toBe(401);
  });

  test("POST /api/support returns 401 without auth", async ({ request }) => {
    const res = await request.post("/api/support", {
      data: { email: "test@test.com", subject: "Test subject", message: "Test message body" },
    });
    expect(res.status()).toBe(401);
  });
});
