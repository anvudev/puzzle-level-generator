import type { BoardCell } from "@/config/game-types";

export interface Position {
  x: number;
  y: number;
}

export interface BlockGroup {
  blocks: Position[];
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

/**
 * Get all connected blocks starting from a given position using BFS
 * Only considers blocks (not walls or empty cells)
 */
export function getConnectedBlocks(
  board: BoardCell[][],
  startX: number,
  startY: number
): Position[] {
  const height = board.length;
  const width = board[0]?.length || 0;
  
  // Check if starting position is valid and is a block
  if (
    startX < 0 || startX >= width ||
    startY < 0 || startY >= height ||
    board[startY][startX].type !== "block"
  ) {
    return [];
  }

  const visited = new Set<string>();
  const queue: Position[] = [{ x: startX, y: startY }];
  const connectedBlocks: Position[] = [];
  
  // Directions: up, down, left, right
  const directions = [
    { dx: 0, dy: -1 }, // up
    { dx: 0, dy: 1 },  // down
    { dx: -1, dy: 0 }, // left
    { dx: 1, dy: 0 },  // right
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const key = `${current.x},${current.y}`;
    
    if (visited.has(key)) continue;
    visited.add(key);
    connectedBlocks.push(current);

    // Check all 4 directions
    for (const dir of directions) {
      const newX = current.x + dir.dx;
      const newY = current.y + dir.dy;
      const newKey = `${newX},${newY}`;

      // Check bounds and if not visited
      if (
        newX >= 0 && newX < width &&
        newY >= 0 && newY < height &&
        !visited.has(newKey) &&
        board[newY][newX].type === "block"
      ) {
        queue.push({ x: newX, y: newY });
      }
    }
  }

  return connectedBlocks;
}

/**
 * Get the bounding box of a group of blocks
 */
export function getGroupBounds(blocks: Position[]): BlockGroup["bounds"] {
  if (blocks.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }

  const minX = Math.min(...blocks.map(b => b.x));
  const maxX = Math.max(...blocks.map(b => b.x));
  const minY = Math.min(...blocks.map(b => b.y));
  const maxY = Math.max(...blocks.map(b => b.y));

  return { minX, maxX, minY, maxY };
}

/**
 * Check if a group can be moved to a new position
 */
export function canMoveGroup(
  board: BoardCell[][],
  group: Position[],
  deltaX: number,
  deltaY: number
): boolean {
  const height = board.length;
  const width = board[0]?.length || 0;

  // Check if all new positions are valid and not occupied by non-group blocks
  for (const block of group) {
    const newX = block.x + deltaX;
    const newY = block.y + deltaY;

    // Check bounds
    if (newX < 0 || newX >= width || newY < 0 || newY >= height) {
      return false;
    }

    // Check if target position is empty or part of the moving group
    const targetCell = board[newY][newX];
    const isPartOfGroup = group.some(g => g.x === newX && g.y === newY);
    
    if (!isPartOfGroup && targetCell.type !== "empty") {
      return false;
    }
  }

  return true;
}

/**
 * Move a group of blocks to new positions
 */
export function moveBlockGroup(
  board: BoardCell[][],
  group: Position[],
  deltaX: number,
  deltaY: number
): BoardCell[][] {
  if (!canMoveGroup(board, group, deltaX, deltaY)) {
    return board; // Return original board if move is invalid
  }

  // Create a deep copy of the board
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));

  // Store the cells that will be moved
  const movingCells = group.map(pos => ({ ...board[pos.y][pos.x] }));

  // Clear original positions
  group.forEach(pos => {
    newBoard[pos.y][pos.x] = {
      type: "empty",
      color: null,
      element: null,
    };
  });

  // Place cells in new positions
  group.forEach((pos, index) => {
    const newX = pos.x + deltaX;
    const newY = pos.y + deltaY;
    newBoard[newY][newX] = movingCells[index];
  });

  return newBoard;
}

/**
 * Convert board position to flat index
 */
export function positionToIndex(x: number, y: number, width: number): number {
  return y * width + x;
}

/**
 * Convert flat index to board position
 */
export function indexToPosition(index: number, width: number): Position {
  return {
    x: index % width,
    y: Math.floor(index / width),
  };
}

/**
 * Check if two positions are equal
 */
export function positionsEqual(pos1: Position, pos2: Position): boolean {
  return pos1.x === pos2.x && pos1.y === pos2.y;
}

/**
 * Find the closest valid drop position for a group
 */
export function findClosestValidPosition(
  board: BoardCell[][],
  group: Position[],
  targetX: number,
  targetY: number
): { deltaX: number; deltaY: number } | null {
  const bounds = getGroupBounds(group);
  const groupCenterX = (bounds.minX + bounds.maxX) / 2;
  const groupCenterY = (bounds.minY + bounds.maxY) / 2;
  
  // Calculate the delta to move group center to target
  const baseDeltaX = Math.round(targetX - groupCenterX);
  const baseDeltaY = Math.round(targetY - groupCenterY);

  // Try the exact position first
  if (canMoveGroup(board, group, baseDeltaX, baseDeltaY)) {
    return { deltaX: baseDeltaX, deltaY: baseDeltaY };
  }

  // Try nearby positions in expanding circles
  for (let radius = 1; radius <= 3; radius++) {
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        if (Math.abs(dx) === radius || Math.abs(dy) === radius) {
          const deltaX = baseDeltaX + dx;
          const deltaY = baseDeltaY + dy;
          
          if (canMoveGroup(board, group, deltaX, deltaY)) {
            return { deltaX, deltaY };
          }
        }
      }
    }
  }

  return null; // No valid position found
}
