import { describe, it, expect, vi } from "vitest";
import type { GeneratedLevel } from "@/config/game-types";

describe("Moving Element Integration Test", () => {
  // Mock the handleMovingClick function logic
  const simulateMovingClick = (
    level: GeneratedLevel,
    index: number,
    onLevelUpdate: (updatedLevel: GeneratedLevel) => void
  ) => {
    const row = Math.floor(index / level.config.width);
    const col = index % level.config.width;
    const cell = level.board[row][col];

    if (cell.element === "Moving") {
      // Cycle through directions: up -> right -> down -> left -> up
      const directions: Array<"up" | "down" | "left" | "right"> = [
        "up",
        "right",
        "down",
        "left",
      ];
      const currentIndex = directions.indexOf(cell.movingDirection || "up");
      const nextDirection = directions[(currentIndex + 1) % directions.length];

      // Update the board with new direction
      const newBoard = level.board.map((boardRow, rowIndex) =>
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

      // Update the level
      const updatedLevel = {
        ...level,
        board: newBoard,
      };

      onLevelUpdate(updatedLevel);
    }
  };

  it("should handle Moving element click and update direction", () => {
    // Create a test level with Moving element
    const testLevel: GeneratedLevel = {
      id: "test-moving-level",
      config: {
        name: "Test Moving Level",
        width: 4,
        height: 4,
        blockCount: 8,
        colorCount: 3,
        selectedColors: ["1", "2", "3"],
        colorMapping: { "1": "#ff0000", "2": "#00ff00", "3": "#0000ff" },
        generationMode: "random",
        elements: { Moving: 1 },
        difficulty: "Normal",
      },
      board: [
        [
          { type: "block", color: "1", element: null },
          {
            type: "block",
            color: "2",
            element: "Moving",
            movingDirection: "up",
            movingDistance: 3,
          },
          { type: "block", color: "3", element: null },
          { type: "empty", color: null, element: null },
        ],
        [
          { type: "block", color: "2", element: null },
          { type: "block", color: "1", element: null },
          { type: "block", color: "3", element: null },
          { type: "empty", color: null, element: null },
        ],
        [
          { type: "block", color: "3", element: null },
          { type: "block", color: "2", element: null },
          { type: "empty", color: null, element: null },
          { type: "empty", color: null, element: null },
        ],
        [
          { type: "empty", color: null, element: null },
          { type: "empty", color: null, element: null },
          { type: "empty", color: null, element: null },
          { type: "empty", color: null, element: null },
        ],
      ],
      containers: [],
      difficultyScore: 2,
      solvable: true,
      timestamp: new Date(),
    };

    // Mock the onLevelUpdate callback
    const mockOnLevelUpdate = vi.fn();

    // Moving element is at position [0][1], which is index 1 in flattened array
    const movingElementIndex = 1;

    // Verify initial state
    expect(testLevel.board[0][1].element).toBe("Moving");
    expect(testLevel.board[0][1].movingDirection).toBe("up");

    // Simulate first click (up -> right)
    simulateMovingClick(testLevel, movingElementIndex, mockOnLevelUpdate);

    // Verify the callback was called
    expect(mockOnLevelUpdate).toHaveBeenCalledTimes(1);

    // Get the updated level from the callback
    const firstUpdate = mockOnLevelUpdate.mock.calls[0][0] as GeneratedLevel;
    expect(firstUpdate.board[0][1].movingDirection).toBe("right");
    expect(firstUpdate.board[0][1].element).toBe("Moving");
    expect(firstUpdate.board[0][1].movingDistance).toBe(3); // Should preserve distance

    // Simulate second click (right -> down)
    simulateMovingClick(firstUpdate, movingElementIndex, mockOnLevelUpdate);
    expect(mockOnLevelUpdate).toHaveBeenCalledTimes(2);

    const secondUpdate = mockOnLevelUpdate.mock.calls[1][0] as GeneratedLevel;
    expect(secondUpdate.board[0][1].movingDirection).toBe("down");

    // Simulate third click (down -> left)
    simulateMovingClick(secondUpdate, movingElementIndex, mockOnLevelUpdate);
    expect(mockOnLevelUpdate).toHaveBeenCalledTimes(3);

    const thirdUpdate = mockOnLevelUpdate.mock.calls[2][0] as GeneratedLevel;
    expect(thirdUpdate.board[0][1].movingDirection).toBe("left");

    // Simulate fourth click (left -> up, completing the cycle)
    simulateMovingClick(thirdUpdate, movingElementIndex, mockOnLevelUpdate);
    expect(mockOnLevelUpdate).toHaveBeenCalledTimes(4);

    const fourthUpdate = mockOnLevelUpdate.mock.calls[3][0] as GeneratedLevel;
    expect(fourthUpdate.board[0][1].movingDirection).toBe("up");
  });

  it("should not affect other cells when clicking Moving element", () => {
    const testLevel: GeneratedLevel = {
      id: "test-isolation",
      config: {
        name: "Test Isolation",
        width: 3,
        height: 3,
        blockCount: 5,
        colorCount: 2,
        selectedColors: ["1", "2"],
        colorMapping: { "1": "#ff0000", "2": "#00ff00" },
        generationMode: "random",
        elements: { Moving: 1 },
        difficulty: "Normal",
      },
      board: [
        [
          { type: "block", color: "1", element: null },
          {
            type: "block",
            color: "2",
            element: "Moving",
            movingDirection: "up",
            movingDistance: 4,
          },
          { type: "block", color: "1", element: null },
        ],
        [
          { type: "block", color: "2", element: null },
          { type: "empty", color: null, element: null },
          { type: "block", color: "1", element: null },
        ],
        [
          { type: "empty", color: null, element: null },
          { type: "empty", color: null, element: null },
          { type: "empty", color: null, element: null },
        ],
      ],
      containers: [],
      difficultyScore: 1,
      solvable: true,
      timestamp: new Date(),
    };

    const mockOnLevelUpdate = vi.fn();
    const movingElementIndex = 1; // Position [0][1]

    // Store original state of other cells
    const originalCells = {
      topLeft: { ...testLevel.board[0][0] },
      topRight: { ...testLevel.board[0][2] },
      middleLeft: { ...testLevel.board[1][0] },
      middleCenter: { ...testLevel.board[1][1] },
      middleRight: { ...testLevel.board[1][2] },
    };

    // Click the Moving element
    simulateMovingClick(testLevel, movingElementIndex, mockOnLevelUpdate);

    const updatedLevel = mockOnLevelUpdate.mock.calls[0][0] as GeneratedLevel;

    // Verify only the Moving element changed
    expect(updatedLevel.board[0][1].movingDirection).toBe("right"); // Changed
    expect(updatedLevel.board[0][1].element).toBe("Moving"); // Unchanged

    // Verify other cells are unchanged
    expect(updatedLevel.board[0][0]).toEqual(originalCells.topLeft);
    expect(updatedLevel.board[0][2]).toEqual(originalCells.topRight);
    expect(updatedLevel.board[1][0]).toEqual(originalCells.middleLeft);
    expect(updatedLevel.board[1][1]).toEqual(originalCells.middleCenter);
    expect(updatedLevel.board[1][2]).toEqual(originalCells.middleRight);
  });

  it("should handle Moving element with undefined direction", () => {
    const testLevel: GeneratedLevel = {
      id: "test-undefined-direction",
      config: {
        name: "Test Undefined Direction",
        width: 2,
        height: 2,
        blockCount: 2,
        colorCount: 1,
        selectedColors: ["1"],
        colorMapping: { "1": "#ff0000" },
        generationMode: "random",
        elements: { Moving: 1 },
        difficulty: "Normal",
      },
      board: [
        [
          { type: "block", color: "1", element: "Moving", movingDistance: 3 }, // No movingDirection
          { type: "block", color: "1", element: null },
        ],
        [
          { type: "empty", color: null, element: null },
          { type: "empty", color: null, element: null },
        ],
      ],
      containers: [],
      difficultyScore: 1,
      solvable: true,
      timestamp: new Date(),
    };

    const mockOnLevelUpdate = vi.fn();
    const movingElementIndex = 0; // Position [0][0]

    // Verify initial state has undefined direction
    expect(testLevel.board[0][0].movingDirection).toBeUndefined();

    // Click the Moving element
    simulateMovingClick(testLevel, movingElementIndex, mockOnLevelUpdate);

    const updatedLevel = mockOnLevelUpdate.mock.calls[0][0] as GeneratedLevel;

    // Should default to "up" and then cycle to "right"
    expect(updatedLevel.board[0][0].movingDirection).toBe("right");
  });
});
