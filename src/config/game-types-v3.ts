/**
 * GAME TYPES V3 - Complete structure with proper element classification
 */

/**
 * Element classification:
 * 
 * 1. COLOR BLOCKS (có màu, đếm vào blockCount):
 *    - Normal blocks: blocks thường có màu
 *    - Blocks with elements: bomb, ice, barrel, BlockLock (có màu + element)
 * 
 * 2. NON-COLOR ELEMENTS (không màu, KHÔNG đếm vào blockCount):
 *    - Pipe: container chứa blocks
 *    - Barrier: obstacle
 *    - Key: unlock mechanism (không có màu riêng)
 * 
 * 3. SPECIAL CASES:
 *    - Pipe contents: blocks bên trong pipe (có màu, đếm vào blockCount)
 *    - Lock/Key pairs: Lock có màu (đếm), Key không màu (không đếm)
 */

export type CellType = "empty" | "block" | "element";

export type ElementType = 
  // Color elements (có màu, đếm vào blockCount)
  | "bomb"           // Block + bomb element
  | "ice"            // Block + ice element  
  | "barrel"         // Block + barrel element
  | "block_lock"     // Block + lock element
  
  // Non-color elements (không màu, KHÔNG đếm vào blockCount)
  | "pipe"           // Container element
  | "barrier"        // Obstacle element
  | "key";           // Unlock element

export interface BoardCellV3 {
  type: CellType;
  color: string | null;
  
  // Element classification
  elementType?: ElementType;
  isColorElement: boolean; // true = đếm vào blockCount, false = không đếm
  
  // Element-specific properties
  elementProperties?: {
    // For pipe
    pipeContents?: string[];
    pipeDirection?: "up" | "down" | "left" | "right";
    pipeCapacity?: number;
    
    // For lock/key system
    lockId?: string;
    keyId?: string;
    
    // For bomb/ice/barrel
    durability?: number;
    explosionRadius?: number;
  };
}

export interface LevelConfigV3 {
  width: number;
  height: number;
  blockCount: number; // Chỉ đếm COLOR BLOCKS (bao gồm cả pipe contents)
  colorCount: number;
  selectedColors: string[];
  generationMode: "random" | "symmetric";
  
  elements: {
    // Color elements (đếm vào blockCount)
    bomb?: number;
    ice?: number;
    barrel?: number;
    block_lock?: number;
    
    // Non-color elements (KHÔNG đếm vào blockCount)
    pipe?: number;
    barrier?: number;
  };
  
  difficulty: "Normal" | "Hard" | "Super Hard";
}

/**
 * Block counting logic V3:
 * 
 * COLOR BLOCKS = Normal blocks + Color elements + Pipe contents
 * 
 * Example:
 * - blockCount: 30
 * - 1 pipe with 3 contents
 * - 2 bombs
 * - 1 barrier (không đếm)
 * 
 * Distribution:
 * - Normal blocks: 25
 * - Pipe contents: 3 (color blocks)
 * - Bombs: 2 (color blocks)
 * - Total COLOR BLOCKS: 25 + 3 + 2 = 30 ✅
 * - Pipe structure: 1 (không đếm)
 * - Barrier: 1 (không đếm)
 */

export class BlockCounterV3 {
  static countColorBlocks(board: BoardCellV3[][]): {
    normalBlocks: number;
    colorElements: number; // bomb, ice, barrel, block_lock
    pipeContents: number;
    totalColorBlocks: number;
    
    // Non-color elements (not counted)
    nonColorElements: number; // pipe, barrier, key
    pipeStructures: number;
    barriers: number;
    keys: number;
  } {
    let normalBlocks = 0;
    let colorElements = 0;
    let pipeContents = 0;
    let nonColorElements = 0;
    let pipeStructures = 0;
    let barriers = 0;
    let keys = 0;

    for (let y = 0; y < board.length; y++) {
      for (let x = 0; x < board[y].length; x++) {
        const cell = board[y][x];

        if (cell.type === "block") {
          if (cell.isColorElement) {
            normalBlocks++;
          }
        } else if (cell.type === "element") {
          if (cell.isColorElement) {
            colorElements++;
          } else {
            nonColorElements++;
            
            // Count specific non-color elements
            switch (cell.elementType) {
              case "pipe":
                pipeStructures++;
                if (cell.elementProperties?.pipeContents) {
                  pipeContents += cell.elementProperties.pipeContents.length;
                }
                break;
              case "barrier":
                barriers++;
                break;
              case "key":
                keys++;
                break;
            }
          }
        }
      }
    }

    return {
      normalBlocks,
      colorElements,
      pipeContents,
      totalColorBlocks: normalBlocks + colorElements + pipeContents,
      nonColorElements,
      pipeStructures,
      barriers,
      keys,
    };
  }

  static validateBlockCount(board: BoardCellV3[][], expectedCount: number): {
    isValid: boolean;
    expected: number;
    actual: number;
    breakdown: ReturnType<typeof BlockCounterV3.countColorBlocks>;
  } {
    const breakdown = this.countColorBlocks(board);
    
    return {
      isValid: breakdown.totalColorBlocks === expectedCount,
      expected: expectedCount,
      actual: breakdown.totalColorBlocks,
      breakdown,
    };
  }
}

/**
 * Helper functions for creating cells
 */
export class CellFactory {
  static createEmpty(): BoardCellV3 {
    return {
      type: "empty",
      color: null,
      isColorElement: false,
    };
  }

  static createColorBlock(color: string): BoardCellV3 {
    return {
      type: "block",
      color: color,
      isColorElement: true,
    };
  }

  static createColorElement(color: string, elementType: ElementType, properties?: any): BoardCellV3 {
    return {
      type: "element",
      color: color,
      elementType: elementType,
      isColorElement: true,
      elementProperties: properties,
    };
  }

  static createNonColorElement(elementType: ElementType, properties?: any): BoardCellV3 {
    return {
      type: "element",
      color: null,
      elementType: elementType,
      isColorElement: false,
      elementProperties: properties,
    };
  }

  static createPipe(direction: "up" | "down" | "left" | "right", capacity: number): BoardCellV3 {
    return this.createNonColorElement("pipe", {
      pipeDirection: direction,
      pipeCapacity: capacity,
      pipeContents: [],
    });
  }

  static createBomb(color: string, explosionRadius: number = 1): BoardCellV3 {
    return this.createColorElement(color, "bomb", {
      explosionRadius: explosionRadius,
    });
  }

  static createBarrier(): BoardCellV3 {
    return this.createNonColorElement("barrier");
  }

  static createBlockLock(color: string, lockId: string): BoardCellV3 {
    return this.createColorElement(color, "block_lock", {
      lockId: lockId,
    });
  }

  static createKey(keyId: string): BoardCellV3 {
    return this.createNonColorElement("key", {
      keyId: keyId,
    });
  }
}

/**
 * Migration utilities
 */
export class MigrationUtils {
  /**
   * Convert old BoardCell to new BoardCellV3
   */
  static convertOldCell(oldCell: any): BoardCellV3 {
    if (oldCell.type === "empty") {
      return CellFactory.createEmpty();
    }

    if (oldCell.type === "block") {
      // Old pipe structure (wrong)
      if (oldCell.element === "Pipe") {
        return CellFactory.createPipe(
          oldCell.pipeDirection || "up",
          oldCell.pipeSize || 0
        );
      }

      // Old block lock
      if (oldCell.element === "BlockLock") {
        return CellFactory.createBlockLock(
          oldCell.color || "Red",
          oldCell.lockId || "lock1"
        );
      }

      // Old key (was incorrectly a block)
      if (oldCell.element === "Key") {
        return CellFactory.createKey(oldCell.keyId || "key1");
      }

      // Normal color block
      if (oldCell.color) {
        return CellFactory.createColorBlock(oldCell.color);
      }
    }

    // Fallback
    return CellFactory.createEmpty();
  }

  /**
   * Convert old LevelConfig to new LevelConfigV3
   */
  static convertOldConfig(oldConfig: any): LevelConfigV3 {
    return {
      width: oldConfig.width,
      height: oldConfig.height,
      blockCount: oldConfig.blockCount,
      colorCount: oldConfig.colorCount,
      selectedColors: oldConfig.selectedColors,
      generationMode: oldConfig.generationMode,
      elements: {
        pipe: oldConfig.elements?.Pipe || 0,
        block_lock: oldConfig.elements?.BlockLock || 0,
        bomb: 0,
        ice: 0,
        barrel: 0,
        barrier: 0,
      },
      difficulty: oldConfig.difficulty,
    };
  }
}

export interface GeneratedLevelV3 {
  id: string;
  config: LevelConfigV3;
  board: BoardCellV3[][];
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
