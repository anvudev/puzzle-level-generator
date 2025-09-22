import { describe, it, expect } from "vitest";
import { formatLevelForExport, generateCSVRow } from "@/lib/utils/level-utils";
import type {
  GeneratedLevel,
  LevelConfig,
  BoardCell,
} from "@/config/game-types";

describe("Level Utils - Color Bar Chart Export", () => {
  // Mock level data for testing
  const mockConfig: LevelConfig = {
    name: "Test Level",
    width: 4,
    height: 4,
    blockCount: 12,
    colorCount: 3,
    selectedColors: ["Red", "Blue", "Green"],
    generationMode: "random",
    elements: {},
    difficulty: "Normal",
  };

  const mockBoard: BoardCell[][] = [
    [
      { type: "block", color: "Red", element: null },
      { type: "block", color: "Blue", element: null },
      { type: "empty", color: null, element: null },
      { type: "block", color: "Green", element: null },
    ],
    [
      { type: "block", color: "Red", element: null },
      { type: "block", color: "Red", element: null },
      { type: "block", color: "Blue", element: null },
      { type: "empty", color: null, element: null },
    ],
    [
      { type: "block", color: "Green", element: null },
      { type: "block", color: "Green", element: null },
      { type: "block", color: "Blue", element: null },
      { type: "block", color: "Red", element: null },
    ],
    [
      { type: "empty", color: null, element: null },
      { type: "empty", color: null, element: null },
      { type: "empty", color: null, element: null },
      { type: "empty", color: null, element: null },
    ],
  ];

  const mockLevel: GeneratedLevel = {
    id: "test-level-123",
    config: mockConfig,
    board: mockBoard,
    containers: [],
    difficultyScore: 75,
    solvable: true,
    timestamp: new Date("2024-01-01T12:00:00Z"),
  };

  describe("formatLevelForExport", () => {
    it("should include color bar chart data in export", () => {
      const exportData = formatLevelForExport(mockLevel);

      expect(exportData).toHaveProperty("colorBarChart");
      expect(exportData.colorBarChart).toHaveProperty("bars");
      expect(Array.isArray(exportData.colorBarChart.bars)).toBe(true);
    });

    it("should create bars with correct structure", () => {
      const exportData = formatLevelForExport(mockLevel);
      const bars = exportData.colorBarChart.bars;

      expect(bars.length).toBeGreaterThan(0);

      // Each bar should have barIndex and color
      bars.forEach((bar) => {
        expect(bar).toHaveProperty("barIndex");
        expect(bar).toHaveProperty("color");
        expect(typeof bar.barIndex).toBe("number");
        expect(typeof bar.color).toBe("string");
      });
    });
  });

  describe("generateCSVRow", () => {
    it("should include bar sequence column in CSV", () => {
      const csvData = generateCSVRow(mockLevel);
      const lines = csvData.split("\n");
      const headers = lines[0].split(",");

      // Check for bar sequence header
      expect(headers).toContain("BarSequence");
    });

    it("should include bar sequence data in CSV row", () => {
      const csvData = generateCSVRow(mockLevel);
      const lines = csvData.split("\n");
      const row = lines[1].split(",");

      expect(row.length).toBeGreaterThan(10); // Should have more columns now

      // Check that bar sequence data is included (not empty)
      const barSequenceIndex = lines[0].split(",").indexOf("BarSequence");
      const barSequenceData = row[barSequenceIndex];

      expect(barSequenceData).toBeDefined();
      expect(barSequenceData.length).toBeGreaterThan(2); // Should have some content
    });
  });

  describe("Edge cases", () => {
    it("should handle level with no blocks", () => {
      const emptyBoard: BoardCell[][] = [
        [
          { type: "empty", color: null, element: null },
          { type: "empty", color: null, element: null },
        ],
        [
          { type: "empty", color: null, element: null },
          { type: "empty", color: null, element: null },
        ],
      ];

      const emptyLevel: GeneratedLevel = {
        ...mockLevel,
        board: emptyBoard,
      };

      const exportData = formatLevelForExport(emptyLevel);

      expect(exportData.colorBarChart.totalBlocks).toBe(0);
      expect(exportData.colorBarChart.totalBars).toBe(0);
      expect(exportData.colorBarChart.colorSummary).toHaveLength(0);
      expect(exportData.colorBarChart.efficiency).toBe(0);
    });

    it("should handle level with pipe elements", () => {
      const boardWithPipe: BoardCell[][] = [
        [
          {
            type: "block",
            color: "Red",
            element: "Pipe",
            pipeContents: ["Blue", "Green", "Red"],
          },
          { type: "block", color: "Blue", element: null },
        ],
        [
          { type: "block", color: "Green", element: null },
          { type: "empty", color: null, element: null },
        ],
      ];

      const pipeLevel: GeneratedLevel = {
        ...mockLevel,
        board: boardWithPipe,
      };

      const exportData = formatLevelForExport(pipeLevel);

      // Should count pipe contents: Blue(2), Green(2), Red(1) = 5 blocks
      expect(exportData.colorBarChart.totalBlocks).toBe(5);
      expect(exportData.colorBarChart.colorSummary).toHaveLength(3);
    });
  });
});
