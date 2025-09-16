import { describe, it, expect } from "vitest";
import { ELEMENT_TYPES } from "@/config/game-constants";
import { getElementIcon } from "@/lib/utils/level-utils";
import { LevelGeneratorUtils } from "@/lib/generators/level-generator-utils";
import type { BoardCell, LevelConfig } from "@/config/game-types";

describe("Pull Pin Implementation", () => {
  describe("Game Constants", () => {
    it("should have PullPin element defined", () => {
      expect(ELEMENT_TYPES.PullPin).toBeDefined();
      expect(ELEMENT_TYPES.PullPin.name).toBe("Pull Pin");
      expect(ELEMENT_TYPES.PullPin.points).toBe(5);
    });

    it("should not have BarrierLock element", () => {
      expect(ELEMENT_TYPES.BarrierLock).toBeUndefined();
    });

    it("should have correct Pull Pin description", () => {
      const description = ELEMENT_TYPES.PullPin.description;
      expect(description).toContain("tường cứng");
      expect(description).toContain("có hướng như pipe");
      expect(description).toContain("1-3 ô trống");
      expect(description).toContain("cổng");
    });
  });

  describe("Visual Icons", () => {
    it("should have Pull Pin icon", () => {
      const icon = getElementIcon("PullPin");
      expect(icon).toBe("📍");
    });

    it("should not have BarrierLock icon", () => {
      const icon = getElementIcon("BarrierLock");
      expect(icon).toBe("⬜"); // Default icon for unknown elements
    });
  });

  describe("Pull Pin Direction Validation", () => {
    const mockConfig: LevelConfig = {
      width: 5,
      height: 5,
      blockCount: 10,
      colorCount: 3,
      selectedColors: ["Red", "Blue", "Green"],
      generationMode: "random",
      elements: { PullPin: 1 },
      difficulty: "Normal",
    };

    it("should validate Pull Pin directions correctly", () => {
      // Create a board with empty spaces for gate creation
      const board: BoardCell[][] = Array(5)
        .fill(null)
        .map(() =>
          Array(5)
            .fill(null)
            .map(() => ({
              type: "empty" as const,
              color: null,
              element: null,
            }))
        );

      // Place a Pull Pin at center
      board[2][2] = {
        type: "block",
        color: null,
        element: "PullPin",
      };

      const validDirections = LevelGeneratorUtils.getValidPullPinDirections(
        2,
        2,
        board,
        mockConfig
      );

      // Should have all 4 directions valid since there's space for gates
      expect(validDirections).toHaveLength(4);
      expect(validDirections).toContain("up");
      expect(validDirections).toContain("down");
      expect(validDirections).toContain("left");
      expect(validDirections).toContain("right");
    });

    it("should reject directions with no space for gate", () => {
      // Create a board with blocks blocking gate creation
      const board: BoardCell[][] = Array(5)
        .fill(null)
        .map(() =>
          Array(5)
            .fill(null)
            .map(() => ({
              type: "block" as const,
              color: "Red",
              element: null,
            }))
        );

      // Place a Pull Pin at center
      board[2][2] = {
        type: "block",
        color: null,
        element: "PullPin",
      };

      const validDirections = LevelGeneratorUtils.getValidPullPinDirections(
        2,
        2,
        board,
        mockConfig
      );

      // Should have no valid directions since all adjacent cells are blocked
      expect(validDirections).toHaveLength(0);
    });

    it("should handle edge cases near board boundaries", () => {
      const board: BoardCell[][] = Array(5)
        .fill(null)
        .map(() =>
          Array(5)
            .fill(null)
            .map(() => ({
              type: "empty" as const,
              color: null,
              element: null,
            }))
        );

      // Place a Pull Pin at top-left corner
      board[0][0] = {
        type: "block",
        color: null,
        element: "PullPin",
      };

      const validDirections = LevelGeneratorUtils.getValidPullPinDirections(
        0,
        0,
        board,
        mockConfig
      );

      // Should only have right and down directions valid
      expect(validDirections).toHaveLength(2);
      expect(validDirections).toContain("right");
      expect(validDirections).toContain("down");
      expect(validDirections).not.toContain("up");
      expect(validDirections).not.toContain("left");
    });
  });

  describe("BoardCell Type Definitions", () => {
    it("should support Pull Pin direction properties", () => {
      const cell: BoardCell = {
        type: "block",
        color: null,
        element: "PullPin",
        pullPinDirection: "up",
        pullPinGateSize: 2,
      };

      expect(cell.pullPinDirection).toBe("up");
      expect(cell.pullPinGateSize).toBe(2);
    });

    it("should support all direction types", () => {
      const directions: Array<BoardCell["pullPinDirection"]> = [
        "up",
        "down",
        "left",
        "right",
      ];

      directions.forEach((direction) => {
        const cell: BoardCell = {
          type: "block",
          color: null,
          element: "PullPin",
          pullPinDirection: direction,
          pullPinGateSize: 1,
        };

        expect(cell.pullPinDirection).toBe(direction);
      });
    });
  });

  describe("Game Mechanics Preservation", () => {
    it("should maintain 5-point scoring system", () => {
      expect(ELEMENT_TYPES.PullPin.points).toBe(5);
    });

    it("should preserve core barrier functionality in description", () => {
      const description = ELEMENT_TYPES.PullPin.description;

      // Should maintain core barrier mechanics
      expect(description).toContain("tường cứng");
      expect(description).toContain("đầu–đuôi");
      expect(description).toContain("chắn thẳng đến hết cột hoặc hết dòng");
      expect(description).toContain("kẹp");
      expect(description).toContain("không thể tiếp cận mục tiêu/Key");
    });

    it("should add new directional behavior", () => {
      const description = ELEMENT_TYPES.PullPin.description;

      // Should add new Pull Pin specific features
      expect(description).toContain("có hướng như pipe");
      expect(description).toContain("1-3 ô trống");
      expect(description).toContain("cổng");
      expect(description).toContain("lối mở");
    });
  });
});
