import { describe, it, expect } from "vitest";
import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/routeError";
import { AppError, ValidationError, AuthError } from "@/lib/errors";

describe("handleRouteError", () => {
    it("returns 400 for ValidationError", async () => {
        const err = new ValidationError("Bad input");
        const res = handleRouteError(err);
        expect(res).toBeInstanceOf(NextResponse);
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.error).toContain("Bad input");
    });

    it("returns 403 for AuthError", async () => {
        const err = new AuthError("Forbidden");
        const res = handleRouteError(err);
        expect(res.status).toBe(403);
    });

    it("returns 500 for AppError", async () => {
        const err = new AppError("DB failed", "DB_ERROR");
        const res = handleRouteError(err);
        expect(res.status).toBe(500);
    });

    it("returns 500 for generic Error", async () => {
        const err = new Error("Unexpected");
        const res = handleRouteError(err);
        expect(res.status).toBe(500);
    });

    it("returns 500 for unknown non-Error", async () => {
        const res = handleRouteError("string error");
        expect(res.status).toBe(500);
    });
});
