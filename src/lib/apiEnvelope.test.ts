import { describe, it, expect } from "vitest";
import { jsonEnvelope } from "@/lib/apiEnvelope";

describe("jsonEnvelope", () => {
    it("wraps data with __envelope marker", async () => {
        const res = jsonEnvelope([1, 2, 3]);
        const body = await res.json();
        expect(body.__envelope).toBe(true);
        expect(body.data).toEqual([1, 2, 3]);
        expect(body.error).toBeNull();
    });

    it("includes meta when provided", async () => {
        const res = jsonEnvelope(["a"], { page: 2, pageSize: 10, total: 25 });
        const body = await res.json();
        expect(body.meta).toEqual({ page: 2, pageSize: 10, total: 25 });
    });

    it("sets meta to null when not provided", async () => {
        const res = jsonEnvelope({ id: "1" });
        const body = await res.json();
        expect(body.meta).toBeNull();
    });

    it("defaults to status 200", async () => {
        const res = jsonEnvelope({});
        expect(res.status).toBe(200);
    });

    it("accepts custom status code", async () => {
        const res = jsonEnvelope({}, undefined, 201);
        expect(res.status).toBe(201);
    });
});
