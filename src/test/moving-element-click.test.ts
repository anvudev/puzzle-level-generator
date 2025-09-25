import { describe, it, expect } from "vitest";
import { ELEMENT_TYPES } from "@/config/game-constants";
import { getElementIcon } from "@/lib/utils/level-utils";
import type { BoardCell, LevelConfig, GeneratedLevel } from "@/config/game-types";

describe("Moving Element Click Functionality", () => {
  describe("Moving element direction cycling", () => {
    it("should cycle through directions correctly", () => {
      // Test direction cycling logic similar to PullPin and Pipe
      const directions: Array<"up" | "down" | "left" | "right"> = [
        "up",
        "right", 
        "down",
        "left",
      ];

      // Test cycling from up -> right
      let currentDirection: "up" | "down" | "left" | "right" = "up";
      let currentIndex = directions.indexOf(currentDirection);
      let nextDirection = directions[(currentIndex + 1) % directions.length];
      expect(nextDirection).toBe("right");

      // Test cycling from right -> down
      currentDirection = "right";
      currentIndex = directions.indexOf(currentDirection);
      nextDirection = directions[(currentIndex + 1) % directions.length];
      expect(nextDirection).toBe("down");

      // Test cycling from down -> left
      currentDirection = "down";
      currentIndex = directions.indexOf(currentDirection);
      nextDirection = directions[(currentIndex + 1) % directions.length];
      expect(nextDirection).toBe("left");

      // Test cycling from left -> up (full cycle)
      currentDirection = "left";
      currentIndex = directions.indexOf(currentDirection);
      nextDirection = directions[(currentIndex + 1) % directions.length];
      expect(nextDirection).toBe("up");
    });

    it("should handle undefined direction by defaulting to up", () => {
      const directions: Array<"up" | "down" | "left" | "right"> = [
        "up",
        "right",
        "down", 
        "left",
      ];

      // When movingDirection is undefined, it should default to "up"
      const currentDirection = undefined;
      const currentIndex = directions.indexOf(currentDirection || "up");
      const nextDirection = directions[(currentIndex + 1) % directions.length];
      
      expect(currentIndex).toBe(0); // "up" is at index 0
      expect(nextDirection).toBe("right");
    });
  });

  describe("Moving element board update logic", () => {
    it("should update board with new moving direction", () => {
      // Create a mock board with a Moving element
      const mockBoard: BoardCell[][] = [
        [
          { type: "empty", color: null, element: null },
          { type: "block", color: "1", element: "Moving", movingDirection: "up", movingDistance: 3 },
          { type: "empty", color: null, element: null },
        ],
        [
          { type: "block", color: "2", element: null },
          { type: "block", color: "3", element: null },
          { type: "block", color: "1", element: null },
        ],
      ];

      const mockLevel: GeneratedLevel = {
        id: "test-level",
        config: {
          name: "Test Level",
          width: 3,
          height: 2,
          blockCount: 4,
          colorCount: 3,
          selectedColors: ["1", "2", "3"],
          colorMapping: { "1": "#ff0000", "2": "#00ff00", "3": "#0000ff" },
          generationMode: "random",
          elements: { Moving: 1 },
          difficulty: "Normal",
        },
        board: mockBoard,
        containers: [],
        difficultyScore: 1,
        solvable: true,
        timestamp: new Date(),
      };

      // Simulate clicking on the Moving element (index 1 in flattened array)
      const index = 1; // Position [0][1]
      const row = Math.floor(index / mockLevel.config.width); // 0
      const col = index % mockLevel.config.width; // 1
      const cell = mockLevel.board[row][col];

      expect(cell.element).toBe("Moving");
      expect(cell.movingDirection).toBe("up");

      // Simulate direction change logic
      const directions: Array<"up" | "down" | "left" | "right"> = [
        "up",
        "right",
        "down",
        "left",
      ];
      const currentIndex = directions.indexOf(cell.movingDirection || "up");
      const nextDirection = directions[(currentIndex + 1) % directions.length];

      // Update the board with new direction
      const newBoard = mockLevel.board.map((boardRow, rowIndex) =>
        boardRow.map((boardCell, colIndex) => {
          if (rowIndex === row && colIndex === col) {
            return {
              ...boardCell,
              movingDirection: nextDirection,
            };
          }
          return boardCell;
        })
      );

      // Verify the update
      expect(newBoard[row][col].movingDirection).toBe("right");
      expect(newBoard[row][col].movingDistance).toBe(3); // Should preserve other properties
      expect(newBoard[row][col].element).toBe("Moving");

      // Verify other cells are unchanged
      expect(newBoard[0][0]).toEqual(mockBoard[0][0]);
      expect(newBoard[0][2]).toEqual(mockBoard[0][2]);
      expect(newBoard[1][0]).toEqual(mockBoard[1][0]);
    });
  });

  describe("Moving element configuration", () => {
    it("should have correct element type configuration", () => {
      expect(ELEMENT_TYPES.Moving).toBeDefined();
      expect(ELEMENT_TYPES.Moving.name).toBe("Moving");
      expect(ELEMENT_TYPES.Moving.points).toBe(1.5);
      expect(ELEMENT_TYPES.Moving.description).toContain("kích hoạt khi pick block liên quan");
    });

    it("should have correct icon", () => {
      const icon = getElementIcon("Moving");
      expect(icon).toBe("⏫");
    });
  });

  describe("Moving element properties", () => {
    it("should support all required properties", () => {
      const movingCell: BoardCell = {
        type: "block",
        color: "1",
        element: "Moving",
        movingDirection: "up",
        movingDistance: 5,
      };

      expect(movingCell.element).toBe("Moving");
      expect(movingCell.movingDirection).toBe("up");
      expect(movingCell.movingDistance).toBe(5);
    });

    it("should support all valid directions", () => {
      const validDirections: Array<"up" | "down" | "left" | "right"> = [
        "up",
        "down", 
        "left",
        "right",
      ];

      validDirections.forEach((direction) => {
        const movingCell: BoardCell = {
          type: "block",
          color: "1", 
          element: "Moving",
          movingDirection: direction,
          movingDistance: 3,
        };

        expect(movingCell.movingDirection).toBe(direction);
      });
    });
  });
});
