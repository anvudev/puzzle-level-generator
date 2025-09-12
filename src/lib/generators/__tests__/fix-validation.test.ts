import { describe, it, expect } from "vitest";
import { MigrationAdapter } from "../migration-adapter";
import type { LevelConfig } from "../../types/game-types";

describe("Fix Validation - Critical Block Count Issues", () => {
  it("should handle 39 blocks with 5 colors (the failing case)", () => {
    const config: LevelConfig = {
      width: 9,
      height: 10,
      blockCount: 39,
      colorCount: 5,
      selectedColors: ["Red", "Blue", "Green", "Orange", "Cyan"],
      generationMode: "random" as const,
      elements: { Pipe: 2, Barrel: 6 },
      difficulty: "Normal" as const,
    };

    console.log("🧪 Testing the exact failing case: 39 blocks, 5 colors");
    
    // This should NOT throw an error anymore
    const level = MigrationAdapter.generateLevel(config);

    // Validate basic structure
    expect(level).toBeDefined();
    expect(level.board).toBeDefined();
    expect(level.board.length).toBe(config.height);
    expect(level.board[0].length).toBe(config.width);

    // Count actual blocks
    let totalBlocks = 0;
    let pipeCount = 0;
    const colorCounts = new Map<string, number>();

    for (let y = 0; y < config.height; y++) {
      for (let x = 0; x < config.width; x++) {
        const cell = level.board[y][x];
        
        if (cell.type === "block") {
          if (cell.element === "Pipe") {
            pipeCount++;
            // Count pipe contents
            if (cell.pipeContents) {
              cell.pipeContents.forEach((color: string) => {
                colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
                totalBlocks++;
              });
            }
          } else if (cell.color) {
            // Normal colored block
            colorCounts.set(cell.color, (colorCounts.get(cell.color) || 0) + 1);
            totalBlocks++;
          }
        }
      }
    }

    console.log(`📊 Results: ${totalBlocks} total blocks, ${pipeCount} pipes`);
    console.log(`📊 Color distribution:`, Object.fromEntries(colorCounts));

    // Validate total count
    expect(totalBlocks).toBe(config.blockCount);
    
    // Validate pipe count
    expect(pipeCount).toBe(config.elements.Pipe);

    // Validate color distribution (should be reasonable)
    for (const [color, count] of colorCounts) {
      expect(count).toBeGreaterThan(0);
      console.log(`✅ ${color}: ${count} blocks`);
    }

    console.log("🎉 39 blocks case FIXED!");
  });

  it("should handle edge cases with small block counts", () => {
    const configs = [
      { blockCount: 18, colorCount: 2, colors: ["Red", "Blue"] },
      { blockCount: 21, colorCount: 3, colors: ["Red", "Blue", "Green"] },
      { blockCount: 30, colorCount: 4, colors: ["Red", "Blue", "Green", "Yellow"] },
    ];

    configs.forEach(({ blockCount, colorCount, colors }) => {
      const config: LevelConfig = {
        width: 9,
        height: 10,
        blockCount,
        colorCount,
        selectedColors: colors,
        generationMode: "random" as const,
        elements: { Pipe: 1, BlockLock: 0 },
        difficulty: "Normal" as const,
      };

      console.log(`🧪 Testing ${blockCount} blocks with ${colorCount} colors`);
      
      const level = MigrationAdapter.generateLevel(config);
      
      // Count blocks
      let totalBlocks = 0;
      for (let y = 0; y < config.height; y++) {
        for (let x = 0; x < config.width; x++) {
          const cell = level.board[y][x];
          if (cell.type === "block") {
            if (cell.element === "Pipe" && cell.pipeContents) {
              totalBlocks += cell.pipeContents.length;
            } else if (cell.color) {
              totalBlocks++;
            }
          }
        }
      }

      expect(totalBlocks).toBe(blockCount);
      console.log(`✅ ${blockCount} blocks: PASSED`);
    });
  });
});
