/**
 * NEW STRUCTURE V2 - Fixes the pipe vs block confusion
 */

export interface BoardCellV2 {
  type: "empty" | "block" | "pipe" | "lock"; // ✅ Pipe is separate type
  color: string | null;
  element: string | null;
  
  // For pipe type only
  pipeContents?: string[]; // These are the REAL blocks
  pipeDirection?: "up" | "down" | "left" | "right";
  pipeSize?: number;
  
  // For lock system
  lockId?: string;
  keyId?: string;
}

export interface LevelConfigV2 {
  width: number;
  height: number;
  blockCount: number; // This counts ONLY real blocks (not pipe structures)
  colorCount: number;
  selectedColors: string[];
  generationMode: "random" | "symmetric";
  elements: {
    Pipe: number; // Number of pipe STRUCTURES (not blocks)
    BlockLock: number;
  };
  difficulty: "Normal" | "Hard" | "Super Hard";
}

/**
 * Block counting logic V2:
 * 
 * REAL BLOCKS = Normal blocks + Pipe contents + Lock blocks
 * 
 * Example:
 * - blockCount: 27
 * - 1 pipe with 2 contents
 * - 0 locks
 * 
 * Distribution:
 * - Normal blocks: 25
 * - Pipe contents: 2 (these are real blocks)
 * - Pipe structure: 1 (NOT a block, just container)
 * - Total REAL blocks: 25 + 2 = 27 ✅
 */

export interface GeneratedLevelV2 {
  id: string;
  config: LevelConfigV2;
  board: BoardCellV2[][];
  containers: Container[];
  difficultyScore: number;
  solvable: boolean;
  timestamp: Date;
  aiReasoning: string;
  pipeInfo?: PipeInfo[];
  lockInfo?: LockInfo[];
}

export interface PipeInfo {
  id: string;
  contents: string[];
  direction: "up" | "down" | "left" | "right";
  position: { x: number; y: number };
}

export interface LockInfo {
  id: string;
  lockPosition: { x: number; y: number };
  keyPosition: { x: number; y: number };
  color: string;
}

export interface Container {
  id: string;
  slots: number;
  contents: Array<{
    color: string;
    type: string;
  }>;
}

/**
 * Migration strategy:
 * 
 * 1. Create new generator using V2 types
 * 2. Update counting logic to exclude pipe structures
 * 3. Update UI to handle new structure
 * 4. Gradually migrate existing code
 */

export class BlockCounterV2 {
  static countRealBlocks(board: BoardCellV2[][]): {
    normalBlocks: number;
    pipeContents: number;
    lockBlocks: number;
    totalRealBlocks: number;
    pipeStructures: number; // Not counted as blocks
  } {
    let normalBlocks = 0;
    let pipeContents = 0;
    let lockBlocks = 0;
    let pipeStructures = 0;

    for (let y = 0; y < board.length; y++) {
      for (let x = 0; x < board[y].length; x++) {
        const cell = board[y][x];

        switch (cell.type) {
          case "block":
            if (cell.element === "BlockLock" || cell.element === "Key") {
              lockBlocks++;
            } else {
              normalBlocks++;
            }
            break;

          case "pipe":
            pipeStructures++; // NOT counted as blocks
            if (cell.pipeContents) {
              pipeContents += cell.pipeContents.length; // These ARE blocks
            }
            break;

          case "lock":
            lockBlocks++;
            break;
        }
      }
    }

    return {
      normalBlocks,
      pipeContents,
      lockBlocks,
      totalRealBlocks: normalBlocks + pipeContents + lockBlocks,
      pipeStructures,
    };
  }

  static validateBlockCount(board: BoardCellV2[][], expectedCount: number): {
    isValid: boolean;
    expected: number;
    actual: number;
    breakdown: ReturnType<typeof BlockCounterV2.countRealBlocks>;
  } {
    const breakdown = this.countRealBlocks(board);
    
    return {
      isValid: breakdown.totalRealBlocks === expectedCount,
      expected: expectedCount,
      actual: breakdown.totalRealBlocks,
      breakdown,
    };
  }
}

/**
 * Example usage:
 * 
 * const config: LevelConfigV2 = {
 *   blockCount: 27,
 *   elements: { Pipe: 1, BlockLock: 0 }
 * };
 * 
 * // Generate level
 * const level = GeneratorV2.generate(config);
 * 
 * // Validate
 * const validation = BlockCounterV2.validateBlockCount(level.board, config.blockCount);
 * console.log(validation.isValid); // Should be true
 * console.log(validation.breakdown);
 * // {
 * //   normalBlocks: 25,
 * //   pipeContents: 2,
 * //   lockBlocks: 0,
 * //   totalRealBlocks: 27, ✅
 * //   pipeStructures: 1 (not counted)
 * // }
 */
