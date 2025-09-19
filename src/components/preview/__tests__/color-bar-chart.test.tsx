import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ColorBarChart } from "../color-bar-chart";
import type { GeneratedLevel } from "@/config/game-types";

// Mock level data for testing
const mockLevel: GeneratedLevel = {
  id: "test-level",
  config: {
    name: "Test Level",
    width: 3,
    height: 3,
    blockCount: 9,
    colorCount: 3,
    selectedColors: ["Red", "Blue", "Green"],
    generationMode: "random",
    elements: {},
    difficulty: "Normal",
  },
  board: [
    [
      { type: "block", color: "Red", element: null },
      { type: "block", color: "Red", element: null },
      { type: "block", color: "Blue", element: null },
    ],
    [
      { type: "block", color: "Blue", element: null },
      { type: "block", color: "Green", element: null },
      { type: "block", color: "Green", element: null },
    ],
    [
      { type: "block", color: "Green", element: null },
      { type: "block", color: "Red", element: null },
      { type: "empty", color: null, element: null },
    ],
  ],
  containers: [],
  difficultyScore: 1.0,
  solvable: true,
  timestamp: new Date(),
};

describe("ColorBarChart", () => {
  it("should render color bar chart with correct data", () => {
    render(<ColorBarChart level={mockLevel} />);

    // Check if the component renders
    expect(screen.getByText("Bảng thanh màu")).toBeInTheDocument();

    // Check if colors are displayed
    expect(screen.getByText("Red")).toBeInTheDocument();
    expect(screen.getByText("Blue")).toBeInTheDocument();
    expect(screen.getByText("Green")).toBeInTheDocument();
  });

  it("should calculate correct bar counts", () => {
    render(<ColorBarChart level={mockLevel} />);

    // Red: 3 blocks = 1 bar
    // Blue: 2 blocks = 1 bar (rounded up)
    // Green: 3 blocks = 1 bar
    // Total: 3 bars
    expect(screen.getByText("3 thanh")).toBeInTheDocument();
  });

  it("should show percentage for each color", () => {
    render(<ColorBarChart level={mockLevel} />);

    // Red: 3/8 = 37.5%
    // Blue: 2/8 = 25.0%
    // Green: 3/8 = 37.5%
    expect(screen.getAllByText("(37.5%)")).toHaveLength(2); // Red and Green both have 37.5%
    expect(screen.getByText("(25.0%)")).toBeInTheDocument();
  });

  it("should handle empty level", () => {
    const emptyLevel: GeneratedLevel = {
      ...mockLevel,
      board: [
        [
          { type: "empty", color: null, element: null },
          { type: "empty", color: null, element: null },
        ],
      ],
    };

    render(<ColorBarChart level={emptyLevel} />);
    expect(screen.getByText("Không có dữ liệu màu sắc")).toBeInTheDocument();
  });
});
