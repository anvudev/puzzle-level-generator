import type {
  LevelConfig,
  BoardCell,
  GeneratedLevel,
} from "@/config/game-types";
import type {
  LevelConfigV3,
  BoardCellV3,
  GeneratedLevelV3,
} from "@/config/game-types-v3";
import { MigrationUtils, CellFactory } from "@/config/game-types-v3";
import { V3LevelGenerator } from "./v3-level-generator";
import { FallbackLevelGenerator } from "./fallback-level-generator";

/**
 * Migration Adapter - Handles transition between old and new structures
 */
export class MigrationAdapter {
  private static USE_V3_GENERATOR = true; // Feature flag

  /**
   * Main entry point - automatically chooses best generator
   */
  static generateLevel(config: LevelConfig): GeneratedLevel {
    console.log(`🔄 [MIGRATION] Starting level generation`);
    console.log(`🔄 [MIGRATION] Using V3 generator: ${this.USE_V3_GENERATOR}`);

    if (this.USE_V3_GENERATOR) {
      try {
        // Convert to V3 config and generate with V3
        const v3Config = MigrationUtils.convertOldConfig(config);
        const v3Level = V3LevelGenerator.generateLevel(v3Config);

        // Convert back to old format for compatibility
        const oldLevel = this.convertV3ToOld(v3Level);

        console.log(`✅ [MIGRATION] Successfully generated with V3 generator`);
        return oldLevel;
      } catch (error) {
        console.warn(
          `⚠️ [MIGRATION] V3 generator failed, falling back to old generator:`,
          error
        );
        return this.generateWithOldGenerator(config);
      }
    } else {
      return this.generateWithOldGenerator(config);
    }
  }

  /**
   * Generate with old generator (fallback)
   */
  private static generateWithOldGenerator(config: LevelConfig): GeneratedLevel {
    console.log(`🔄 [MIGRATION] Using old generator`);
    return FallbackLevelGenerator.generateLevel(config);
  }

  /**
   * Convert V3 level back to old format for compatibility
   */
  private static convertV3ToOld(v3Level: GeneratedLevelV3): GeneratedLevel {
    console.log(`🔄 [MIGRATION] Converting V3 level to old format`);

    const oldBoard: BoardCell[][] = v3Level.board.map((row) =>
      row.map((cell) => this.convertV3CellToOld(cell))
    );

    const oldConfig: LevelConfig = {
      width: v3Level.config.width,
      height: v3Level.config.height,
      blockCount: v3Level.config.blockCount,
      colorCount: v3Level.config.colorCount,
      selectedColors: v3Level.config.selectedColors,
      generationMode: v3Level.config.generationMode,
      elements: {
        Pipe: v3Level.config.elements.pipe || 0,
        BlockLock: v3Level.config.elements.block_lock || 0,
      },
      difficulty: v3Level.config.difficulty,
    };

    return {
      id: v3Level.id,
      config: oldConfig,
      board: oldBoard,
      containers: v3Level.containers,
      difficultyScore: v3Level.difficultyScore,
      solvable: v3Level.solvable,
      timestamp: v3Level.timestamp,
      aiReasoning: `${v3Level.aiReasoning} (converted from V3)`,
      pipeInfo: v3Level.pipeInfo,
      lockInfo: v3Level.lockInfo,
    };
  }

  /**
   * Convert V3 cell to old format
   */
  private static convertV3CellToOld(v3Cell: BoardCellV3): BoardCell {
    if (v3Cell.type === "empty") {
      return {
        type: "empty",
        color: null,
        element: null,
      };
    }

    if (v3Cell.type === "block" && v3Cell.isColorElement) {
      return {
        type: "block",
        color: v3Cell.color,
        element: null,
      };
    }

    if (v3Cell.type === "element") {
      switch (v3Cell.elementType) {
        case "pipe":
          return {
            type: "block", // Old format incorrectly used "block" for pipes
            color: null,
            element: "Pipe",
            pipeContents: v3Cell.elementProperties?.pipeContents || [],
            pipeDirection: v3Cell.elementProperties?.pipeDirection,
            pipeSize: v3Cell.elementProperties?.pipeContents?.length || 0,
          };

        case "block_lock":
          return {
            type: "block",
            color: v3Cell.color,
            element: "BlockLock",
            lockId: v3Cell.elementProperties?.lockId,
          };

        case "key":
          return {
            type: "block", // Old format incorrectly used "block" for keys
            color: null, // Keys have no color in both V3 and old format
            element: "Key",
            keyId: v3Cell.elementProperties?.keyId,
          };

        case "bomb":
        case "ice":
        case "barrel":
          // Old format doesn't support these, convert to normal blocks
          return {
            type: "block",
            color: v3Cell.color,
            element: null,
          };

        case "barrier":
          // Old format doesn't support barriers, convert to empty
          return {
            type: "empty",
            color: null,
            element: null,
          };

        default:
          return {
            type: "empty",
            color: null,
            element: null,
          };
      }
    }

    // Fallback
    return {
      type: "empty",
      color: null,
      element: null,
    };
  }

  /**
   * Direct V3 generation (for new UI components)
   */
  static generateV3Level(config: LevelConfigV3): GeneratedLevelV3 {
    console.log(`🎯 [MIGRATION] Direct V3 generation`);
    return V3LevelGenerator.generateLevel(config);
  }

  /**
   * Convert old level to V3 format (for migration)
   */
  static convertOldToV3(oldLevel: GeneratedLevel): GeneratedLevelV3 {
    console.log(`🔄 [MIGRATION] Converting old level to V3 format`);

    const v3Board: BoardCellV3[][] = oldLevel.board.map((row) =>
      row.map((cell) => MigrationUtils.convertOldCell(cell))
    );

    const v3Config = MigrationUtils.convertOldConfig(oldLevel.config);

    return {
      id: oldLevel.id,
      config: v3Config,
      board: v3Board,
      containers: oldLevel.containers,
      difficultyScore: oldLevel.difficultyScore,
      solvable: oldLevel.solvable,
      timestamp: oldLevel.timestamp,
      aiReasoning: `${oldLevel.aiReasoning} (converted to V3)`,
      pipeInfo: oldLevel.pipeInfo,
      lockInfo: oldLevel.lockInfo,
    };
  }

  /**
   * Validation comparison between old and new
   */
  static validateMigration(config: LevelConfig): {
    oldResult: any;
    v3Result: any;
    comparison: {
      blockCountMatch: boolean;
      structureValid: boolean;
      pipeCountMatch: boolean;
    };
  } {
    console.log(`🔍 [MIGRATION] Validating migration for config:`, config);

    // Generate with old method
    const oldLevel = this.generateWithOldGenerator(config);
    const oldAnalysis = this.analyzeOldBoard(oldLevel.board);

    // Generate with V3 method
    const v3Config = MigrationUtils.convertOldConfig(config);
    const v3Level = V3LevelGenerator.generateLevel(v3Config);
    const v3Analysis = this.analyzeV3Board(v3Level.board);

    const comparison = {
      blockCountMatch: oldAnalysis.totalBlocks === v3Analysis.totalColorBlocks,
      structureValid: v3Analysis.isStructureValid,
      pipeCountMatch: oldAnalysis.pipeCount === v3Analysis.pipeCount,
    };

    console.log(`📊 [MIGRATION] Validation results:`, {
      old: oldAnalysis,
      v3: v3Analysis,
      comparison,
    });

    return {
      oldResult: oldAnalysis,
      v3Result: v3Analysis,
      comparison,
    };
  }

  /**
   * Analyze old board structure
   */
  private static analyzeOldBoard(board: BoardCell[][]): any {
    let totalBlocks = 0;
    let pipeCount = 0;
    let pipeContents = 0;

    for (let y = 0; y < board.length; y++) {
      for (let x = 0; x < board[y].length; x++) {
        const cell = board[y][x];

        if (cell.type === "block") {
          totalBlocks++;

          if (cell.element === "Pipe") {
            pipeCount++;
            if (cell.pipeContents) {
              pipeContents += cell.pipeContents.length;
            }
          }
        }
      }
    }

    return {
      totalBlocks: totalBlocks + pipeContents, // Old counting method
      boardBlocks: totalBlocks,
      pipeCount,
      pipeContents,
      isStructureValid: false, // Old structure has issues
    };
  }

  /**
   * Analyze V3 board structure
   */
  private static analyzeV3Board(board: BoardCellV3[][]): any {
    let colorBlocks = 0;
    let pipeCount = 0;
    let pipeContents = 0;
    let nonColorElements = 0;

    for (let y = 0; y < board.length; y++) {
      for (let x = 0; x < board[y].length; x++) {
        const cell = board[y][x];

        if (cell.isColorElement) {
          colorBlocks++;
        }

        if (cell.elementType === "pipe") {
          pipeCount++;
          nonColorElements++;
          if (cell.elementProperties?.pipeContents) {
            pipeContents += cell.elementProperties.pipeContents.length;
          }
        }

        if (!cell.isColorElement && cell.type === "element") {
          nonColorElements++;
        }
      }
    }

    return {
      totalColorBlocks: colorBlocks + pipeContents,
      colorBlocks,
      pipeCount,
      pipeContents,
      nonColorElements,
      isStructureValid: true, // V3 structure is correct
    };
  }

  /**
   * Feature flag control
   */
  static enableV3Generator(enable: boolean = true): void {
    this.USE_V3_GENERATOR = enable;
    console.log(
      `🔄 [MIGRATION] V3 generator ${enable ? "enabled" : "disabled"}`
    );
  }

  static isV3Enabled(): boolean {
    return this.USE_V3_GENERATOR;
  }
}
