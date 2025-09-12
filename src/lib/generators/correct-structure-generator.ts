import type {
  LevelConfigV2,
  BoardCellV2,
  GeneratedLevelV2,
  Container,
  PipeInfo,
  LockInfo,
} from "@/config/game-types-v2";
import { BlockCounterV2 } from "@/config/game-types-v2";

/**
 * Generator với cấu trúc đúng - Pipe không phải block
 */
export class CorrectStructureGenerator {
  /**
   * Generate level với cấu trúc đúng
   */
  static generateLevel(config: LevelConfigV2): GeneratedLevelV2 {
    console.log(`🎯 [CORRECT] Starting generation with proper structure`);
    console.log(`🎯 [CORRECT] Target: ${config.blockCount} REAL blocks`);
    
    // Calculate exact distribution
    const distribution = this.calculateDistribution(config);
    console.log(`📊 [CORRECT] Distribution:`, distribution);
    
    const board = this.generateBoard(config, distribution);
    
    // Validate with new counter
    const validation = BlockCounterV2.validateBlockCount(board, config.blockCount);
    if (!validation.isValid) {
      throw new Error(`❌ [CORRECT] Validation failed: Expected ${validation.expected}, got ${validation.actual}`);
    }
    
    console.log(`✅ [CORRECT] Validation passed:`, validation.breakdown);
    
    const pipeInfo = this.extractPipeInfo(board);
    const lockInfo = this.extractLockInfo(board);
    
    return {
      id: `correct_level_${Date.now()}`,
      config: { ...config },
      board,
      containers: this.generateContainers(config),
      difficultyScore: this.calculateDifficultyScore(config),
      solvable: true,
      timestamp: new Date(),
      aiReasoning: "Generated with correct structure - pipes are NOT blocks",
      pipeInfo,
      lockInfo,
    };
  }

  /**
   * Calculate exact distribution
   */
  private static calculateDistribution(config: LevelConfigV2): {
    totalRealBlocks: number;
    pipeStructures: number;
    pipeContents: number;
    lockBlocks: number;
    normalBlocks: number;
    pipeContentPerPipe: number[];
  } {
    const pipeCount = config.elements.Pipe || 0;
    const lockCount = config.elements.BlockLock || 0;
    
    // Lock blocks (each lock = 2 real blocks: lock + key)
    const lockBlocks = lockCount * 2;
    
    // Pipe contents based on difficulty
    const pipeContentTotal = this.calculatePipeContentTotal(config.difficulty, pipeCount);
    
    // Normal blocks = remaining real blocks
    const normalBlocks = config.blockCount - pipeContentTotal - lockBlocks;
    
    if (normalBlocks < 1) {
      throw new Error(`❌ [CORRECT] Not enough blocks! Need at least 1 normal block.`);
    }
    
    // Distribute pipe contents
    const pipeContentPerPipe = this.distributePipeContents(pipeCount, pipeContentTotal);
    
    return {
      totalRealBlocks: config.blockCount,
      pipeStructures: pipeCount, // NOT counted as blocks
      pipeContents: pipeContentTotal,
      lockBlocks,
      normalBlocks,
      pipeContentPerPipe,
    };
  }

  /**
   * Calculate pipe content total
   */
  private static calculatePipeContentTotal(difficulty: string, pipeCount: number): number {
    if (pipeCount === 0) return 0;
    
    const avgPerPipe = difficulty === 'Hard' ? 3 : difficulty === 'Super Hard' ? 4 : 2;
    return pipeCount * avgPerPipe;
  }

  /**
   * Distribute pipe contents among pipes
   */
  private static distributePipeContents(pipeCount: number, totalContents: number): number[] {
    if (pipeCount === 0) return [];
    
    const distribution: number[] = [];
    let remaining = totalContents;
    
    for (let i = 0; i < pipeCount; i++) {
      if (i === pipeCount - 1) {
        distribution.push(remaining);
      } else {
        const size = Math.max(1, Math.floor(remaining / (pipeCount - i)));
        distribution.push(size);
        remaining -= size;
      }
    }
    
    return distribution;
  }

  /**
   * Generate board with correct structure
   */
  private static generateBoard(config: LevelConfigV2, distribution: any): BoardCellV2[][] {
    // Initialize empty board
    const board: BoardCellV2[][] = Array(config.height)
      .fill(null)
      .map(() =>
        Array(config.width)
          .fill(null)
          .map(() => ({
            type: "empty" as const,
            color: null,
            element: null,
          }))
      );

    // Step 1: Place normal blocks
    this.placeNormalBlocks(board, config, distribution.normalBlocks);
    
    // Step 2: Place pipe STRUCTURES (not blocks!)
    this.placePipeStructures(board, config, distribution);
    
    // Step 3: Place locks
    this.placeLocks(board, config, distribution.lockBlocks / 2);
    
    // Step 4: Assign pipe contents (real blocks)
    this.assignPipeContents(board, config, distribution);
    
    return board;
  }

  /**
   * Place normal blocks
   */
  private static placeNormalBlocks(board: BoardCellV2[][], config: LevelConfigV2, count: number): void {
    console.log(`🎯 [CORRECT] Placing ${count} normal blocks`);
    
    const colors = config.selectedColors;
    const colorDistribution = this.createColorDistribution(colors, count);
    
    // Connected placement
    const startX = Math.floor(config.width / 2);
    const startY = Math.floor(config.height / 2);
    
    board[startY][startX] = {
      type: "block",
      color: colorDistribution[0],
      element: null,
    };
    
    let placedCount = 1;
    
    while (placedCount < count) {
      const connectedPositions = this.getConnectedPositions(board, config.width, config.height);
      
      if (connectedPositions.length === 0) {
        throw new Error(`❌ [CORRECT] No connected positions available`);
      }
      
      const pos = connectedPositions[Math.floor(Math.random() * connectedPositions.length)];
      board[pos.y][pos.x] = {
        type: "block",
        color: colorDistribution[placedCount],
        element: null,
      };
      
      placedCount++;
    }
    
    console.log(`✅ [CORRECT] Placed ${placedCount} normal blocks`);
  }

  /**
   * Place pipe structures (NOT blocks!)
   */
  private static placePipeStructures(board: BoardCellV2[][], config: LevelConfigV2, distribution: any): void {
    if (distribution.pipeStructures === 0) return;
    
    console.log(`🎯 [CORRECT] Placing ${distribution.pipeStructures} pipe STRUCTURES (not blocks)`);
    
    const availablePositions = this.getAvailablePositions(board);
    
    for (let i = 0; i < distribution.pipeStructures; i++) {
      if (availablePositions.length === 0) {
        throw new Error(`❌ [CORRECT] No available positions for pipe structures`);
      }
      
      const pos = availablePositions.splice(Math.floor(Math.random() * availablePositions.length), 1)[0];
      const pipeSize = distribution.pipeContentPerPipe[i];
      
      board[pos.y][pos.x] = {
        type: "pipe", // ✅ Correct type!
        color: null,
        element: "Pipe",
        pipeDirection: this.getRandomDirection(),
        pipeSize: pipeSize,
        pipeContents: [], // Will be filled later
      };
      
      console.log(`✅ [CORRECT] Placed pipe structure at (${pos.x}, ${pos.y}) with capacity ${pipeSize}`);
    }
  }

  /**
   * Place locks
   */
  private static placeLocks(board: BoardCellV2[][], config: LevelConfigV2, lockCount: number): void {
    // Implementation for locks
    console.log(`🎯 [CORRECT] Placing ${lockCount} lock pairs`);
  }

  /**
   * Assign pipe contents (real blocks)
   */
  private static assignPipeContents(board: BoardCellV2[][], config: LevelConfigV2, distribution: any): void {
    console.log(`🎯 [CORRECT] Assigning ${distribution.pipeContents} pipe contents (real blocks)`);
    
    const colors = config.selectedColors;
    const pipeContentColors = this.createColorDistribution(colors, distribution.pipeContents);
    
    let colorIndex = 0;
    
    for (let y = 0; y < config.height; y++) {
      for (let x = 0; x < config.width; x++) {
        const cell = board[y][x];
        if (cell.type === "pipe" && cell.pipeSize) {
          const contents: string[] = [];
          
          for (let i = 0; i < cell.pipeSize; i++) {
            if (colorIndex < pipeContentColors.length) {
              contents.push(pipeContentColors[colorIndex]);
              colorIndex++;
            }
          }
          
          cell.pipeContents = contents;
          console.log(`✅ [CORRECT] Assigned ${contents.length} blocks to pipe at (${x}, ${y}): [${contents.join(", ")}]`);
        }
      }
    }
  }

  // Helper methods
  private static createColorDistribution(colors: string[], totalBlocks: number): string[] {
    const distribution: string[] = [];
    const basePerColor = Math.floor(totalBlocks / colors.length);
    const remainder = totalBlocks % colors.length;
    
    colors.forEach((color, index) => {
      const count = basePerColor + (index < remainder ? 1 : 0);
      for (let i = 0; i < count; i++) {
        distribution.push(color);
      }
    });
    
    // Shuffle
    for (let i = distribution.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [distribution[i], distribution[j]] = [distribution[j], distribution[i]];
    }
    
    return distribution;
  }

  private static getConnectedPositions(board: BoardCellV2[][], width: number, height: number): { x: number; y: number }[] {
    const positions = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (board[y][x].type === "empty") {
          // Check if adjacent to any block
          const adjacent = [
            { x: x - 1, y },
            { x: x + 1, y },
            { x, y: y - 1 },
            { x, y: y + 1 },
          ];
          
          const hasAdjacentBlock = adjacent.some(pos => {
            if (pos.x >= 0 && pos.x < width && pos.y >= 0 && pos.y < height) {
              return board[pos.y][pos.x].type === "block";
            }
            return false;
          });
          
          if (hasAdjacentBlock) {
            positions.push({ x, y });
          }
        }
      }
    }
    return positions;
  }

  private static getAvailablePositions(board: BoardCellV2[][]): { x: number; y: number }[] {
    const positions = [];
    for (let y = 0; y < board.length; y++) {
      for (let x = 0; x < board[y].length; x++) {
        if (board[y][x].type === "empty") {
          positions.push({ x, y });
        }
      }
    }
    return positions;
  }

  private static getRandomDirection(): "up" | "down" | "left" | "right" {
    const directions = ["up", "down", "left", "right"] as const;
    return directions[Math.floor(Math.random() * directions.length)];
  }

  private static extractPipeInfo(board: BoardCellV2[][]): PipeInfo[] {
    const pipeInfo: PipeInfo[] = [];
    let pipeId = 1;
    
    for (let y = 0; y < board.length; y++) {
      for (let x = 0; x < board[y].length; x++) {
        const cell = board[y][x];
        if (cell.type === "pipe") {
          pipeInfo.push({
            id: `pipe${pipeId++}`,
            contents: cell.pipeContents || [],
            direction: cell.pipeDirection || "up",
            position: { x, y },
          });
        }
      }
    }
    
    return pipeInfo;
  }

  private static extractLockInfo(board: BoardCellV2[][]): LockInfo[] {
    return []; // TODO: Implement
  }

  private static generateContainers(config: LevelConfigV2): Container[] {
    const containerCount = Math.max(3, Math.ceil(config.blockCount / 12));
    const containers: Container[] = [];

    for (let i = 0; i < containerCount; i++) {
      const slots = Math.floor(Math.random() * 3) + 3;
      const initialFill = Math.max(1, Math.floor(Math.random() * (slots - 1)));

      const contents = [];
      for (let j = 0; j < initialFill; j++) {
        contents.push({
          color: config.selectedColors[Math.floor(Math.random() * config.selectedColors.length)],
          type: "block",
        });
      }

      containers.push({
        id: `container_${i}`,
        slots: slots,
        contents: contents,
      });
    }

    return containers;
  }

  private static calculateDifficultyScore(config: LevelConfigV2): number {
    return config.blockCount * 10; // Simple calculation
  }
}
