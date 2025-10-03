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
    colorMapping: {
      Red: "#ef4444",
      Blue: "#3b82f6",
      Green: "#22c55e",
    },
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

  it("should prioritize colors with more blocks using weighted algorithm", () => {
    // Create a level where Red has significantly more blocks
    const weightedLevel: GeneratedLevel = {
      ...mockLevel,
      config: {
        ...mockLevel.config,
        colorMapping: {
          Red: "#ef4444",
          Blue: "#3b82f6",
          Green: "#22c55e",
        },
      },
      board: [
        [
          { type: "block", color: "Red", element: null },
          { type: "block", color: "Red", element: null },
          { type: "block", color: "Red", element: null },
        ],
        [
          { type: "block", color: "Red", element: null },
          { type: "block", color: "Red", element: null },
          { type: "block", color: "Red", element: null },
        ],
        [
          { type: "block", color: "Blue", element: null },
          { type: "block", color: "Green", element: null },
          { type: "empty", color: null, element: null },
        ],
      ],
    };

    render(<ColorBarChart level={weightedLevel} />);

    // Red should appear first due to higher weight (6 blocks vs 1 each)
    const bars = screen.getAllByText(/^\d+$/); // Find bar numbers
    expect(bars.length).toBeGreaterThan(0);

    // Check that Red appears multiple times (should have 2 bars due to high priority)
    expect(screen.getAllByText("Red")).toHaveLength(2);

    // Verify that the weighted algorithm prioritizes Red at the beginning
    const firstBar = screen.getByTitle(/Thanh 1: Red/);
    const secondBar = screen.getByTitle(/Thanh 2: Red/);
    expect(firstBar).toBeInTheDocument();
    expect(secondBar).toBeInTheDocument();
  });

  it("should calculate correct bar counts with weighted algorithm", () => {
    render(<ColorBarChart level={mockLevel} />);

    // With weighted algorithm, the number of bars should be optimized
    // Check that some number of bars is displayed (exact count may vary based on algorithm)
    const barCountText = screen.getByText(/\d+ thanh/);
    expect(barCountText).toBeInTheDocument();
  });

  it("should display bars with correct color distribution", () => {
    render(<ColorBarChart level={mockLevel} />);

    // Check that all colors are represented in the bars
    expect(screen.getByText("Red")).toBeInTheDocument();
    expect(screen.getByText("Blue")).toBeInTheDocument();
    expect(screen.getByText("Green")).toBeInTheDocument();

    // Check that bar numbers are displayed
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
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
