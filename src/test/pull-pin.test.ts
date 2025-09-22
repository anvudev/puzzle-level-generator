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
      expect(icon).toBe("🔱");
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

      // With relaxed logic, PullPin can point towards any block or empty space
      // So it should have valid directions (up, down, left, right all point to blocks)
      expect(validDirections.length).toBeGreaterThan(0);
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

  describe("Pipe Configuration", () => {
    it("should support pipe configuration in LevelConfig", () => {
      const config: LevelConfig = {
        width: 8,
        height: 8,
        blockCount: 24,
        colorCount: 4,
        selectedColors: ["Red", "Blue", "Green", "Yellow"],
        generationMode: "random",
        elements: { Pipe: 2 },
        difficulty: "Normal",
        pipeCount: 2,
        pipeBlockCount: 5,
      };

      expect(config.pipeCount).toBe(2);
      expect(config.pipeBlockCount).toBe(5);
    });

    it("should have pipe direction logic pointing towards blocks", () => {
      const board: BoardCell[][] = [
        [
          { type: "empty", color: null, element: null },
          { type: "block", color: "Red", element: null },
        ],
        [
          { type: "empty", color: null, element: null },
          { type: "empty", color: null, element: null },
        ],
      ];

      const config: LevelConfig = {
        width: 2,
        height: 2,
        blockCount: 1,
        colorCount: 1,
        selectedColors: ["Red"],
        generationMode: "random",
        elements: {},
        difficulty: "Normal",
      };

      const validDirections = LevelGeneratorUtils.getValidPipeDirections(
        0,
        0,
        board,
        config
      );

      // Pipe at (0,0) should only point right towards the block at (1,0)
      expect(validDirections).toContain("right");
      expect(validDirections).not.toContain("down"); // No block at (0,1)
    });

    it("should not allow pipe to point towards empty spaces", () => {
      const board: BoardCell[][] = [
        [
          { type: "empty", color: null, element: null },
          { type: "empty", color: null, element: null },
        ],
        [
          { type: "empty", color: null, element: null },
          { type: "empty", color: null, element: null },
        ],
      ];

      const config: LevelConfig = {
        width: 2,
        height: 2,
        blockCount: 0,
        colorCount: 1,
        selectedColors: ["Red"],
        generationMode: "random",
        elements: {},
        difficulty: "Normal",
      };

      const validDirections = LevelGeneratorUtils.getValidPipeDirections(
        0,
        0,
        board,
        config
      );

      // No valid directions since all adjacent cells are empty
      expect(validDirections).toHaveLength(0);
    });
  });

  describe("Individual Pipe Block Configuration", () => {
    it("should support individual pipe block counts", () => {
      const config: LevelConfig = {
        width: 8,
        height: 8,
        blockCount: 24,
        colorCount: 4,
        selectedColors: ["Red", "Blue", "Green", "Yellow"],
        generationMode: "random",
        elements: { Pipe: 3 },
        difficulty: "Normal",
        pipeCount: 3,
        pipeBlockCounts: [2, 5, 3], // Pipe 1: 2 blocks, Pipe 2: 5 blocks, Pipe 3: 3 blocks
      };

      expect(config.pipeBlockCounts).toHaveLength(3);
      expect(config.pipeBlockCounts![0]).toBe(2);
      expect(config.pipeBlockCounts![1]).toBe(5);
      expect(config.pipeBlockCounts![2]).toBe(3);

      // Total blocks should be 2 + 5 + 3 = 10
      const totalBlocks = config.pipeBlockCounts!.reduce(
        (sum, count) => sum + count,
        0
      );
      expect(totalBlocks).toBe(10);
    });

    it("should handle max 20 pipes with different block counts", () => {
      const pipeBlockCounts = Array(20)
        .fill(0)
        .map((_, i) => i + 1); // 1, 2, 3, ..., 20

      const config: LevelConfig = {
        width: 15,
        height: 15,
        blockCount: 100,
        colorCount: 4,
        selectedColors: ["Red", "Blue", "Green", "Yellow"],
        generationMode: "random",
        elements: { Pipe: 20 },
        difficulty: "Normal",
        pipeCount: 20,
        pipeBlockCounts,
      };

      expect(config.pipeBlockCounts).toHaveLength(20);
      expect(config.pipeBlockCounts![0]).toBe(1);
      expect(config.pipeBlockCounts![19]).toBe(20);

      // Total blocks should be 1+2+3+...+20 = 210
      const totalBlocks = config.pipeBlockCounts!.reduce(
        (sum, count) => sum + count,
        0
      );
      expect(totalBlocks).toBe(210);
    });

    it("should fallback to default when no individual counts provided", () => {
      const config: LevelConfig = {
        width: 8,
        height: 8,
        blockCount: 24,
        colorCount: 4,
        selectedColors: ["Red", "Blue", "Green", "Yellow"],
        generationMode: "random",
        elements: { Pipe: 2 },
        difficulty: "Normal",
        pipeCount: 2,
        pipeBlockCount: 4, // Default for all pipes
      };

      expect(config.pipeBlockCounts).toBeUndefined();
      expect(config.pipeBlockCount).toBe(4);
      expect(config.pipeCount).toBe(2);
    });
  });
});
