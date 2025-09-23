import { describe, it, expect } from "vitest";
import { generateCSVMatrix } from "@/lib/utils/level-utils";
import type { GeneratedLevel, BoardCell } from "@/config/game-types";

describe("CSV Matrix Export - Simple Test", () => {
  // Helper function to create a test level
  const createTestLevel = (board: BoardCell[][]): GeneratedLevel => ({
    id: "test-level-123",
    timestamp: new Date("2024-01-01T00:00:00Z"),
    config: {
      width: board[0].length,
      height: board.length,
      blockCount: 10,
      colorCount: 3,
      selectedColors: ["Red", "Blue", "Green"],
      elements: { Pipe: 2 },
    },
    board,
    containers: [],
    difficultyScore: 75,
    solvable: true,
  });

  it("should export 2x2 matrix correctly", () => {
    const board: BoardCell[][] = [
      [
        { type: "wall", color: null, element: null },
        { type: "block", color: "Red", element: null },
      ],
      [
        { type: "empty", color: null, element: null },
        { type: "block", color: "Blue", element: null },
      ],
    ];

    const level = createTestLevel(board);
    const csv = generateCSVMatrix(level);
    const lines = csv.split("\n");

    // Should have 2 rows (2x2 matrix)
    expect(lines).toHaveLength(2);

    // Each row should have 2 cells
    expect(lines[0].split('","')).toHaveLength(2);
    expect(lines[1].split('","')).toHaveLength(2);

    console.log("CSV Output:");
    console.log(csv);
  });

  it("should export pipe element correctly", () => {
    const board: BoardCell[][] = [
      [
        {
          type: "block",
          color: null,
          element: "Pipe",
          pipeDirection: "right",
          pipeSize: 3,
          pipeContents: ["Red", "Light Blue", "Green"],
        },
      ],
    ];

    const level = createTestLevel(board);
    const csv = generateCSVMatrix(level);
    const lines = csv.split("\n");

    // Should have 1 row with 1 cell
    expect(lines).toHaveLength(1);

    // Parse the JSON from the cell
    const cellJson = lines[0].replace(/^"|"$/g, '').replace(/""/g, '"');
    const cellData = JSON.parse(cellJson);

    expect(cellData).toEqual({
      type: "block",
      color: null,
      element: "Pipe",
      pipeDirection: "right",
      pipeSize: 3,
      pipeContents: ["Red", "Light Blue", "Green"],
    });

    console.log("Pipe CSV Output:");
    console.log(csv);
    console.log("Parsed Cell Data:");
    console.log(cellData);
  });

  it("should export 3x3 matrix with mixed elements", () => {
    const board: BoardCell[][] = [
      [
        { type: "wall", color: null, element: null },
        { type: "block", color: "Red", element: null },
        { type: "empty", color: null, element: null },
      ],
      [
        { type: "block", color: "Blue", element: null },
        {
          type: "block",
          color: null,
          element: "Pipe",
          pipeDirection: "down",
          pipeSize: 2,
          pipeContents: ["Green", "Yellow"],
        },
        { type: "wall", color: null, element: null },
      ],
      [
        { type: "empty", color: null, element: null },
        { type: "block", color: "Green", element: null },
        { type: "wall", color: null, element: null },
      ],
    ];

    const level = createTestLevel(board);
    const csv = generateCSVMatrix(level);
    const lines = csv.split("\n");

    // Should have 3 rows (3x3 matrix)
    expect(lines).toHaveLength(3);

    // Each row should have 3 cells
    lines.forEach((line, index) => {
      const cells = line.split('","');
      expect(cells).toHaveLength(3);
      console.log(`Row ${index}:`, cells.length, "cells");
    });

    console.log("3x3 Matrix CSV Output:");
    console.log(csv);

    // Test parsing the pipe cell (row 1, col 1)
    const row1Cells = lines[1].split('","');
    const pipeCellJson = row1Cells[1].replace(/^"|"$/g, '').replace(/""/g, '"');
    const pipeCellData = JSON.parse(pipeCellJson);

    expect(pipeCellData).toEqual({
      type: "block",
      color: null,
      element: "Pipe",
      pipeDirection: "down",
      pipeSize: 2,
      pipeContents: ["Green", "Yellow"],
    });
  });
});
