import type {
  LevelConfig,
  BoardCell,
  Container,
  GeneratedLevel,
} from "@/config/game-types";
import { AI_GENERATION_CONFIG } from "@/config/game-constants";
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
    console.log("generateFallbackLevel", board);

    const reason = !AI_GENERATION_CONFIG.ENABLE_AI_GENERATION
      ? "Fallback level - AI generation bị tắt"
      : AI_GENERATION_CONFIG.FORCE_USE_FALLBACK
      ? "Fallback level - Bắt buộc sử dụng thuật toán"
      : "Fallback level - Gemini API không khả dụng";

    // Extract pipe and lock information for UI
    const pipeInfo = LevelGeneratorUtils.extractPipeInfo(board, config);
    const lockInfo = LevelGeneratorUtils.extractLockInfo(board, config);

    return {
      id: `fallback_level_${Date.now()}`,
      config: { ...config },
      board,
      containers: this.generateContainers(config),
      difficultyScore: LevelGeneratorUtils.calculateDifficultyScore(config),
      solvable: true, // Fallback algorithm ensures connectivity so it's solvable
      timestamp: new Date(),
      aiReasoning: reason,
      pipeInfo,
      lockInfo,
    };
  }

  /**
   * Generate game board based on configuration
   */
  static generateBoard(config: LevelConfig): BoardCell[][] {
    console.log("generateFallbackBoard", config);
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

    // Calculate pipe and lock blocks
    const pipeCount = config.elements.Pipe || 0;
    const blockLockCount =
      config.elements["BlockLock"] || config.elements["Block Lock"] || 0;
    const pipeRange = LevelGeneratorUtils.getPipeBlockRange(config.difficulty);
    const pipeBlocks = Math.floor(pipeCount * pipeRange.avg);
    const lockBlocks = blockLockCount * 2;

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
    const adjustedBoardBlocks = config.blockCount - pipeBlocks - lockBlocks;
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
        console.warn("No more connected positions available, breaking early");
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

    // Place special elements (without pipe contents first)
    this.placeSpecialElements(board, config);

    // Calculate and assign balanced pipe contents after all pipes are placed
    this.assignBalancedPipeContents(board, config, finalTargetPerColor);

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
    const pipeRange = LevelGeneratorUtils.getPipeBlockRange(config.difficulty);
    const pipeBlocks = Math.floor(pipeCount * pipeRange.avg);
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

    console.log(
      `[DEBUG Symmetric] Board color distribution: ${boardColorDistribution.length} blocks`
    );

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
        console.warn(
          "No more connected positions available for symmetric placement"
        );
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
        console.warn(
          "Failed to place symmetric block after trying multiple positions, breaking"
        );
        break;
      }
    }

    // Place special elements symmetrically (without pipe contents first)
    this.placeSpecialElementsSymmetrically(board, config, centerX);

    // Calculate and assign balanced pipe contents after all pipes are placed
    this.assignBalancedPipeContents(board, config, finalTargetPerColor);

    // Final connectivity check and validation
    const isConnectedBoard = LevelGeneratorUtils.isConnected(board);
    console.log(
      `[v2] Symmetric board generated: ${placedBlocks} blocks placed (requested: ${totalBlocks}), connected: ${isConnectedBoard}`
    );

    if (!isConnectedBoard) {
      console.warn(
        "Generated symmetric board is not connected, this should not happen!"
      );
    }

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
        console.log(`[DEBUG] Placing ${count} ${elementType} elements`);

        const blockPositions = [];
        for (let y = 0; y < config.height; y++) {
          for (let x = 0; x < config.width; x++) {
            if (board[y][x].type === "block" && !board[y][x].element) {
              blockPositions.push({ x, y });
            }
          }
        }

        console.log(
          `[DEBUG] Available positions for ${elementType}: ${blockPositions.length}`
        );

        if (blockPositions.length === 0) {
          console.warn(`[DEBUG] No available positions for ${elementType}`);
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
            console.log(
              `[DEBUG] Successfully placed ${elementType} ${placedCount}/${count} at (${pos.x}, ${pos.y})`
            );
          }

          attempts++;
        }

        console.log(
          `[DEBUG] Final count for ${elementType}: ${placedCount}/${count} placed`
        );

        if (placedCount < count) {
          console.warn(
            `[DEBUG] Could not place all ${elementType} elements: ${placedCount}/${count}`
          );
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
        console.log(
          `[DEBUG Symmetric] Placing ${count} ${elementType} elements symmetrically`
        );

        // Get all available positions on the left side (including center if odd width)
        const leftSidePositions = [];
        for (let y = 0; y < config.height; y++) {
          for (let x = 0; x <= centerX; x++) {
            if (board[y][x].type === "block" && !board[y][x].element) {
              leftSidePositions.push({ x, y });
            }
          }
        }

        console.log(
          `[DEBUG Symmetric] Available left-side positions for ${elementType}: ${leftSidePositions.length}`
        );

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
              console.log(
                `[DEBUG Symmetric] Placed ${elementType} ${placedCount}/${count} at center (${pos.x}, ${pos.y})`
              );
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
                  console.log(
                    `[DEBUG Symmetric] Placed ${elementType} pair ${
                      placedCount - 1
                    }-${placedCount}/${count} at (${pos.x}, ${
                      pos.y
                    }) and (${mirrorX}, ${pos.y})`
                  );
                } else {
                  // If mirror failed, remove the left one to maintain symmetry
                  board[pos.y][pos.x].element = null;
                  console.log(
                    `[DEBUG Symmetric] Failed to place mirror, removed left element to maintain symmetry`
                  );
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
                console.log(
                  `[DEBUG Symmetric] Placed final ${elementType} ${placedCount}/${count} at center (${pos.x}, ${pos.y})`
                );
              }
            }
          }
        }

        console.log(
          `[DEBUG Symmetric] Final count for ${elementType}: ${placedCount}/${count} placed`
        );

        if (placedCount < count) {
          console.warn(
            `[DEBUG Symmetric] Could not place all ${elementType} elements symmetrically: ${placedCount}/${count}`
          );
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
        const pipeSize = LevelGeneratorUtils.generatePipeSize(
          config.difficulty
        );
        board[pos.y][pos.x].pipeSize = pipeSize;
        console.log(
          `[DEBUG] Created pipe block (no color) at (${pos.x}, ${
            pos.y
          }) with direction ${
            board[pos.y][pos.x].pipeDirection
          } and ${pipeSize} blocks (contents will be assigned later)`
        );
        return true;
      } else {
        // If no valid direction, don't place pipe element
        console.warn(
          `No valid direction for pipe at (${pos.x}, ${pos.y}), removing pipe element`
        );
        board[pos.y][pos.x].element = null;
        return false;
      }
    }

    // If it's a Block Lock, we need to place both Lock and Key
    if (elementType === "BlockLock" || elementType === "Block Lock") {
      // Generate unique lock ID
      const lockId = `lock_${index + 1}`;
      board[pos.y][pos.x].lockId = lockId;
      console.log(
        `[DEBUG] Placed Block Lock ${lockId} at (${pos.x}, ${pos.y})`
      );

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
        console.log(
          `[DEBUG] Placed Key element ${lockId} at (${keyPos.x}, ${keyPos.y})`
        );
        return true;
      } else {
        console.warn(
          `No suitable position for Key ${lockId}, removing Block Lock`
        );
        board[pos.y][pos.x].element = null;
        board[pos.y][pos.x].lockId = undefined;
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
  static checkSolvability(
    _board: BoardCell[][],
    _containers: Container[]
  ): boolean {
    console.log("checkSolvability", _board, _containers);
    return true; // Simplified for fallback
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
      }
    }
  }
}
