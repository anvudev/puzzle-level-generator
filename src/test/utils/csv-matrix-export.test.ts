import { describe, it, expect } from "vitest";
import { generateCSVMatrix } from "@/lib/utils/level-utils";
import type { GeneratedLevel, BoardCell } from "@/config/game-types";

describe("CSV Matrix Export", () => {
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

  // Helper function to parse JSON from CSV cell
  const parseCellJson = (cellString: string) => {
    const cleanJson = cellString.replace(/^"|"$/g, "").replace(/""/g, '"');
    return JSON.parse(cleanJson);
  };

  it("should export simple wall and block cells correctly", () => {
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

    // Should have 2 rows (no header)
    expect(lines).toHaveLength(2);

    // Check first row (2 cells)
    expect(lines[0]).toBe(
      '"{""type"":""wall"",""color"":null,""element"":null}","{""type"":""block"",""color"":""Red"",""element"":null}"'
    );

    // Check second row (2 cells)
    expect(lines[1]).toBe(
      '"{""type"":""empty"",""color"":null,""element"":null}","{""type"":""block"",""color"":""Blue"",""element"":null}"'
    );
  });

  it("should export pipe elements with all properties", () => {
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
    const cellJson = lines[0].replace(/^"|"$/g, "").replace(/""/g, '"');
    const cellData = JSON.parse(cellJson);

    expect(cellData).toEqual({
      type: "block",
      color: null,
      element: "Pipe",
      pipeDirection: "right",
      pipeSize: 3,
      pipeContents: ["Red", "Light Blue", "Green"],
    });
  });

  it("should export lock and key elements", () => {
    const board: BoardCell[][] = [
      [
        {
          type: "block",
          color: "Yellow",
          element: "Lock",
          lockId: "lock-1",
          lockPairNumber: 1,
        },
        {
          type: "block",
          color: "Yellow",
          element: "Key",
          keyId: "lock-1",
          lockPairNumber: 1,
        },
      ],
    ];

    const level = createTestLevel(board);
    const csv = generateCSVMatrix(level);
    const lines = csv.split("\n");

    // Check lock and key rows
    expect(lines[1]).toBe(
      "0,0,block,Yellow,Lock,null,null,null,lock-1,null,1,null,null,null"
    );
    expect(lines[2]).toBe(
      "0,1,block,Yellow,Key,null,null,null,null,lock-1,1,null,null,null"
    );
  });

  it("should export pull pin elements", () => {
    const board: BoardCell[][] = [
      [
        {
          type: "block",
          color: "Gray",
          element: "PullPin",
          pullPinDirection: "up",
          pullPinGateSize: 2,
        },
      ],
    ];

    const level = createTestLevel(board);
    const csv = generateCSVMatrix(level);
    const lines = csv.split("\n");

    // Check pull pin row
    expect(lines[1]).toBe(
      "0,0,block,Gray,PullPin,null,null,null,null,null,null,up,2,null"
    );
  });

  it("should export ice block elements", () => {
    const board: BoardCell[][] = [
      [
        {
          type: "block",
          color: "Light Blue",
          element: "Ice",
          iceCount: 3,
        },
      ],
    ];

    const level = createTestLevel(board);
    const csv = generateCSVMatrix(level);
    const lines = csv.split("\n");

    // Check ice block row
    expect(lines[1]).toBe(
      "0,0,block,Light Blue,Ice,null,null,null,null,null,null,null,null,3"
    );
  });

  it("should handle empty pipe contents correctly", () => {
    const board: BoardCell[][] = [
      [
        {
          type: "block",
          color: null,
          element: "Pipe",
          pipeDirection: "left",
          pipeSize: 0,
          pipeContents: [],
        },
      ],
    ];

    const level = createTestLevel(board);
    const csv = generateCSVMatrix(level);
    const lines = csv.split("\n");

    // Check empty pipe contents
    expect(lines[1]).toBe(
      '0,0,block,null,Pipe,left,0,"",null,null,null,null,null,null'
    );
  });

  it("should export correct number of rows for matrix", () => {
    const board: BoardCell[][] = [
      [
        { type: "wall", color: null, element: null },
        { type: "wall", color: null, element: null },
        { type: "wall", color: null, element: null },
      ],
      [
        { type: "block", color: "Red", element: null },
        { type: "block", color: "Blue", element: null },
        { type: "block", color: "Green", element: null },
      ],
    ];

    const level = createTestLevel(board);
    const csv = generateCSVMatrix(level);
    const lines = csv.split("\n");

    // Should have 2 rows (2x3 matrix)
    expect(lines).toHaveLength(2);

    // Each row should have 3 cells (columns)
    lines.forEach((line) => {
      const cells = line.split('","');
      expect(cells).toHaveLength(3);
    });

    // Check first row has 3 wall cells
    const firstRowCells = lines[0].split('","');
    expect(firstRowCells).toHaveLength(3);

    // Check second row has 3 block cells
    const secondRowCells = lines[1].split('","');
    expect(secondRowCells).toHaveLength(3);
  });
});
