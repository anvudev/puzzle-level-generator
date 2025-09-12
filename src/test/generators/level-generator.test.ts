import { describe, it, expect, beforeEach } from "vitest";
import { FallbackLevelGenerator } from "@/lib/generators/fallback-level-generator";
import { LevelGeneratorUtils } from "@/lib/generators/level-generator-utils";
import type { LevelConfig } from "@/config/game-types";

describe("Level Generator Tests", () => {
  let basicConfig: LevelConfig;

  beforeEach(() => {
    basicConfig = {
      width: 9,
      height: 10,
      blockCount: 27,
      colorCount: 3,
      selectedColors: ["Red", "Blue", "Green"],
      generationMode: "random",
      elements: {},
      difficulty: "Normal",
    };
  });

  describe("Color Balance Validation", () => {
    it("should ensure all colors are divisible by 3 - basic case", () => {
      const level = FallbackLevelGenerator.generateLevel(basicConfig);

      // Count colors on board and in pipes
      const colorCounts = new Map<string, number>();

      for (let y = 0; y < level.config.height; y++) {
        for (let x = 0; x < level.config.width; x++) {
          const cell = level.board[y][x];

          // Count board colors
          if (cell.type === "block" && cell.color) {
            colorCounts.set(cell.color, (colorCounts.get(cell.color) || 0) + 1);
          }

          // Count pipe colors
          if (cell.element === "Pipe" && cell.pipeContents) {
            for (const pipeColor of cell.pipeContents) {
              colorCounts.set(pipeColor, (colorCounts.get(pipeColor) || 0) + 1);
            }
          }
        }
      }

      console.log("Color counts:", Object.fromEntries(colorCounts));

      // Check each color is divisible by 3
      for (const [color, count] of colorCounts) {
        expect(count % 3).toBe(0);
      }
    });

    it("should handle pipe elements correctly in color balance", () => {
      const configWithPipes: LevelConfig = {
        ...basicConfig,
        elements: { Pipe: 2 },
      };

      const level = FallbackLevelGenerator.generateLevel(configWithPipes);

      // Count total elements
      let pipeCount = 0;
      const colorCounts = new Map<string, number>();

      for (let y = 0; y < level.config.height; y++) {
        for (let x = 0; x < level.config.width; x++) {
          const cell = level.board[y][x];

          if (cell.element === "Pipe") {
            pipeCount++;
            expect(cell.pipeContents).toBeDefined();
            expect(cell.pipeDirection).toBeDefined();
            expect(cell.pipeSize).toBeGreaterThan(0);
          }

          if (cell.type === "block" && cell.color) {
            colorCounts.set(cell.color, (colorCounts.get(cell.color) || 0) + 1);
          }

          if (cell.element === "Pipe" && cell.pipeContents) {
            for (const pipeColor of cell.pipeContents) {
              colorCounts.set(pipeColor, (colorCounts.get(pipeColor) || 0) + 1);
            }
          }
        }
      }

      expect(pipeCount).toBe(2);

      // Check color balance
      for (const [_, count] of colorCounts) {
        expect(count % 3).toBe(0);
      }
    });
  });

  describe("Element Count Validation", () => {
    it("should place exact number of requested elements", () => {
      const configWithElements: LevelConfig = {
        ...basicConfig,
        elements: {
          Pipe: 3,
          Barrel: 2,
          "Block Lock": 1,
        },
      };

      const level = FallbackLevelGenerator.generateLevel(configWithElements);

      // Count elements on board
      const elementCounts = new Map<string, number>();

      for (let y = 0; y < level.config.height; y++) {
        for (let x = 0; x < level.config.width; x++) {
          const cell = level.board[y][x];
          if (cell.element) {
            elementCounts.set(
              cell.element,
              (elementCounts.get(cell.element) || 0) + 1
            );
          }
        }
      }

      console.log("Element counts:", Object.fromEntries(elementCounts));

      expect(elementCounts.get("Pipe")).toBe(3);
      expect(elementCounts.get("Barrel")).toBe(2);
      expect(elementCounts.get("Block Lock")).toBe(1);
      expect(elementCounts.get("Key")).toBe(1);
    });

    it("should handle multiple element types correctly", () => {
      const configWithManyElements: LevelConfig = {
        ...basicConfig,
        blockCount: 36, // Increase to accommodate more elements
        elements: {
          Pipe: 2,
          Barrel: 3,
          "Block Lock": 2,
          Ice: 1,
        },
      };

      const level = FallbackLevelGenerator.generateLevel(
        configWithManyElements
      );

      const elementCounts = new Map<string, number>();

      for (let y = 0; y < level.config.height; y++) {
        for (let x = 0; x < level.config.width; x++) {
          const cell = level.board[y][x];
          if (cell.element) {
            elementCounts.set(
              cell.element,
              (elementCounts.get(cell.element) || 0) + 1
            );
          }
        }
      }

      expect(elementCounts.get("Pipe")).toBe(2);
      expect(elementCounts.get("Barrel")).toBe(3);
      expect(elementCounts.get("Block Lock")).toBe(2);
      expect(elementCounts.get("Key")).toBe(2); // Should match number of locks
      expect(elementCounts.get("Ice")).toBe(1);
    });
  });

  describe("Board Connectivity", () => {
    it("should generate connected boards", () => {
      for (let i = 0; i < 5; i++) {
        // Test multiple generations
        const level = FallbackLevelGenerator.generateLevel(basicConfig);
        const isConnected = LevelGeneratorUtils.isConnected(level.board);
        expect(isConnected).toBe(true);
      }
    });
  });

  describe("Symmetric Mode", () => {
    it("should generate symmetric boards when requested", () => {
      const symmetricConfig: LevelConfig = {
        ...basicConfig,
        generationMode: "symmetric",
      };

      const level = FallbackLevelGenerator.generateLevel(symmetricConfig);

      // Check symmetry
      const centerX = Math.floor(level.config.width / 2);
      let symmetryViolations = 0;

      for (let y = 0; y < level.config.height; y++) {
        for (let x = 0; x < centerX; x++) {
          const leftCell = level.board[y][x];
          const rightCell = level.board[y][level.config.width - 1 - x];

          if (
            leftCell.type !== rightCell.type ||
            leftCell.color !== rightCell.color
          ) {
            symmetryViolations++;
          }
        }
      }

      expect(symmetryViolations).toBe(0);
    });
  });
});
