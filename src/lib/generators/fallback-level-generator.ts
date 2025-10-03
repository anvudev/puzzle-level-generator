import type {
  LevelConfig,
  BoardCell,
  Container,
  GeneratedLevel,
} from "@/config/game-types";

import { LevelGeneratorUtils } from "./level-generator-utils";

/**
 * Fallback algorithmic level generator
 * This is the main generator currently being used
 */
export class FallbackLevelGenerator {
  /**
   * Generate a complete level using fallback algorithm
   */
  static generateLevel(config: LevelConfig): GeneratedLevel {
    const board = this.generateBoard(config);

    // Extract pipe, moving, and lock information for UI
    const pipeInfo = LevelGeneratorUtils.extractPipeInfo(board, config);
    const movingInfo = LevelGeneratorUtils.extractMovingInfo(board, config);
    const lockInfo = LevelGeneratorUtils.extractLockInfo(board, config);

    const level: GeneratedLevel = {
      id: `level_${Date.now()}`,
      config: { ...config },
      board,
      containers: this.generateContainers(config),
      difficultyScore: LevelGeneratorUtils.calculateDifficultyScore(config),
      solvable: true, // Algorithm ensures connectivity so it's solvable
      timestamp: new Date(),
      pipeInfo,
      movingInfo,
      lockInfo,
    };

    // Apply color balance adjustment to ensure all colors are divisible by 3
    const adjustedLevel = this.adjustLevelToMeetStats(level);
    return adjustedLevel || level;
  }

  /**
   * Generate game board based on configuration
   */
  static generateBoard(config: LevelConfig): BoardCell[][] {
    const board: BoardCell[][] = Array(config.height)
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

    if (config.generationMode === "symmetric") {
      return this.generateSymmetricBoard(config);
    }

    return this.generateRandomBoard(config, board);
  }

  /**
   * Generate random board layout
   */
  private static generateRandomBoard(
    config: LevelConfig,
    board: BoardCell[][]
  ): BoardCell[][] {
    const colors = config.selectedColors;

    // Calculate pipe, lock, and pull pin blocks
    const pipeCount = config.elements.Pipe || 0;
    const blockLockCount =
      config.elements["BlockLock"] || config.elements["Block Lock"] || 0;

    // Calculate total pipe blocks from individual pipe configurations
    let pipeBlocks = 0;
    if (config.pipeBlockCounts && config.pipeBlockCounts.length > 0) {
      // Use individual pipe block counts
      pipeBlocks = config.pipeBlockCounts.reduce(
        (sum, count) => sum + count,
        0
      );
    } else {
      // Use default calculation
      const pipeBlocksPerPipe =
        config.pipeBlockCount ||
        LevelGeneratorUtils.getPipeBlockRange(config.difficulty).avg;
      pipeBlocks = Math.floor(pipeCount * pipeBlocksPerPipe);
    }
    const lockBlocks = blockLockCount * 2;

    // Calculate total moving blocks from individual moving configurations
    const movingCount = config.elements.Moving || 0;
    let movingBlocks = 0;
    if (config.movingBlockCounts && config.movingBlockCounts.length > 0) {
      // Use individual moving block counts
      movingBlocks = config.movingBlockCounts.reduce(
        (sum, count) => sum + count,
        0
      );
    } else {
      // Use default calculation
      const movingBlocksPerElement = config.movingBlockCount || 3;
      movingBlocks = Math.floor(movingCount * movingBlocksPerElement);
    }

    // Create varied color distribution while maintaining balance
    const baseBlocksPerColor =
      Math.floor(config.blockCount / colors.length / 3) * 3;
    const totalBaseBlocks = baseBlocksPerColor * colors.length;
    let availableExtra = config.blockCount - totalBaseBlocks;

    // Ensure extra blocks are divisible by 3 for balance
    availableExtra = Math.floor(availableExtra / 3) * 3;
    config.blockCount = totalBaseBlocks + availableExtra;

    // Create variation: some colors get more, some get less (but always multiples of 3)
    const finalTargetPerColor: number[] = [];
    const variationRange = Math.min(
      2,
      Math.floor(availableExtra / colors.length / 3)
    ); // Max 2 extra sets of 3

    for (let i = 0; i < colors.length; i++) {
      // Random variation: -1, 0, +1, or +2 sets of 3 blocks
      const variation = Math.floor(Math.random() * (variationRange + 2)) - 1;
      const adjustedBlocks = Math.max(3, baseBlocksPerColor + variation * 3); // Minimum 3 blocks per color
      finalTargetPerColor.push(adjustedBlocks);
    }

    // Adjust total to match available blocks
    const currentTotal = finalTargetPerColor.reduce(
      (sum, target) => sum + target,
      0
    );
    const difference = config.blockCount - currentTotal;

    if (difference !== 0) {
      // Distribute difference in multiples of 3
      const adjustmentSets = Math.floor(Math.abs(difference) / 3);
      for (let i = 0; i < adjustmentSets; i++) {
        const randomIndex = Math.floor(Math.random() * colors.length);
        if (difference > 0) {
          finalTargetPerColor[randomIndex] += 3;
        } else if (finalTargetPerColor[randomIndex] > 3) {
          finalTargetPerColor[randomIndex] -= 3;
        }
      }
    }
    const adjustedBoardBlocks =
      config.blockCount - pipeBlocks - lockBlocks - movingBlocks;
    // Create varied board color distribution
    const boardColorDistribution: string[] = [];

    // Calculate how many board blocks each color should get (roughly proportional)
    const totalTargetBlocks = finalTargetPerColor.reduce(
      (sum, target) => sum + target,
      0
    );

    colors.forEach((color, index) => {
      const targetRatio = finalTargetPerColor[index] / totalTargetBlocks;
      const idealBoardBlocks = Math.round(adjustedBoardBlocks * targetRatio);
      const actualBoardBlocks = Math.max(1, idealBoardBlocks); // At least 1 block per color

      for (let i = 0; i < actualBoardBlocks; i++) {
        boardColorDistribution.push(color);
      }
    });

    // Adjust if we have too many/few board blocks
    while (boardColorDistribution.length > adjustedBoardBlocks) {
      boardColorDistribution.pop();
    }
    while (boardColorDistribution.length < adjustedBoardBlocks) {
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      boardColorDistribution.push(randomColor);
    }

    // Shuffle for variety
    for (let i = boardColorDistribution.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [boardColorDistribution[i], boardColorDistribution[j]] = [
        boardColorDistribution[j],
        boardColorDistribution[i],
      ];
    }

    return this.placeBlocksConnected(
      board,
      config,
      boardColorDistribution,
      finalTargetPerColor
    );
  }

  /**
   * Place blocks ensuring connectivity
   */
  private static placeBlocksConnected(
    board: BoardCell[][],
    config: LevelConfig,
    boardColorDistribution: string[],
    finalTargetPerColor: number[]
  ): BoardCell[][] {
    // Initialize empty pipe color pool (will be calculated after pipes are placed)
    // pipeColorPool will be calculated in generatePipeColors method

    // CONNECTED PLACEMENT ALGORITHM
    const totalBlocks = boardColorDistribution.length;
    let placedBlocks = 0;

    // Place first block at center
    const startX = Math.floor(config.width / 2);
    const startY = Math.floor(config.height / 2);
    board[startY][startX] = {
      type: "block",
      color: boardColorDistribution[placedBlocks],
      element: null,
    };
    placedBlocks++;

    // Place remaining blocks ensuring connectivity
    while (placedBlocks < totalBlocks) {
      const connectedPositions = LevelGeneratorUtils.getConnectedPositions(
        board,
        config.width,
        config.height
      );

      if (connectedPositions.length === 0) {
        break;
      }

      // Shuffle connected positions for randomness
      for (let i = connectedPositions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [connectedPositions[i], connectedPositions[j]] = [
          connectedPositions[j],
          connectedPositions[i],
        ];
      }

      // Place block at first available connected position
      const pos = connectedPositions[0];
      board[pos.y][pos.x] = {
        type: "block",
        color: boardColorDistribution[placedBlocks],
        element: null,
      };
      placedBlocks++;
    }

    // Place special elements (without pipe/moving contents first)
    this.placeSpecialElements(board, config);

    // Calculate and assign balanced pipe contents after all pipes are placed
    this.assignBalancedPipeContents(board, config, finalTargetPerColor);

    // Calculate and assign balanced moving contents after all moving elements are placed
    this.assignBalancedMovingContents(board, config, finalTargetPerColor);

    return board;
  }

  /**
   * Generate symmetric board layout
   */
  private static generateSymmetricBoard(config: LevelConfig): BoardCell[][] {
    const board: BoardCell[][] = Array(config.height)
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

    const colors = config.selectedColors;
    const centerX = Math.floor(config.width / 2);

    // Calculate blocks
    const pipeCount = config.elements.Pipe || 0;
    const blockLockCount =
      config.elements["BlockLock"] || config.elements["Block Lock"] || 0;

    // Calculate total pipe blocks from individual pipe configurations
    let pipeBlocks = 0;
    if (config.pipeBlockCounts && config.pipeBlockCounts.length > 0) {
      // Use individual pipe block counts
      pipeBlocks = config.pipeBlockCounts.reduce(
        (sum, count) => sum + count,
        0
      );
    } else {
      // Use default calculation
      const pipeBlocksPerPipe =
        config.pipeBlockCount ||
        LevelGeneratorUtils.getPipeBlockRange(config.difficulty).avg;
      pipeBlocks = Math.floor(pipeCount * pipeBlocksPerPipe);
    }
    const lockBlocks = blockLockCount * 2;
    // Create varied color distribution for symmetric mode while maintaining balance
    const baseBlocksPerColor =
      Math.floor(config.blockCount / colors.length / 3) * 3;
    const totalBaseBlocks = baseBlocksPerColor * colors.length;
    let availableExtra = config.blockCount - totalBaseBlocks;

    // Ensure extra blocks are divisible by 3 for balance
    availableExtra = Math.floor(availableExtra / 3) * 3;
    config.blockCount = totalBaseBlocks + availableExtra;

    // Create variation for symmetric mode
    const finalTargetPerColor: number[] = [];
    const variationRange = Math.min(
      2,
      Math.floor(availableExtra / colors.length / 3)
    );

    for (let i = 0; i < colors.length; i++) {
      // More conservative variation for symmetric mode
      const variation =
        Math.floor(Math.random() * (variationRange + 1)) -
        Math.floor(variationRange / 2);
      const adjustedBlocks = Math.max(3, baseBlocksPerColor + variation * 3);
      finalTargetPerColor.push(adjustedBlocks);
    }

    // Adjust total to match available blocks
    const currentTotal = finalTargetPerColor.reduce(
      (sum, target) => sum + target,
      0
    );
    const difference = config.blockCount - currentTotal;

    if (difference !== 0) {
      const adjustmentSets = Math.floor(Math.abs(difference) / 3);
      for (let i = 0; i < adjustmentSets; i++) {
        const randomIndex = Math.floor(Math.random() * colors.length);
        if (difference > 0) {
          finalTargetPerColor[randomIndex] += 3;
        } else if (finalTargetPerColor[randomIndex] > 3) {
          finalTargetPerColor[randomIndex] -= 3;
        }
      }
    }

    let adjustedTotalBlocks = config.blockCount - pipeBlocks - lockBlocks;

    // For symmetric mode, ensure blocks work with symmetric pairs
    const hasCenter = config.width % 2 === 1;
    if (!hasCenter && adjustedTotalBlocks % 2 === 1) {
      adjustedTotalBlocks = Math.max(2, adjustedTotalBlocks - 1);
    }

    // Create varied board color distribution for symmetric mode
    const boardColorDistribution: string[] = [];

    // Calculate proportional distribution based on targets
    const totalTargetBlocks = finalTargetPerColor.reduce(
      (sum, target) => sum + target,
      0
    );

    colors.forEach((color, index) => {
      const targetRatio = finalTargetPerColor[index] / totalTargetBlocks;
      const idealBoardBlocks = Math.round(adjustedTotalBlocks * targetRatio);
      const actualBoardBlocks = Math.max(1, idealBoardBlocks); // At least 1 block per color

      for (let i = 0; i < actualBoardBlocks; i++) {
        boardColorDistribution.push(color);
      }
    });

    // Adjust if we have too many/few board blocks
    while (boardColorDistribution.length > adjustedTotalBlocks) {
      boardColorDistribution.pop();
    }
    while (boardColorDistribution.length < adjustedTotalBlocks) {
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      boardColorDistribution.push(randomColor);
    }

    // Shuffle colors for variety
    for (let i = boardColorDistribution.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [boardColorDistribution[i], boardColorDistribution[j]] = [
        boardColorDistribution[j],
        boardColorDistribution[i],
      ];
    }

    // Initialize empty pipe color pool (will be calculated after pipes are placed)
    // pipeColorPool will be calculated in generatePipeColors method

    let placedBlocks = 0;
    let colorIndex = 0;
    const totalBlocks = adjustedTotalBlocks; // Use adjusted total for symmetric placement

    // PERFECT SYMMETRIC PLACEMENT ALGORITHM
    const placeSymmetricBlock = (
      x: number,
      y: number,
      forcePlace: boolean = false
    ) => {
      if (
        placedBlocks >= totalBlocks ||
        colorIndex >= boardColorDistribution.length
      )
        return false;
      if (x < 0 || x >= config.width || y < 0 || y >= config.height)
        return false;
      if (board[y][x].type !== "empty") return false;

      const mirrorX = config.width - 1 - x;
      const isCenter = x === centerX;

      // Check connectivity (except for first block)
      if (!forcePlace && placedBlocks > 0) {
        const neighbors = LevelGeneratorUtils.getNeighbors(
          x,
          y,
          config.width,
          config.height
        );
        const hasBlockNeighbor = neighbors.some(
          (n) => board[n.y][n.x].type === "block"
        );
        if (!hasBlockNeighbor) return false;

        // For non-center blocks, also check mirror connectivity
        if (!isCenter && board[y][mirrorX].type === "empty") {
          const mirrorNeighbors = LevelGeneratorUtils.getNeighbors(
            mirrorX,
            y,
            config.width,
            config.height
          );
          const mirrorHasBlockNeighbor = mirrorNeighbors.some(
            (n) => board[n.y][n.x].type === "block"
          );
          if (!mirrorHasBlockNeighbor) return false;
        }
      }

      // Place center block
      if (isCenter) {
        board[y][x] = {
          type: "block",
          color: boardColorDistribution[colorIndex],
          element: null,
        };
        placedBlocks++;
        colorIndex++;
        return true;
      }

      // Place symmetric pair
      if (
        board[y][mirrorX].type === "empty" &&
        placedBlocks + 1 < totalBlocks &&
        colorIndex + 1 < boardColorDistribution.length
      ) {
        board[y][x] = {
          type: "block",
          color: boardColorDistribution[colorIndex],
          element: null,
        };
        placedBlocks++;
        colorIndex++;

        board[y][mirrorX] = {
          type: "block",
          color: boardColorDistribution[colorIndex],
          element: null,
        };
        placedBlocks++;
        colorIndex++;
        return true;
      }

      return false;
    };

    // Start with center block to ensure connectivity
    const startY = Math.floor(config.height / 2);
    placeSymmetricBlock(centerX, startY, true);

    // Connected symmetric patterns that grow from center
    const patterns = [
      () => {
        // Cross pattern from center
        const centerY = Math.floor(config.height / 2);
        // Horizontal line
        for (
          let dx = 1;
          dx <= Math.min(3, centerX) && placedBlocks < totalBlocks;
          dx++
        ) {
          placeSymmetricBlock(centerX - dx, centerY);
          if (placedBlocks < totalBlocks)
            placeSymmetricBlock(centerX + dx, centerY);
        }
        // Vertical line
        for (let dy = 1; dy <= 2 && placedBlocks < totalBlocks; dy++) {
          if (centerY - dy >= 0) placeSymmetricBlock(centerX, centerY - dy);
          if (centerY + dy < config.height && placedBlocks < totalBlocks) {
            placeSymmetricBlock(centerX, centerY + dy);
          }
        }
      },
      () => {
        // Diamond pattern from center
        const centerY = Math.floor(config.height / 2);
        for (let layer = 1; layer <= 2 && placedBlocks < totalBlocks; layer++) {
          // Top and bottom of diamond
          if (centerY - layer >= 0)
            placeSymmetricBlock(centerX, centerY - layer);
          if (centerY + layer < config.height && placedBlocks < totalBlocks) {
            placeSymmetricBlock(centerX, centerY + layer);
          }
          // Sides of diamond
          for (let dx = 1; dx <= layer && placedBlocks < totalBlocks; dx++) {
            if (centerX - dx >= 0 && centerX + dx < config.width) {
              placeSymmetricBlock(centerX - dx, centerY - layer + dx);
              if (placedBlocks < totalBlocks) {
                placeSymmetricBlock(centerX + dx, centerY - layer + dx);
              }
              if (
                centerY + layer - dx < config.height &&
                placedBlocks < totalBlocks
              ) {
                placeSymmetricBlock(centerX - dx, centerY + layer - dx);
                if (placedBlocks < totalBlocks) {
                  placeSymmetricBlock(centerX + dx, centerY + layer - dx);
                }
              }
            }
          }
        }
      },
    ];

    // Execute random pattern
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    pattern();

    // Fill remaining blocks using connected positions only
    while (
      placedBlocks < totalBlocks &&
      colorIndex < boardColorDistribution.length
    ) {
      const connectedPositions = [];

      // Find positions that are connected and can be placed symmetrically
      for (let y = 0; y < config.height; y++) {
        for (let x = 0; x <= centerX; x++) {
          if (board[y][x].type === "empty") {
            const neighbors = LevelGeneratorUtils.getNeighbors(
              x,
              y,
              config.width,
              config.height
            );
            const hasBlockNeighbor = neighbors.some(
              (n) => board[n.y][n.x].type === "block"
            );

            if (hasBlockNeighbor) {
              connectedPositions.push({ x, y });
            }
          }
        }
      }

      if (connectedPositions.length === 0) {
        break;
      }

      // Shuffle for randomness
      for (let i = connectedPositions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [connectedPositions[i], connectedPositions[j]] = [
          connectedPositions[j],
          connectedPositions[i],
        ];
      }

      // Try multiple positions instead of just the first one
      let placed = false;
      for (let i = 0; i < Math.min(5, connectedPositions.length); i++) {
        const pos = connectedPositions[i];
        if (placeSymmetricBlock(pos.x, pos.y)) {
          placed = true;
          break;
        }
      }

      if (!placed) {
        break;
      }
    }

    // Place special elements symmetrically (without pipe/moving contents first)
    this.placeSpecialElementsSymmetrically(board, config, centerX);

    // Calculate and assign balanced pipe contents after all pipes are placed
    this.assignBalancedPipeContents(board, config, finalTargetPerColor);

    // Calculate and assign balanced moving contents after all moving elements are placed
    this.assignBalancedMovingContents(board, config, finalTargetPerColor);

    // Final connectivity check and validation

    // Validate color balance
    this.validateColorBalance(board, config);

    return board;
  }

  /**
   * Place special elements (pipes, locks, etc.) on the board
   */
  private static placeSpecialElements(
    board: BoardCell[][],
    config: LevelConfig
  ): void {
    const colors = config.selectedColors;

    Object.entries(config.elements).forEach(([elementType, count]) => {
      if (count > 0) {
        const blockPositions = [];
        for (let y = 0; y < config.height; y++) {
          for (let x = 0; x < config.width; x++) {
            if (board[y][x].type === "block" && !board[y][x].element) {
              blockPositions.push({ x, y });
            }
          }
        }

        if (blockPositions.length === 0) {
          return;
        }

        // Shuffle all positions to ensure random distribution
        const shuffledPositions = [...blockPositions].sort(
          () => Math.random() - 0.5
        );

        let placedCount = 0;
        let attempts = 0;
        const maxAttempts = shuffledPositions.length * 3; // Allow multiple passes

        while (placedCount < count && attempts < maxAttempts) {
          const posIndex = attempts % shuffledPositions.length;
          const pos = shuffledPositions[posIndex];

          // Skip if position is already occupied
          if (board[pos.y][pos.x].element) {
            attempts++;
            continue;
          }

          const success = this.placeSpecialElement(
            board,
            pos,
            elementType,
            config,
            colors,
            placedCount
          );

          if (success) {
            placedCount++;
          }

          attempts++;
        }
      }
    });
  }

  /**
   * Place special elements symmetrically
   */
  private static placeSpecialElementsSymmetrically(
    board: BoardCell[][],
    config: LevelConfig,
    centerX: number
  ): void {
    const colors = config.selectedColors;

    Object.entries(config.elements).forEach(([elementType, count]) => {
      if (count > 0) {
        // Get all available positions on the left side (including center if odd width)
        const leftSidePositions = [];
        for (let y = 0; y < config.height; y++) {
          for (let x = 0; x <= centerX; x++) {
            if (board[y][x].type === "block" && !board[y][x].element) {
              leftSidePositions.push({ x, y });
            }
          }
        }

        // Shuffle positions for random distribution
        const shuffledPositions = [...leftSidePositions].sort(
          () => Math.random() - 0.5
        );

        let placedCount = 0;

        for (const pos of shuffledPositions) {
          if (placedCount >= count) break;

          const mirrorX = config.width - 1 - pos.x;
          const isCenter = pos.x === centerX;

          // For center column elements, place only one
          if (isCenter) {
            const success = this.placeSpecialElement(
              board,
              pos,
              elementType,
              config,
              colors,
              placedCount
            );

            if (success) {
              placedCount++;
            }
          } else {
            // For non-center elements, try to place both sides
            const mirrorAvailable =
              board[pos.y][mirrorX].type === "block" &&
              !board[pos.y][mirrorX].element;

            if (mirrorAvailable && placedCount + 1 < count) {
              // Place both sides
              const leftSuccess = this.placeSpecialElement(
                board,
                pos,
                elementType,
                config,
                colors,
                placedCount
              );

              if (leftSuccess) {
                const rightSuccess = this.placeSpecialElement(
                  board,
                  { x: mirrorX, y: pos.y },
                  elementType,
                  config,
                  colors,
                  placedCount + 1
                );

                if (rightSuccess) {
                  placedCount += 2;
                } else {
                  // If mirror failed, remove the left one to maintain symmetry
                  board[pos.y][pos.x].element = null;
                }
              }
            } else if (placedCount + 1 === count && isCenter) {
              // Only one element left, place it at center if possible
              const success = this.placeSpecialElement(
                board,
                pos,
                elementType,
                config,
                colors,
                placedCount
              );

              if (success) {
                placedCount++;
              }
            }
          }
        }
      }
    });
  }

  /**
   * Place a single special element at given position
   */
  private static placeSpecialElement(
    board: BoardCell[][],
    pos: { x: number; y: number },
    elementType: string,
    config: LevelConfig,
    _colors: string[],
    index: number
  ): boolean {
    board[pos.y][pos.x].element = elementType;

    // If it's a pipe, add pipe-specific data
    if (elementType === "Pipe") {
      const validDirections = LevelGeneratorUtils.getValidPipeDirections(
        pos.x,
        pos.y,
        board,
        config
      );

      if (validDirections.length > 0) {
        // Pipe block is a "dead block" - no color, just pushes colors
        board[pos.y][pos.x].color = null;
        board[pos.y][pos.x].pipeDirection =
          validDirections[Math.floor(Math.random() * validDirections.length)];

        // Store pipe size for later content assignment
        // Use individual pipe block counts if available
        let pipeSize: number;
        if (
          config.pipeBlockCounts &&
          config.pipeBlockCounts[index] !== undefined
        ) {
          pipeSize = config.pipeBlockCounts[index];
        } else if (config.pipeBlockCount) {
          pipeSize = config.pipeBlockCount;
        } else {
          pipeSize = LevelGeneratorUtils.generatePipeSize(config.difficulty);
        }
        board[pos.y][pos.x].pipeSize = pipeSize;
        return true;
      } else {
        // If no valid direction, don't place pipe element
        board[pos.y][pos.x].element = null;
        return false;
      }
    }

    // If it's a Block Lock, we need to place both Lock and Key
    if (elementType === "BlockLock" || elementType === "Block Lock") {
      // Generate unique lock ID and pair number
      const pairNumber = index + 1;
      const lockId = `lock_${pairNumber}`;
      board[pos.y][pos.x].lockId = lockId;
      board[pos.y][pos.x].lockPairNumber = pairNumber;

      // Find a suitable position for the Key (must be on normal block)
      const normalBlockPositions = [];
      for (let ky = 0; ky < config.height; ky++) {
        for (let kx = 0; kx < config.width; kx++) {
          if (
            LevelGeneratorUtils.isNormalBlock(board[ky][kx]) &&
            !board[ky][kx].keyId
          ) {
            normalBlockPositions.push({ x: kx, y: ky });
          }
        }
      }

      if (normalBlockPositions.length > 0) {
        // Shuffle and pick random position for key
        for (let k = normalBlockPositions.length - 1; k > 0; k--) {
          const j = Math.floor(Math.random() * (k + 1));
          [normalBlockPositions[k], normalBlockPositions[j]] = [
            normalBlockPositions[j],
            normalBlockPositions[k],
          ];
        }

        const keyPos = normalBlockPositions[0];
        board[keyPos.y][keyPos.x].element = "Key";
        board[keyPos.y][keyPos.x].keyId = lockId;
        board[keyPos.y][keyPos.x].lockPairNumber = pairNumber;
        return true;
      } else {
        board[pos.y][pos.x].element = null;
        board[pos.y][pos.x].lockId = undefined;
        return false;
      }
    }

    // If it's a Pull Pin, add directional data and create gate
    if (elementType === "PullPin") {
      const validDirections = LevelGeneratorUtils.getValidPullPinDirections(
        pos.x,
        pos.y,
        board,
        config
      );

      if (validDirections.length > 0) {
        // Pull Pin block acts as a barrier
        board[pos.y][pos.x].color = null;
        board[pos.y][pos.x].pullPinDirection =
          validDirections[Math.floor(Math.random() * validDirections.length)];

        // Generate gate size (1-3 empty cells)
        const gateSize = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3
        board[pos.y][pos.x].pullPinGateSize = gateSize;
        return true;
      } else {
        // If no valid direction, don't place pull pin element
        board[pos.y][pos.x].element = null;
        return false;
      }
    }

    // If it's an Ice Block, assign count from config
    if (elementType === "IceBlock") {
      let iceCount = 2; // default
      if (config.iceCounts && config.iceCounts.length > index) {
        iceCount = config.iceCounts[index];
      } else {
        iceCount = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3 hits default
      }
      board[pos.y][pos.x].iceCount = iceCount;
      return true;
    }

    // If it's a Bomb, assign count from config
    if (elementType === "Bomb") {
      let bombCount = 2; // default
      if (config.bombCounts && config.bombCounts.length > index) {
        bombCount = config.bombCounts[index];
      } else {
        bombCount = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3 power default
      }
      board[pos.y][pos.x].bombCount = bombCount;
      return true;
    }

    // If it's a Moving element, assign direction and size (like Pipe)
    if (elementType === "Moving") {
      const validDirections = LevelGeneratorUtils.getValidMovingDirections(
        pos.x,
        pos.y,
        board,
        config
      );

      if (validDirections.length > 0) {
        // Moving block is a "dead block" - no color, just pushes colors
        board[pos.y][pos.x].color = null;
        board[pos.y][pos.x].movingDirection =
          validDirections[Math.floor(Math.random() * validDirections.length)];

        // Store moving size for later content assignment (like pipe)
        // Use individual moving block counts if available
        let movingSize: number;
        if (
          config.movingBlockCounts &&
          config.movingBlockCounts[index] !== undefined
        ) {
          movingSize = config.movingBlockCounts[index];
        } else if (config.movingBlockCount) {
          movingSize = config.movingBlockCount;
        } else {
          movingSize = LevelGeneratorUtils.generatePipeSize(config.difficulty); // Use same logic as pipe
        }

        board[pos.y][pos.x].movingSize = movingSize;

        // Generate random distance (1-3 cells)
        board[pos.y][pos.x].movingDistance = Math.floor(Math.random() * 3) + 1;

        return true;
      } else {
        // If no valid direction, don't place moving element
        board[pos.y][pos.x].element = null;
        return false;
      }
    }

    return true;
  }

  /**
   * Generate containers for the level
   */
  static generateContainers(config: LevelConfig): Container[] {
    const containerCount = Math.max(3, Math.ceil(config.blockCount / 12));
    const containers: Container[] = [];

    for (let i = 0; i < containerCount; i++) {
      const slots = Math.floor(Math.random() * 3) + 3; // 3-5 slots
      const initialFill = Math.max(1, Math.floor(Math.random() * (slots - 1))); // At least 1, max slots-1

      const contents = [];
      for (let j = 0; j < initialFill; j++) {
        contents.push({
          color:
            config.selectedColors[
              Math.floor(Math.random() * config.selectedColors.length)
            ],
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

  /**
   * Check if level is solvable (simplified implementation)
   */
  static checkSolvability(): // _board: BoardCell[][],
  // _containers: Container[]
  boolean {
    return true; // Simplified for fallback
  }

  /**
   * Adjust level to meet color balance requirements (all colors divisible by 3)
   */
  private static adjustLevelToMeetStats(
    level: GeneratedLevel
  ): GeneratedLevel | null {
    const board = level.board.map((row) => row.map((cell) => ({ ...cell })));

    // Calculate current color statistics
    const colors = level.config.selectedColors;
    const colorCounts: Record<string, number> = Object.fromEntries(
      colors.map((c) => [c, 0])
    );
    let coloredBlocksOnBoard = 0;
    let totalPipeContents = 0;
    let totalMovingContents = 0;

    for (const row of board) {
      for (const cell of row) {
        if (cell.type === "block") {
          if (cell.element === "Pipe") {
            if (cell.pipeContents) {
              for (const color of cell.pipeContents) {
                colorCounts[color] = (colorCounts[color] || 0) + 1;
                totalPipeContents++;
              }
            }
          } else if (cell.element === "Moving") {
            if (cell.movingContents) {
              for (const color of cell.movingContents) {
                colorCounts[color] = (colorCounts[color] || 0) + 1;
                totalMovingContents++;
              }
            }
          } else if (cell.color) {
            colorCounts[cell.color] = (colorCounts[cell.color] || 0) + 1;
            coloredBlocksOnBoard++;
          }
        }
      }
    }

    const targetTotal = level.config.blockCount;
    let currentPlayable =
      coloredBlocksOnBoard + totalPipeContents + totalMovingContents;

    if (currentPlayable > targetTotal) {
      // Cannot fix if we exceed target
      return null;
    }

    // Calculate deficit for each color to be divisible by 3
    const deficitPerColor: Array<{ color: string; needed: number }> = [];
    for (const color of colors) {
      const count = colorCounts[color] || 0;
      const remainder = count % 3;
      const needed = remainder === 0 ? 0 : 3 - remainder;
      if (needed > 0) deficitPerColor.push({ color, needed });
    }

    // Helper function to get remaining capacity
    const remainingCapacity = () => targetTotal - currentPlayable;

    // Helper function to get next connected empty position with better distribution
    const takeNextConnectedEmpty = () => {
      const connectedPositions = LevelGeneratorUtils.getConnectedPositions(
        board,
        level.config.width,
        level.config.height
      );

      if (connectedPositions.length > 0) {
        // Shuffle positions for better distribution
        for (let i = connectedPositions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [connectedPositions[i], connectedPositions[j]] = [
            connectedPositions[j],
            connectedPositions[i],
          ];
        }

        // Prefer positions that are more spread out
        // Sort by distance from center to encourage spreading
        const centerX = Math.floor(level.config.width / 2);
        const centerY = Math.floor(level.config.height / 2);

        connectedPositions.sort((a, b) => {
          const distA = Math.abs(a.x - centerX) + Math.abs(a.y - centerY);
          const distB = Math.abs(b.x - centerX) + Math.abs(b.y - centerY);
          // Prefer positions further from center for better spread
          return distB - distA;
        });

        // Return a random position from the top 3 furthest positions
        const topPositions = connectedPositions.slice(
          0,
          Math.min(3, connectedPositions.length)
        );
        return topPositions[Math.floor(Math.random() * topPositions.length)];
      }

      // Fallback: find any empty position (should rarely happen)
      for (let y = 0; y < level.config.height; y++) {
        for (let x = 0; x < level.config.width; x++) {
          if (board[y][x].type === "empty") {
            return { x, y };
          }
        }
      }
      return null;
    };

    // First, fill deficits to make each color divisible by 3
    for (const deficit of deficitPerColor) {
      for (let i = 0; i < deficit.needed && remainingCapacity() > 0; i++) {
        const pos = takeNextConnectedEmpty();
        if (!pos) break;
        board[pos.y][pos.x] = {
          type: "block",
          color: deficit.color,
          element: null,
        };
        currentPlayable += 1;
      }
    }

    // If still need more blocks, distribute evenly in multiples of 3
    let colorIndex = 0;
    while (remainingCapacity() >= 3) {
      const color = colors[colorIndex % colors.length];
      for (let i = 0; i < 3 && remainingCapacity() > 0; i++) {
        const pos = takeNextConnectedEmpty();
        if (!pos) break;
        board[pos.y][pos.x] = {
          type: "block",
          color,
          element: null,
        };
        currentPlayable += 1;
      }
      colorIndex++;
    }

    // Fill any remaining blocks with first color
    while (remainingCapacity() > 0) {
      const pos = takeNextConnectedEmpty();
      if (!pos) break;
      const color = colors[0];
      board[pos.y][pos.x] = {
        type: "block",
        color,
        element: null,
      };
      currentPlayable += 1;
    }

    const adjusted: GeneratedLevel = {
      ...level,
      board,
    };

    return this.isLevelValid(adjusted) ? adjusted : null;
  }

  /**
   * Check if level meets all validation requirements
   */
  private static isLevelValid(level: GeneratedLevel): boolean {
    // Check basic structure
    if (!level.board || level.board.length !== level.config.height)
      return false;
    if (!level.board.every((row) => row.length === level.config.width))
      return false;

    // Count playable blocks: colored blocks on board + pipe contents + moving contents
    let coloredBlocksOnBoard = 0;
    let totalPipeContents = 0;
    let totalMovingContents = 0;
    const colorCounts: Record<string, number> = {};

    for (const row of level.board) {
      for (const cell of row) {
        if (cell.type === "block") {
          if (cell.element === "Pipe") {
            if (cell.pipeContents) {
              for (const color of cell.pipeContents) {
                colorCounts[color] = (colorCounts[color] || 0) + 1;
                totalPipeContents++;
              }
            }
          } else if (cell.element === "Moving") {
            if (cell.movingContents) {
              for (const color of cell.movingContents) {
                colorCounts[color] = (colorCounts[color] || 0) + 1;
                totalMovingContents++;
              }
            }
          } else if (cell.color) {
            colorCounts[cell.color] = (colorCounts[cell.color] || 0) + 1;
            coloredBlocksOnBoard++;
          }
        }
      }
    }

    // Check total playable blocks matches target
    const actualPlayableBlocks =
      coloredBlocksOnBoard + totalPipeContents + totalMovingContents;

    if (actualPlayableBlocks !== level.config.blockCount) {
      return false;
    }

    // Check each color is divisible by 3
    for (const count of Object.values(colorCounts)) {
      if (count % 3 !== 0) {
        return false;
      }
    }

    return true;
  }

  /**
   * Assign balanced moving contents after all moving elements are placed
   * This should work together with the overall color balance system
   */
  private static assignBalancedMovingContents(
    board: BoardCell[][],
    config: LevelConfig,
    _targetPerColor?: number[] // eslint-disable-line @typescript-eslint/no-unused-vars
  ): void {
    const colors = config.selectedColors;

    // Count current colors on board (excluding pipe and moving contents)
    const currentColorCounts = new Map<string, number>();
    let totalMovingBlocks = 0;
    let _totalPipeBlocks = 0; // eslint-disable-line @typescript-eslint/no-unused-vars

    for (let y = 0; y < config.height; y++) {
      for (let x = 0; x < config.width; x++) {
        const cell = board[y][x];

        // Count regular blocks (not pipe or moving)
        if (cell.type === "block" && cell.color && !cell.element) {
          currentColorCounts.set(
            cell.color,
            (currentColorCounts.get(cell.color) || 0) + 1
          );
        }

        // Count pipe contents
        if (cell.element === "Pipe" && cell.pipeContents) {
          _totalPipeBlocks += cell.pipeContents.length;
          for (const pipeColor of cell.pipeContents) {
            currentColorCounts.set(
              pipeColor,
              (currentColorCounts.get(pipeColor) || 0) + 1
            );
          }
        }

        // Count moving blocks to fill
        if (cell.element === "Moving" && cell.movingSize) {
          totalMovingBlocks += cell.movingSize;
        }
      }
    }

    if (totalMovingBlocks === 0) {
      return;
    }

    // Moving elements should always be filled completely
    // The color balance will be handled by adjustLevelToMeetStats later
    const actualMovingBlocks = totalMovingBlocks;

    if (actualMovingBlocks <= 0) {
      return;
    }

    // Create color pool for moving contents based on what's needed to balance colors
    const movingColorPool: string[] = [];

    // Simple approach: distribute moving blocks evenly among colors
    // ensuring the total for each color (board + pipe + moving) is divisible by 3
    const blocksPerColor = Math.floor(actualMovingBlocks / colors.length);
    const extraBlocks = actualMovingBlocks % colors.length;

    // Distribute evenly first
    for (let i = 0; i < colors.length; i++) {
      const color = colors[i];
      const baseBlocks = blocksPerColor + (i < extraBlocks ? 1 : 0);

      for (let j = 0; j < baseBlocks; j++) {
        movingColorPool.push(color);
      }
    }

    // Shuffle for randomness
    for (let i = movingColorPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [movingColorPool[i], movingColorPool[j]] = [
        movingColorPool[j],
        movingColorPool[i],
      ];
    }

    // Assign colors to moving elements
    let colorIndex = 0;
    for (let y = 0; y < config.height; y++) {
      for (let x = 0; x < config.width; x++) {
        const cell = board[y][x];
        if (cell.element === "Moving" && cell.movingSize) {
          const movingContents: string[] = [];
          for (
            let i = 0;
            i < cell.movingSize && colorIndex < movingColorPool.length;
            i++
          ) {
            movingContents.push(movingColorPool[colorIndex]);
            colorIndex++;
          }
          cell.movingContents = movingContents;
        }
      }
    }
  }

  /**
   * Assign balanced pipe contents after all pipes are placed
   */
  private static assignBalancedPipeContents(
    board: BoardCell[][],
    config: LevelConfig,
    targetPerColor?: number[]
  ): void {
    const colors = config.selectedColors;

    // Count board colors and pipe blocks
    const boardColorCounts = new Map<string, number>();
    let totalPipeBlocks = 0;

    for (let y = 0; y < config.height; y++) {
      for (let x = 0; x < config.width; x++) {
        const cell = board[y][x];
        if (cell.type === "block" && cell.color) {
          boardColorCounts.set(
            cell.color,
            (boardColorCounts.get(cell.color) || 0) + 1
          );
        }
        if (cell.element === "Pipe" && cell.pipeSize) {
          totalPipeBlocks += cell.pipeSize;
        }
        if (cell.element === "Moving" && cell.movingSize) {
          totalPipeBlocks += cell.movingSize; // Count moving blocks as part of total special blocks
        }
      }
    }

    if (totalPipeBlocks === 0) {
      return;
    }

    // Calculate how many pipe blocks each color needs
    const pipeColorPool: string[] = [];

    if (targetPerColor) {
      // Use target-based distribution
      colors.forEach((color, index) => {
        const boardCount = boardColorCounts.get(color) || 0;
        const target = targetPerColor[index];
        const needed = Math.max(0, target - boardCount);

        for (let i = 0; i < needed; i++) {
          pipeColorPool.push(color);
        }
      });
    } else {
      // Fallback: create varied distribution even without explicit targets
      const baseBlocksPerColor =
        Math.floor(totalPipeBlocks / colors.length / 3) * 3;
      const totalBaseBlocks = baseBlocksPerColor * colors.length;
      let extraBlocks = totalPipeBlocks - totalBaseBlocks;

      // Ensure extra blocks are in multiples of 3
      extraBlocks = Math.floor(extraBlocks / 3) * 3;
      const adjustedTotal = totalBaseBlocks + extraBlocks;

      // Create variation in pipe distribution
      const pipeTargets: number[] = [];
      for (let i = 0; i < colors.length; i++) {
        // Add some random variation (but keep multiples of 3)
        const variation = Math.floor(Math.random() * 3) - 1; // -1, 0, or +1 sets of 3
        const target = Math.max(0, baseBlocksPerColor + variation * 3);
        pipeTargets.push(target);
      }

      // Adjust to match total
      const currentPipeTotal = pipeTargets.reduce(
        (sum, target) => sum + target,
        0
      );
      const pipeDifference = adjustedTotal - currentPipeTotal;

      if (pipeDifference !== 0) {
        const adjustmentSets = Math.floor(Math.abs(pipeDifference) / 3);
        for (let i = 0; i < adjustmentSets; i++) {
          const randomIndex = Math.floor(Math.random() * colors.length);
          if (pipeDifference > 0) {
            pipeTargets[randomIndex] += 3;
          } else if (pipeTargets[randomIndex] >= 3) {
            pipeTargets[randomIndex] -= 3;
          }
        }
      }

      // Fill pipe color pool based on varied targets
      colors.forEach((color, index) => {
        for (let i = 0; i < pipeTargets[index]; i++) {
          pipeColorPool.push(color);
        }
      });
    }

    // Shuffle for randomness
    for (let i = pipeColorPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pipeColorPool[i], pipeColorPool[j]] = [
        pipeColorPool[j],
        pipeColorPool[i],
      ];
    }

    // Assign colors to pipes
    let colorIndex = 0;
    for (let y = 0; y < config.height; y++) {
      for (let x = 0; x < config.width; x++) {
        const cell = board[y][x];
        if (
          cell.element === "Pipe" &&
          cell.pipeSize &&
          colorIndex < pipeColorPool.length
        ) {
          const pipeContents: string[] = [];
          for (
            let i = 0;
            i < cell.pipeSize && colorIndex < pipeColorPool.length;
            i++
          ) {
            pipeContents.push(pipeColorPool[colorIndex]);
            colorIndex++;
          }
          cell.pipeContents = pipeContents;
        }
      }
    }
  }

  /**
   * Validate that all colors have blocks divisible by 3
   */
  private static validateColorBalance(
    board: BoardCell[][],
    config: LevelConfig
  ): void {
    const colorCounts = new Map<string, number>();

    // Count colors on board and in pipes
    for (let y = 0; y < config.height; y++) {
      for (let x = 0; x < config.width; x++) {
        const cell = board[y][x];
        if (cell.type === "block" && cell.color) {
          colorCounts.set(cell.color, (colorCounts.get(cell.color) || 0) + 1);
        }
        if (cell.element === "Pipe" && cell.pipeContents) {
          for (const pipeColor of cell.pipeContents) {
            colorCounts.set(pipeColor, (colorCounts.get(pipeColor) || 0) + 1);
          }
        }
        if (cell.element === "Moving" && cell.movingContents) {
          for (const movingColor of cell.movingContents) {
            colorCounts.set(
              movingColor,
              (colorCounts.get(movingColor) || 0) + 1
            );
          }
        }
      }
    }
  }
}
