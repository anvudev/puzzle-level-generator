import { describe, it, expect } from "vitest";
import {
  getConnectedBlocks,
  canMoveGroup,
  moveBlockGroup,
  findClosestValidPosition,
  indexToPosition,
  positionToIndex,
  positionsEqual,
} from "@/lib/utils/block-group-utils";
import type { BoardCell } from "@/config/game-types";

// Helper function to create a test board
function createTestBoard(width: number, height: number): BoardCell[][] {
  return Array(height)
    .fill(null)
    .map(() =>
      Array(width)
        .fill(null)
        .map(() => ({
          type: "empty" as const,
          color: null,
          element: null,
        }))
    );
}

// Helper function to place blocks on board
function placeBlock(
  board: BoardCell[][],
  x: number,
  y: number,
  color: string = "red"
): void {
  board[y][x] = {
    type: "block",
    color,
    element: null,
  };
}

describe("block-group-utils", () => {
  describe("getConnectedBlocks", () => {
    it("should return empty array for empty cell", () => {
      const board = createTestBoard(3, 3);
      const result = getConnectedBlocks(board, 1, 1);
      expect(result).toEqual([]);
    });

    it("should return single block for isolated block", () => {
      const board = createTestBoard(3, 3);
      placeBlock(board, 1, 1);

      const result = getConnectedBlocks(board, 1, 1);
      expect(result).toEqual([{ x: 1, y: 1 }]);
    });

    it("should return connected horizontal blocks", () => {
      const board = createTestBoard(5, 3);
      placeBlock(board, 1, 1);
      placeBlock(board, 2, 1);
      placeBlock(board, 3, 1);

      const result = getConnectedBlocks(board, 1, 1);
      expect(result).toHaveLength(3);
      expect(result).toContainEqual({ x: 1, y: 1 });
      expect(result).toContainEqual({ x: 2, y: 1 });
      expect(result).toContainEqual({ x: 3, y: 1 });
    });

    it("should return connected L-shaped blocks", () => {
      const board = createTestBoard(4, 4);
      placeBlock(board, 1, 1);
      placeBlock(board, 2, 1);
      placeBlock(board, 2, 2);
      placeBlock(board, 2, 3);

      const result = getConnectedBlocks(board, 1, 1);
      expect(result).toHaveLength(4);
      expect(result).toContainEqual({ x: 1, y: 1 });
      expect(result).toContainEqual({ x: 2, y: 1 });
      expect(result).toContainEqual({ x: 2, y: 2 });
      expect(result).toContainEqual({ x: 2, y: 3 });
    });

    it("should not include diagonal connections", () => {
      const board = createTestBoard(3, 3);
      placeBlock(board, 0, 0);
      placeBlock(board, 1, 1);
      placeBlock(board, 2, 2);

      const result = getConnectedBlocks(board, 0, 0);
      expect(result).toEqual([{ x: 0, y: 0 }]);
    });
  });

  describe("canMoveGroup", () => {
    it("should allow moving to empty space", () => {
      const board = createTestBoard(5, 5);
      placeBlock(board, 1, 1);
      placeBlock(board, 2, 1);

      const group = [
        { x: 1, y: 1 },
        { x: 2, y: 1 },
      ];
      const result = canMoveGroup(board, group, 1, 1);
      expect(result).toBe(true);
    });

    it("should not allow moving out of bounds", () => {
      const board = createTestBoard(3, 3);
      placeBlock(board, 1, 1);

      const group = [{ x: 1, y: 1 }];
      const result = canMoveGroup(board, group, 5, 5);
      expect(result).toBe(false);
    });

    it("should not allow moving to occupied space", () => {
      const board = createTestBoard(5, 5);
      placeBlock(board, 1, 1);
      placeBlock(board, 3, 3); // Obstacle

      const group = [{ x: 1, y: 1 }];
      const result = canMoveGroup(board, group, 2, 2);
      expect(result).toBe(false);
    });

    it("should allow moving within the same group", () => {
      const board = createTestBoard(5, 5);
      placeBlock(board, 1, 1);
      placeBlock(board, 2, 1);

      const group = [
        { x: 1, y: 1 },
        { x: 2, y: 1 },
      ];
      const result = canMoveGroup(board, group, 1, 0);
      expect(result).toBe(true);
    });
  });

  describe("moveBlockGroup", () => {
    it("should move group to new position", () => {
      const board = createTestBoard(5, 5);
      placeBlock(board, 1, 1, "red");
      placeBlock(board, 2, 1, "blue");

      const group = [
        { x: 1, y: 1 },
        { x: 2, y: 1 },
      ];
      const result = moveBlockGroup(board, group, 1, 1);

      // Original positions should be empty
      expect(result[1][1].type).toBe("empty");
      expect(result[1][2].type).toBe("empty");

      // New positions should have the blocks
      expect(result[2][2].type).toBe("block");
      expect(result[2][2].color).toBe("red");
      expect(result[2][3].type).toBe("block");
      expect(result[2][3].color).toBe("blue");
    });

    it("should return original board if move is invalid", () => {
      const board = createTestBoard(3, 3);
      placeBlock(board, 1, 1);

      const group = [{ x: 1, y: 1 }];
      const result = moveBlockGroup(board, group, 5, 5);

      expect(result).toBe(board);
    });
  });

  describe("utility functions", () => {
    it("should convert position to index correctly", () => {
      expect(positionToIndex(0, 0, 5)).toBe(0);
      expect(positionToIndex(2, 1, 5)).toBe(7);
      expect(positionToIndex(4, 2, 5)).toBe(14);
    });

    it("should convert index to position correctly", () => {
      expect(indexToPosition(0, 5)).toEqual({ x: 0, y: 0 });
      expect(indexToPosition(7, 5)).toEqual({ x: 2, y: 1 });
      expect(indexToPosition(14, 5)).toEqual({ x: 4, y: 2 });
    });

    it("should check position equality correctly", () => {
      expect(positionsEqual({ x: 1, y: 2 }, { x: 1, y: 2 })).toBe(true);
      expect(positionsEqual({ x: 1, y: 2 }, { x: 2, y: 1 })).toBe(false);
    });
  });

  describe("findClosestValidPosition", () => {
    it("should find exact position if valid", () => {
      const board = createTestBoard(5, 5);
      placeBlock(board, 1, 1);

      const group = [{ x: 1, y: 1 }];
      const result = findClosestValidPosition(board, group, 3, 3);

      expect(result).toEqual({ deltaX: 2, deltaY: 2 });
    });

    it("should find nearby position if exact is invalid", () => {
      const board = createTestBoard(5, 5);
      placeBlock(board, 1, 1);
      placeBlock(board, 3, 3); // Obstacle at target

      const group = [{ x: 1, y: 1 }];
      const result = findClosestValidPosition(board, group, 3, 3);

      expect(result).not.toBeNull();
      // Should find a nearby valid position, not necessarily exact
      expect(Math.abs(result!.deltaX - 2)).toBeLessThanOrEqual(1);
      expect(Math.abs(result!.deltaY - 2)).toBeLessThanOrEqual(1);
    });

    it("should handle edge case when no movement needed", () => {
      const board = createTestBoard(3, 3);
      placeBlock(board, 1, 1);

      const group = [{ x: 1, y: 1 }];
      const result = findClosestValidPosition(board, group, 1, 1);

      // Should return no movement needed
      expect(result).toEqual({ deltaX: 0, deltaY: 0 });
    });
  });
});
