import type { LevelConfig, BoardCell } from "@/config/game-types";

/**
 * Utility functions for level generation
 */
export class LevelGeneratorUtils {
  /**
   * Get pipe block range based on difficulty level
   */
  static getPipeBlockRange(difficulty: "Normal" | "Hard" | "Super Hard"): {
    min: number;
    max: number;
    avg: number;
  } {
    switch (difficulty) {
      case "Normal":
        return { min: 1, max: 4, avg: 2.5 };
      case "Hard":
        return { min: 4, max: 6, avg: 5.0 };
      case "Super Hard":
        return { min: 6, max: 8, avg: 7.0 };
      default:
        return { min: 1, max: 8, avg: 4.5 }; // fallback
    }
  }

  /**
   * Generate random pipe size based on difficulty
   */
  static generatePipeSize(
    difficulty: "Normal" | "Hard" | "Super Hard"
  ): number {
    const range = this.getPipeBlockRange(difficulty);
    return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
  }

  /**
   * Get neighbors of a cell (4-directional only)
   */
  static getNeighbors(
    x: number,
    y: number,
    width: number,
    height: number
  ): Array<{ x: number; y: number }> {
    const neighbors = [];
    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]; // 4 directions only

    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        neighbors.push({ x: nx, y: ny });
      }
    }
    return neighbors;
  }

  /**
   * Check if all blocks on board are connected
   */
  static isConnected(board: BoardCell[][]): boolean {
    const height = board.length;
    const width = board[0].length;

    // Find first block to start flood fill
    let startX = -1,
      startY = -1;
    let totalBlocks = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (board[y][x].type === "block") {
          totalBlocks++;
          if (startX === -1) {
            startX = x;
            startY = y;
          }
        }
      }
    }

    if (totalBlocks === 0) return true;
    if (startX === -1) return true;

    // Flood fill to check connectivity
    const visited = Array(height)
      .fill(null)
      .map(() => Array(width).fill(false));
    const queue = [{ x: startX, y: startY }];
    visited[startY][startX] = true;
    let connectedBlocks = 1;

    while (queue.length > 0) {
      const current = queue.shift()!;
      const neighbors = this.getNeighbors(current.x, current.y, width, height);

      for (const neighbor of neighbors) {
        if (
          !visited[neighbor.y][neighbor.x] &&
          board[neighbor.y][neighbor.x].type === "block"
        ) {
          visited[neighbor.y][neighbor.x] = true;
          queue.push(neighbor);
          connectedBlocks++;
        }
      }
    }

    return connectedBlocks === totalBlocks;
  }

  /**
   * Get positions where new blocks can be placed while maintaining connectivity
   */
  static getConnectedPositions(
    board: BoardCell[][],
    width: number,
    height: number
  ): Array<{ x: number; y: number }> {
    const connectedPositions = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (board[y][x].type === "empty") {
          // Check if this empty position is adjacent to any existing block
          const neighbors = this.getNeighbors(x, y, width, height);
          const hasBlockNeighbor = neighbors.some(
            (n) => board[n.y][n.x].type === "block"
          );

          if (hasBlockNeighbor) {
            connectedPositions.push({ x, y });
          }
        }
      }
    }

    return connectedPositions;
  }

  /**
   * Check if a cell is a normal block (can have keys placed on it)
   */
  static isNormalBlock(cell: BoardCell): boolean {
    // Key can only be placed on normal blocks (not on special elements)
    return (
      cell.type === "block" &&
      cell.element !== "Pipe" &&
      cell.element !== "Barrel" &&
      cell.element !== "Ice" &&
      cell.element !== "Bomb" &&
      cell.element !== "Moving" &&
      cell.element !== "Block Lock" &&
      cell.element !== "Key" // Key can't be on another Key
    );
  }

  /**
   * Get valid directions where a pipe can output blocks
   * NEW LOGIC: Pipe must point towards existing blocks, not empty spaces
   */
  static getValidPipeDirections(
    x: number,
    y: number,
    board: BoardCell[][],
    config: LevelConfig
  ): Array<"up" | "down" | "left" | "right"> {
    const validDirections: Array<"up" | "down" | "left" | "right"> = [];
    const directions = [
      { dir: "up" as const, dx: 0, dy: -1 },
      { dir: "down" as const, dx: 0, dy: 1 },
      { dir: "left" as const, dx: -1, dy: 0 },
      { dir: "right" as const, dx: 1, dy: 0 },
    ];

    for (const { dir, dx, dy } of directions) {
      const targetX = x + dx;
      const targetY = y + dy;

      // Check if target position is within bounds
      if (
        targetX >= 0 &&
        targetX < config.width &&
        targetY >= 0 &&
        targetY < config.height
      ) {
        const targetCell = board[targetY][targetX];

        // NEW LOGIC: Pipe can ONLY output towards existing blocks
        if (targetCell.type === "block") {
          validDirections.push(dir);
        }
      }
    }

    return validDirections;
  }

  /**
   * Get valid directions where a Pull Pin can point to color blocks
   * RELAXED LOGIC: Just need to point towards any blocks (not necessarily with gaps)
   */
  static getValidPullPinDirections(
    x: number,
    y: number,
    board: BoardCell[][],
    config: LevelConfig
  ): Array<"up" | "down" | "left" | "right"> {
    const validDirections: Array<"up" | "down" | "left" | "right"> = [];
    const directions = [
      { dir: "up" as const, dx: 0, dy: -1 },
      { dir: "down" as const, dx: 0, dy: 1 },
      { dir: "left" as const, dx: -1, dy: 0 },
      { dir: "right" as const, dx: 1, dy: 0 },
    ];

    for (const { dir, dx, dy } of directions) {
      const targetX = x + dx;
      const targetY = y + dy;

      // Check if target position is within bounds
      if (
        targetX >= 0 &&
        targetX < config.width &&
        targetY >= 0 &&
        targetY < config.height
      ) {
        const targetCell = board[targetY][targetX];

        // RELAXED LOGIC: PullPin can point towards any block or empty space
        // This makes PullPin much easier to place
        if (targetCell.type === "block" || targetCell.type === "empty") {
          validDirections.push(dir);
        }
      }
    }

    return validDirections;
  }

  /**
   * Calculate difficulty score for a level configuration
   */
  static calculateDifficultyScore(config: LevelConfig): number {
    let score = 0;
    score += config.colorCount * 3;
    score += config.blockCount * 1;

    Object.entries(config.elements).forEach(([, count]) => {
      score += count * 1.5;
    });

    return score;
  }

  /**
   * Extract pipe information from board for UI display
   */
  static extractPipeInfo(board: BoardCell[][], config: LevelConfig) {
    const pipeInfo = [];
    let pipeIndex = 1;

    for (let y = 0; y < config.height; y++) {
      for (let x = 0; x < config.width; x++) {
        const cell = board[y][x];
        if (
          cell.element === "Pipe" &&
          cell.pipeContents &&
          cell.pipeDirection
        ) {
          pipeInfo.push({
            id: `pipe${pipeIndex}`,
            contents: cell.pipeContents,
            direction: cell.pipeDirection,
            position: { x, y },
          });
          pipeIndex++;
        }
      }
    }

    return pipeInfo.length > 0 ? pipeInfo : undefined;
  }

  /**
   * Extract moving information from board for UI display
   */
  static extractMovingInfo(board: BoardCell[][], config: LevelConfig) {
    const movingInfo = [];
    let movingIndex = 1;

    for (let y = 0; y < config.height; y++) {
      for (let x = 0; x < config.width; x++) {
        const cell = board[y][x];
        if (
          cell.element === "Moving" &&
          cell.movingContents &&
          cell.movingDirection
        ) {
          movingInfo.push({
            id: `moving${movingIndex}`,
            contents: cell.movingContents,
            direction: cell.movingDirection,
            distance: cell.movingDistance || 1, // Default to 1 if not set
            position: { x, y },
          });
          movingIndex++;
        }
      }
    }

    return movingInfo.length > 0 ? movingInfo : undefined;
  }
  /**
   * Extract lock/key information from board for UI display
   */
  static extractLockInfo(board: BoardCell[][], config: LevelConfig) {
    const lockInfo = [];
    const lockPositions = new Map<string, { x: number; y: number }>();
    const keyPositions = new Map<string, { x: number; y: number }>();

    // First pass: find all locks and keys
    for (let y = 0; y < config.height; y++) {
      for (let x = 0; x < config.width; x++) {
        const cell = board[y][x];
        if (cell.element === "Block Lock" && cell.lockId) {
          lockPositions.set(cell.lockId, { x, y });
        }
        if (cell.element === "Key" && cell.keyId) {
          keyPositions.set(cell.keyId, { x, y });
        }
      }
    }

    // Second pass: create lock-key pairs
    for (const [lockId, lockPos] of lockPositions) {
      const keyPos = keyPositions.get(lockId);
      if (keyPos) {
        // TODO: Implement reachability check
        const keyReachable = true; // Simplified for now

        lockInfo.push({
          lockId,
          lockPosition: lockPos,
          keyPosition: keyPos,
          keyReachable,
        });
      }
    }

    return lockInfo.length > 0 ? lockInfo : undefined;
  }

  /**
   * Get valid directions where a Moving element can move (minimum 3 color blocks ahead)
   */
  static getValidMovingDirections(
    x: number,
    y: number,
    board: BoardCell[][],
    config: LevelConfig
  ): Array<"up" | "down" | "left" | "right"> {
    const validDirections: Array<"up" | "down" | "left" | "right"> = [];
    const directions = [
      { dir: "up" as const, dx: 0, dy: -1 },
      { dir: "down" as const, dx: 0, dy: 1 },
      { dir: "left" as const, dx: -1, dy: 0 },
      { dir: "right" as const, dx: 1, dy: 0 },
    ];

    for (const { dir, dx, dy } of directions) {
      let colorBlockCount = 0;
      let currentX = x + dx;
      let currentY = y + dy;

      // Count consecutive color blocks in this direction
      while (
        currentX >= 0 &&
        currentX < config.width &&
        currentY >= 0 &&
        currentY < config.height
      ) {
        const cell = board[currentY][currentX];
        if (cell.type === "block" && cell.color && !cell.element) {
          colorBlockCount++;
        } else {
          break; // Stop at first non-color block
        }
        currentX += dx;
        currentY += dy;
      }

      // Valid if there are at least 3 color blocks ahead
      if (colorBlockCount >= 3) {
        validDirections.push(dir);
      }
    }

    return validDirections;
  }
}
