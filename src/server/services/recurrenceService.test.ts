import { describe, it, expect } from "vitest";
import { recurrenceService } from "./recurrenceService";

describe("recurrenceService", () => {
  describe("validateRule", () => {
    it("should return true for valid RFC 5545 strings", () => {
      expect(recurrenceService.validateRule("FREQ=DAILY")).toBe(true);
      expect(recurrenceService.validateRule("FREQ=WEEKLY;BYDAY=MO")).toBe(true);
    });

    it("should return false for invalid strings", () => {
      expect(recurrenceService.validateRule("INVALID")).toBe(false);
      expect(recurrenceService.validateRule("DAILY")).toBe(false);
    });
  });

  describe("getNextDueDate", () => {
    it("should return null for invalid rules", () => {
      const start = new Date();
      const next = recurrenceService.getNextDueDate("INVALID", start);
      expect(next).toBeNull();
    });

    it("should calculate correct next date for daily recurrence", () => {
      // Use NOON UTC to avoid timezone midnight crossing issues in most US/EU zones
      const start = new Date("2024-01-01T12:00:00Z");
      const next = recurrenceService.getNextDueDate("FREQ=DAILY", start);

      expect(next).toBeDefined();
      if (!next) return;

      // Check that it's the next day
      expect(next.getUTCDate()).toBe(2);
      expect(next.getUTCMonth()).toBe(0); // Jan
      expect(next.getUTCFullYear()).toBe(2024);
    });

    it("should calculate correct next date for weekly recurrence", () => {
      const start = new Date("2024-01-01T12:00:00Z"); // Monday
      const next = recurrenceService.getNextDueDate("FREQ=WEEKLY", start);

      expect(next).toBeDefined();
      if (!next) return;

      // Should be +7 days => Jan 8
      expect(next.getUTCDate()).toBe(8);
      expect(next.getUTCMonth()).toBe(0);
    });

    it("should handle specific days (MWF)", () => {
      const start = new Date("2024-01-01T12:00:00Z"); // Monday
      const next = recurrenceService.getNextDueDate("FREQ=WEEKLY;BYDAY=MO,WE,FR", start);

      expect(next).toBeDefined();
      if (!next) return;

      // Next after Monday is Wednesday (Jan 3)
      expect(next.getUTCDate()).toBe(3);
    });

    it("sanity check: raw RRule usage", () => {
      const { RRule } = require("rrule");
      // Use NOON UTC
      const start = new Date("2024-01-01T12:00:00Z");

      // Manually construct options
      const rule = new RRule({
        freq: RRule.DAILY,
        dtstart: start,
      });

      const next = rule.after(start);
      console.log("Sanity Next:", next?.toISOString());

      expect(next).toBeDefined();
      // Should be Jan 2
      expect(next.getUTCDate()).toBe(2);
    });
  });
});
