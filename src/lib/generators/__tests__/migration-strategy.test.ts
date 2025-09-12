import { describe, test, expect, beforeEach } from "vitest";
import { MigrationAdapter } from "../migration-adapter";
import { BlockCounterV3 } from "@/config/game-types-v3";
import type { LevelConfig } from "@/config/game-types";

describe("Migration Strategy - V3 Structure Implementation", () => {
  const createTestConfig = (
    overrides: Partial<LevelConfig> = {}
  ): LevelConfig => ({
    width: 9,
    height: 10,
    blockCount: 27,
    colorCount: 5,
    selectedColors: ["Red", "Blue", "Green", "Yellow", "Brown"],
    generationMode: "random",
    elements: {
      Pipe: 1,
      BlockLock: 0,
    },
    difficulty: "Normal",
    ...overrides,
  });

  beforeEach(() => {
    // Enable V3 generator for tests
    MigrationAdapter.enableV3Generator(true);
  });

  test("should generate exact block count with V3 structure via migration adapter", () => {
    const config = createTestConfig();
    console.log(
      `\n🔄 Testing migration adapter: ${config.blockCount} blocks, ${config.elements.Pipe} pipes`
    );

    const level = MigrationAdapter.generateLevel(config);

    // Analyze the result (should be converted back to old format)
    const analysis = analyzeOldFormatBoard(level.board);

    console.log("\n📊 Migration Adapter Result:");
    console.log(`Expected: ${config.blockCount}`);
    console.log(`Actual: ${analysis.totalRealBlocks}`);
    console.log(`Analysis:`, analysis);

    // The migration adapter should produce correct results
    expect(analysis.totalRealBlocks).toBe(config.blockCount);

    // Verify it was generated with V3 (check reasoning)
    expect(level.aiReasoning).toContain("V3");
  });

  test("should handle migration validation correctly", () => {
    const config = createTestConfig();
    console.log(`\n🔍 Testing migration validation`);

    const validation = MigrationAdapter.validateMigration(config);

    console.log("\n📊 Migration Validation:");
    console.log(`Old method result:`, validation.oldResult);
    console.log(`V3 method result:`, validation.v3Result);
    console.log(`Comparison:`, validation.comparison);

    // V3 should be more accurate
    expect(validation.v3Result.isStructureValid).toBe(true);
    expect(validation.comparison.pipeCountMatch).toBe(true);

    // Block counts should be close (V3 should be more accurate)
    const difference = Math.abs(
      validation.oldResult.totalBlocks - validation.v3Result.totalColorBlocks
    );
    expect(difference).toBeLessThanOrEqual(2); // Allow small variance
  });

  test("should fallback to old generator when V3 fails", () => {
    // Create an invalid config that might cause V3 to fail
    const invalidConfig = createTestConfig({
      blockCount: 5, // Too few blocks for the elements
      elements: { Pipe: 3, BlockLock: 2 }, // Too many elements
    });

    console.log(`\n⚠️ Testing fallback mechanism with invalid config`);

    const level = MigrationAdapter.generateLevel(invalidConfig);

    // Should still generate a level (using fallback)
    expect(level).toBeDefined();
    expect(level.board).toBeDefined();

    // Check if it fell back to old generator
    console.log(`Reasoning: ${level.aiReasoning}`);
  });

  test("should demonstrate structure differences", () => {
    const config = createTestConfig();

    console.log(`\n🔍 Demonstrating structure differences:`);

    // Test with V3 enabled
    MigrationAdapter.enableV3Generator(true);
    const v3Level = MigrationAdapter.generateLevel(config);
    const v3Analysis = analyzeOldFormatBoard(v3Level.board);

    // Test with V3 disabled
    MigrationAdapter.enableV3Generator(false);
    const oldLevel = MigrationAdapter.generateLevel(config);
    const oldAnalysis = analyzeOldFormatBoard(oldLevel.board);

    console.log(`\n✅ V3 Structure (via migration):`);
    console.log(`  - Total real blocks: ${v3Analysis.totalRealBlocks}`);
    console.log(`  - Board blocks: ${v3Analysis.boardBlocks}`);
    console.log(`  - Pipe contents: ${v3Analysis.pipeContents}`);
    console.log(`  - Pipe structures: ${v3Analysis.pipeStructures}`);
    console.log(
      `  - Accuracy: ${
        v3Analysis.totalRealBlocks === config.blockCount ? "✅" : "❌"
      }`
    );

    console.log(`\n❌ Old Structure:`);
    console.log(`  - Total blocks: ${oldAnalysis.totalRealBlocks}`);
    console.log(`  - Board blocks: ${oldAnalysis.boardBlocks}`);
    console.log(`  - Pipe contents: ${oldAnalysis.pipeContents}`);
    console.log(`  - Pipe structures: ${oldAnalysis.pipeStructures}`);
    console.log(
      `  - Accuracy: ${
        oldAnalysis.totalRealBlocks === config.blockCount ? "✅" : "❌"
      }`
    );

    // V3 should be more accurate
    const v3Accurate = v3Analysis.totalRealBlocks === config.blockCount;
    const oldAccurate = oldAnalysis.totalRealBlocks === config.blockCount;

    if (!oldAccurate) {
      expect(v3Accurate).toBe(true); // V3 should fix the accuracy issue
    }

    // Re-enable V3 for other tests
    MigrationAdapter.enableV3Generator(true);
  });

  test("should handle complex configurations", () => {
    const complexConfig = createTestConfig({
      blockCount: 35,
      elements: { Pipe: 2, BlockLock: 1 },
      difficulty: "Hard",
    });

    console.log(
      `\n🎯 Testing complex configuration: ${complexConfig.blockCount} blocks, ${complexConfig.elements.Pipe} pipes, ${complexConfig.elements.BlockLock} locks`
    );

    const level = MigrationAdapter.generateLevel(complexConfig);
    const analysis = analyzeOldFormatBoard(level.board);

    console.log(
      `Result: ${analysis.totalRealBlocks}/${complexConfig.blockCount}`
    );
    console.log(`Breakdown:`, analysis);

    expect(analysis.totalRealBlocks).toBe(complexConfig.blockCount);
    expect(analysis.pipeStructures).toBe(complexConfig.elements.Pipe);
  });

  test("should verify feature flag control", () => {
    const config = createTestConfig();

    // Test V3 enabled
    MigrationAdapter.enableV3Generator(true);
    expect(MigrationAdapter.isV3Enabled()).toBe(true);

    const v3Level = MigrationAdapter.generateLevel(config);
    expect(v3Level.aiReasoning).toContain("V3");

    // Test V3 disabled
    MigrationAdapter.enableV3Generator(false);
    expect(MigrationAdapter.isV3Enabled()).toBe(false);

    const oldLevel = MigrationAdapter.generateLevel(config);
    expect(oldLevel.aiReasoning).not.toContain("V3");

    // Re-enable for other tests
    MigrationAdapter.enableV3Generator(true);
  });
});

// Helper function to analyze old format board
function analyzeOldFormatBoard(board: any[][]): {
  boardBlocks: number;
  normalBlocks: number;
  pipeStructures: number;
  pipeContents: number;
  lockBlocks: number;
  totalRealBlocks: number;
} {
  let boardBlocks = 0;
  let normalBlocks = 0;
  let pipeStructures = 0;
  let pipeContents = 0;
  let lockBlocks = 0;

  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[y].length; x++) {
      const cell = board[y][x];

      if (cell.type === "block") {
        boardBlocks++;

        if (cell.element === "Pipe") {
          pipeStructures++;
          if (cell.pipeContents) {
            pipeContents += cell.pipeContents.length;
          }
        } else if (cell.element === "BlockLock") {
          lockBlocks++; // Only BlockLock counts as color block
        } else if (cell.element === "Key") {
          // Key is non-color element, don't count in lockBlocks or normalBlocks
          // It's counted in boardBlocks but not in totalRealBlocks
        } else {
          normalBlocks++;
        }
      }
    }
  }

  // Correct calculation: exclude pipe structures from real blocks
  const totalRealBlocks = normalBlocks + pipeContents + lockBlocks;

  return {
    boardBlocks,
    normalBlocks,
    pipeStructures,
    pipeContents,
    lockBlocks,
    totalRealBlocks,
  };
}
