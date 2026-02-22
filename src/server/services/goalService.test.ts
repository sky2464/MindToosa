import { vi, describe, it, expect, beforeEach } from "vitest";
import { goalService } from "./goalService";
import { AppError, ValidationError } from "@/lib/errors";

// Mock DB chain
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockSingle = vi.fn();

const mockChain = {
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
  eq: mockEq,
  order: mockOrder,
  single: mockSingle,
} as any;

// Setup chainable returns
mockSelect.mockReturnValue(mockChain);
mockInsert.mockReturnValue(mockChain);
mockUpdate.mockReturnValue(mockChain);
mockDelete.mockReturnValue(mockChain);
mockEq.mockReturnValue(mockChain);
mockOrder.mockReturnValue(mockChain);
mockSingle.mockReturnValue(mockChain);

vi.mock("@/server/db", () => ({
  db: {
    from: vi.fn(() => mockChain),
  },
}));

describe("goalService", () => {
  const userId = "user-123";
  const goalId = "123e4567-e89b-12d3-a456-426614174000"; // Valid UUID

  beforeEach(() => {
    vi.resetAllMocks();

    // Re-setup chainable returns because resetAllMocks clears them
    mockSelect.mockReturnValue(mockChain);
    mockInsert.mockReturnValue(mockChain);
    mockUpdate.mockReturnValue(mockChain);
    mockDelete.mockReturnValue(mockChain);
    mockEq.mockReturnValue(mockChain);
    mockOrder.mockReturnValue(mockChain);
    mockSingle.mockReturnValue(mockChain);
  });

  describe("getGoals", () => {
    it("should fetch goals successfully", async () => {
      const mockGoals = [{ id: "1", title: "Goal 1" }];
      // Mock order().then returning data
      mockOrder.mockResolvedValueOnce({ data: mockGoals, error: null });

      const result = await goalService.getGoals(userId);
      expect(result).toEqual(mockGoals);
      expect(mockEq).toHaveBeenCalledWith("user_id", userId);
    });

    it("should throw AppError on DB error", async () => {
      mockOrder.mockResolvedValueOnce({ data: null, error: { message: "DB Error" } });

      await expect(goalService.getGoals(userId)).rejects.toThrow(AppError);
    });
  });

  describe("createGoal", () => {
    it("should throw ValidationError on invalid data", async () => {
      const invalidData = { title: "" }; // Title required
      await expect(goalService.createGoal(userId, invalidData)).rejects.toThrow(ValidationError);
    });

    it("should create goal successfully", async () => {
      // Include all required fields, especially space_id
      const validData = {
        title: "New Goal",
        horizon: "year" as const,
        space_id: "123e4567-e89b-12d3-a456-426614174001",
      };
      const createdGoal = { id: goalId, ...validData, user_id: userId };

      mockSingle.mockResolvedValueOnce({ data: createdGoal, error: null });

      const result = await goalService.createGoal(userId, validData);
      expect(result).toEqual(createdGoal);
    });
  });

  describe("updateGoal", () => {
    it("should validate UUID", async () => {
      await expect(goalService.updateGoal(userId, "invalid-uuid", {})).rejects.toThrow(
        ValidationError
      );
    });

    it("should update goal successfully", async () => {
      const updates = { title: "Updated Goal" };
      const updatedGoal = { id: goalId, title: "Updated Goal", user_id: userId };

      // We need to ensure update mock returns the updated goal
      mockSingle.mockResolvedValueOnce({ data: updatedGoal, error: null });

      const result = await goalService.updateGoal(userId, goalId, updates);
      expect(result).toEqual(updatedGoal);
    });
  });
});
