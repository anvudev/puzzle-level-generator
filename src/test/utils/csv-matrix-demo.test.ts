import { describe, it, expect } from "vitest";
import { generateCSVMatrix } from "@/lib/utils/level-utils";
import type { GeneratedLevel, BoardCell } from "@/config/game-types";

describe("CSV Matrix Export - Demo", () => {
  // Helper function to create a test level
  const createTestLevel = (board: BoardCell[][]): GeneratedLevel => ({
    id: "test-level-123",
    timestamp: new Date("2024-01-01T00:00:00Z"),
    config: {
      width: board[0].length,
      height: board.length,
      blockCount: 10,
      colorCount: 4,
      selectedColors: ["color_1", "color_2", "color_3", "color_4"],
      colorMapping: {
        color_1: "#ff0000",
        color_2: "#0000ff",
        color_3: "#00ff00",
        color_4: "#ffff00",
      },
      generationMode: "random" as const,
      elements: { Pipe: 2 },
      difficulty: "Normal" as const,
    },
    board,
    containers: [],
    difficultyScore: 75,
    solvable: true,
  });

  it("should demonstrate CSV matrix format", () => {
    const board: BoardCell[][] = [
      [
        { type: "wall", color: null, element: null },
        { type: "block", color: "color_1", element: null },
      ],
      [
        {
          type: "block",
          color: null,
          element: "Pipe",
          pipeDirection: "down",
          pipeSize: 3,
          pipeContents: ["color_3", "color_1", "color_4"],
        },
        { type: "empty", color: null, element: null },
      ],
    ];

    const level = createTestLevel(board);
    const csv = generateCSVMatrix(level);

    console.log("=== CSV Matrix Format Demo ===");
    console.log("Board: 2x2 matrix");
    console.log("CSV Output:");
    console.log(csv);
    console.log("===============================");

    // Basic validation
    const lines = csv.split("\n");
    expect(lines).toHaveLength(2); // 2 rows

    // Parse first cell (wall)
    const firstCell = lines[0].split(",")[0];
    const wallData = JSON.parse(
      firstCell.replace(/^"|"$/g, "").replace(/""/g, '"')
    );
    expect(wallData).toEqual({
      type: "wall",
      color: null,
      element: null,
    });

    // Parse pipe cell (row 1, col 0)
    const pipeCell = lines[1].split(",")[0];
    const pipeData = JSON.parse(
      pipeCell.replace(/^"|"$/g, "").replace(/""/g, '"')
    );
    expect(pipeData).toEqual({
      type: "block",
      color: null,
      element: "Pipe",
      pipeDirection: "down",
      pipeSize: 3,
      pipeContents: ["color_3", "color_1", "color_4"],
    });

    console.log("Wall Cell Data:", wallData);
    console.log("Pipe Cell Data:", pipeData);
  });

  it("should demonstrate 3x3 matrix", () => {
    const board: BoardCell[][] = [
      [
        { type: "wall", color: null, element: null },
        { type: "block", color: "color_1", element: null },
        { type: "wall", color: null, element: null },
      ],
      [
        { type: "block", color: "color_2", element: null },
        {
          type: "block",
          color: null,
          element: "Pipe",
          pipeDirection: "right",
          pipeSize: 2,
          pipeContents: ["color_2", "color_3"],
        },
        { type: "block", color: "color_4", element: null },
      ],
      [
        { type: "empty", color: null, element: null },
        { type: "wall", color: null, element: null },
        { type: "empty", color: null, element: null },
      ],
    ];

    const level = createTestLevel(board);
    const csv = generateCSVMatrix(level);

    console.log("=== 3x3 Matrix Demo ===");
    console.log("CSV Output:");
    console.log(csv);
    console.log("=======================");

    // Basic validation
    const lines = csv.split("\n");
    expect(lines).toHaveLength(3); // 3 rows

    // Each line should represent one row of the matrix
    lines.forEach((line, rowIndex) => {
      console.log(`Row ${rowIndex}:`, line);
    });
  });
});
