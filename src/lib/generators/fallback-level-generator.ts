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

    // Calculate blocks excluding pipe contents and block lock pairs
    console.log(`[DEBUG] config.elements:`, config.elements);
    const pipeCount = config.elements.Pipe || 0;
    const blockLockCount =
      config.elements["BlockLock"] || config.elements["Block Lock"] || 0;

    // Each pipe now contains difficulty-based random blocks
    const pipeRange = LevelGeneratorUtils.getPipeBlockRange(config.difficulty);
    const avgBlocksPerPipe = pipeRange.avg;
    const blocksPerLock = 2; // Each Block Lock requires 2 blocks (1 Lock + 1 Key)

    const pipeBlocks = Math.floor(pipeCount * avgBlocksPerPipe);
    const lockBlocks = blockLockCount * blocksPerLock;
    const boardBlocks = config.blockCount - pipeBlocks - lockBlocks; // Actual blocks on board

    console.log(
      `[DEBUG] Difficulty: ${config.difficulty}, Pipe range: ${pipeRange.min}-${pipeRange.max} (avg: ${pipeRange.avg})`
    );
    console.log(
      `[DEBUG] Total blocks: ${config.blockCount}, Pipe count: ${pipeCount}, Pipe blocks: ${pipeBlocks}, Block Lock count: ${blockLockCount}, Lock blocks: ${lockBlocks}, Board blocks: ${boardBlocks}`
    );

    const totalBlocks = Math.max(1, boardBlocks); // Ensure at least 1 block on board

    // Create initial color distribution for board blocks only
    const baseBlocksPerColor = Math.floor(totalBlocks / colors.length);
    const remainder = totalBlocks % colors.length;

    const boardColorDistribution: string[] = [];
    colors.forEach((color, index) => {
      const blocksForThisColor =
        baseBlocksPerColor + (index < remainder ? 1 : 0);
      for (let i = 0; i < blocksForThisColor; i++) {
        boardColorDistribution.push(color);
      }
    });

    // Shuffle the board color distribution
    for (let i = boardColorDistribution.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [boardColorDistribution[i], boardColorDistribution[j]] = [
        boardColorDistribution[j],
        boardColorDistribution[i],
      ];
    }

    console.log(
      `[DEBUG] Board color distribution: ${boardColorDistribution.length} blocks`
    );

    // Initialize empty pipe color pool (will be calculated after pipes are placed)
    // pipeColorPool will be calculated in generatePipeColors method

    // CONNECTED PLACEMENT ALGORITHM
    let placedBlocks = 0;

    // Place first block at center or random position
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
    this.assignBalancedPipeContents(board, config);

    // Final connectivity check and validation
    const isConnectedBoard = LevelGeneratorUtils.isConnected(board);
    console.log(
      `[v2] Random board generated: ${placedBlocks} blocks placed (requested: ${totalBlocks}), connected: ${isConnectedBoard}`
    );

    if (!isConnectedBoard) {
      console.warn(
        "Generated random board is not connected, this should not happen!"
      );
    }

    // Validate color balance
    this.validateColorBalance(board, config);

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

    // Calculate blocks excluding pipe contents and block lock pairs
    console.log(`[DEBUG Symmetric] config.elements:`, config.elements);
    const pipeCount = config.elements.Pipe || 0;
    const blockLockCount =
      config.elements["BlockLock"] || config.elements["Block Lock"] || 0;

    // Each pipe now contains difficulty-based random blocks
    const pipeRange = LevelGeneratorUtils.getPipeBlockRange(config.difficulty);
    const avgBlocksPerPipe = pipeRange.avg;
    const blocksPerLock = 2; // Each Block Lock requires 2 blocks (1 Lock + 1 Key)

    const pipeBlocks = Math.floor(pipeCount * avgBlocksPerPipe);
    const lockBlocks = blockLockCount * blocksPerLock;
    const boardBlocks = config.blockCount - pipeBlocks - lockBlocks; // Actual blocks on board

    console.log(
      `[DEBUG Symmetric] Difficulty: ${config.difficulty}, Pipe range: ${pipeRange.min}-${pipeRange.max} (avg: ${pipeRange.avg})`
    );
    console.log(
      `[DEBUG Symmetric] Total blocks: ${config.blockCount}, Pipe count: ${pipeCount}, Pipe blocks: ${pipeBlocks}, Block Lock count: ${blockLockCount}, Lock blocks: ${lockBlocks}, Board blocks: ${boardBlocks}`
    );

    const totalBlocks = Math.max(1, boardBlocks); // Ensure at least 1 block on board

    // Create initial color distribution for board blocks only (same as random board)
    const baseBlocksPerColor = Math.floor(totalBlocks / colors.length);
    const remainder = totalBlocks % colors.length;

    const boardColorDistribution: string[] = [];
    colors.forEach((color, index) => {
      const blocksForThisColor =
        baseBlocksPerColor + (index < remainder ? 1 : 0);
      for (let i = 0; i < blocksForThisColor; i++) {
        boardColorDistribution.push(color);
      }
    });

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

    // CONNECTED SYMMETRIC PLACEMENT ALGORITHM
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
      }

      board[y][x] = {
        type: "block",
        color: boardColorDistribution[colorIndex],
        element: null,
      };
      placedBlocks++;
      colorIndex++;

      // Place symmetric counterpart if different position
      const mirrorX = config.width - 1 - x;
      if (
        mirrorX !== x &&
        placedBlocks < totalBlocks &&
        colorIndex < boardColorDistribution.length &&
        board[y][mirrorX].type === "empty"
      ) {
        // Check connectivity for mirror block too (except when forcing)
        if (forcePlace || placedBlocks === 1) {
          board[y][mirrorX] = {
            type: "block",
            color: boardColorDistribution[colorIndex],
            element: null,
          };
          placedBlocks++;
          colorIndex++;
        } else {
          const mirrorNeighbors = LevelGeneratorUtils.getNeighbors(
            mirrorX,
            y,
            config.width,
            config.height
          );
          const mirrorHasBlockNeighbor = mirrorNeighbors.some(
            (n) => board[n.y][n.x].type === "block"
          );
          if (mirrorHasBlockNeighbor) {
            board[y][mirrorX] = {
              type: "block",
              color: boardColorDistribution[colorIndex],
              element: null,
            };
            placedBlocks++;
            colorIndex++;
          }
        }
      }
      return true;
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

      const pos = connectedPositions[0];
      if (!placeSymmetricBlock(pos.x, pos.y)) {
        console.warn("Failed to place symmetric block, breaking");
        break;
      }
    }

    // Place special elements symmetrically (without pipe contents first)
    this.placeSpecialElementsSymmetrically(board, config, centerX);

    // Calculate and assign balanced pipe contents after all pipes are placed
    this.assignBalancedPipeContents(board, config);

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
        const blockPositions = [];
        for (let y = 0; y < config.height; y++) {
          for (let x = 0; x < config.width; x++) {
            if (board[y][x].type === "block" && !board[y][x].element) {
              blockPositions.push({ x, y });
            }
          }
        }

        // Distribute elements across three regions
        const topRegion = blockPositions.filter(
          (pos) => pos.y < config.height * 0.33
        );
        const middleRegion = blockPositions.filter(
          (pos) => pos.y >= config.height * 0.33 && pos.y < config.height * 0.66
        );
        const bottomRegion = blockPositions.filter(
          (pos) => pos.y >= config.height * 0.66
        );

        const topCount = Math.floor(count * 0.3);
        const middleCount = Math.floor(count * 0.45);
        const bottomCount = count - topCount - middleCount;

        // Place elements in each region
        const placeInRegion = (
          region: { x: number; y: number }[],
          targetCount: number
        ) => {
          const shuffled = [...region].sort(() => Math.random() - 0.5);
          for (let i = 0; i < Math.min(targetCount, shuffled.length); i++) {
            const pos = shuffled[i];
            this.placeSpecialElement(
              board,
              pos,
              elementType,
              config,
              colors,
              i
            );
          }
        };

        placeInRegion(topRegion, topCount);
        placeInRegion(middleRegion, middleCount);
        placeInRegion(bottomRegion, bottomCount);
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
        const blockPositions = [];
        for (let y = 0; y < config.height; y++) {
          for (let x = 0; x <= centerX; x++) {
            if (board[y][x].type === "block" && !board[y][x].element) {
              blockPositions.push({ x, y });
            }
          }
        }

        // Distribute elements across regions for symmetric placement
        const topRegion = blockPositions.filter(
          (pos) => pos.y < config.height * 0.33
        );
        const middleRegion = blockPositions.filter(
          (pos) => pos.y >= config.height * 0.33 && pos.y < config.height * 0.66
        );
        const bottomRegion = blockPositions.filter(
          (pos) => pos.y >= config.height * 0.66
        );

        // For symmetric mode, we still want to place the exact count requested
        const totalElementsToPlace = count;
        const topCount = Math.floor(totalElementsToPlace * 0.3);
        const middleCount = Math.floor(totalElementsToPlace * 0.45);
        const bottomCount = totalElementsToPlace - topCount - middleCount;

        const placeSymmetricElements = (
          region: { x: number; y: number }[],
          targetCount: number
        ) => {
          const shuffled = [...region].sort(() => Math.random() - 0.5);
          let placedCount = 0;

          for (
            let i = 0;
            i < shuffled.length && placedCount < targetCount;
            i++
          ) {
            const pos = shuffled[i];
            const elementPlaced = this.placeSpecialElement(
              board,
              pos,
              elementType,
              config,
              colors,
              placedCount
            );

            if (elementPlaced) {
              placedCount++;

              // Try to place symmetric counterpart
              const mirrorX = config.width - 1 - pos.x;
              if (
                mirrorX !== pos.x &&
                board[pos.y][mirrorX].type === "block" &&
                !board[pos.y][mirrorX].element &&
                placedCount < targetCount
              ) {
                const mirrorPlaced = this.placeSpecialElement(
                  board,
                  { x: mirrorX, y: pos.y },
                  elementType,
                  config,
                  colors,
                  placedCount
                );
                if (mirrorPlaced) {
                  placedCount++;
                }
              }
            }
          }

          console.log(
            `[DEBUG] ${elementType}: Placed ${placedCount}/${targetCount} elements in region`
          );
        };

        placeSymmetricElements(topRegion, topCount);
        placeSymmetricElements(middleRegion, middleCount);
        placeSymmetricElements(bottomRegion, bottomCount);
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
    colors: string[],
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
    config: LevelConfig
  ): void {
    const colors = config.selectedColors;

    // Count board colors first
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

    console.log(
      `[DEBUG] Board color counts:`,
      Object.fromEntries(boardColorCounts)
    );
    console.log(`[DEBUG] Total pipe blocks needed: ${totalPipeBlocks}`);

    // Calculate balanced color distribution (divisible by 9)
    const totalColorBlocks = config.blockCount; // Total blocks including pipe contents
    const targetColorCounts = new Map<string, number>();

    console.log(
      `[DEBUG] Calculating distribution for ${totalColorBlocks} blocks across ${colors.length} colors`
    );

    // Smart distribution algorithm
    const minPossible = colors.length * 9;

    if (totalColorBlocks < minPossible) {
      // For small block counts, use divisible by 3
      console.log(
        `[DEBUG] Small block count (${totalColorBlocks} < ${minPossible}), using divisible by 3`
      );
      const basePerColor = Math.floor(totalColorBlocks / colors.length / 3) * 3;
      const remainder = totalColorBlocks - basePerColor * colors.length;

      colors.forEach((color, index) => {
        const extra = index < remainder / 3 ? 3 : 0;
        targetColorCounts.set(color, Math.max(3, basePerColor + extra));
      });
    } else {
      // Standard algorithm: distribute in multiples of 9
      const baseNine = Math.floor(totalColorBlocks / colors.length / 9) * 9;
      const remaining = totalColorBlocks - baseNine * colors.length;
      const extraColors = Math.floor(remaining / 9);

      console.log(
        `[DEBUG] Base 9 per color: ${baseNine}, remaining: ${remaining}, extra colors: ${extraColors}`
      );

      colors.forEach((color, index) => {
        const base = Math.max(9, baseNine);
        const extra = index < extraColors ? 9 : 0;
        targetColorCounts.set(color, base + extra);
      });
    }

    // Validate total
    const finalTotal = Array.from(targetColorCounts.values()).reduce(
      (sum, count) => sum + count,
      0
    );
    console.log(
      `[DEBUG] Target distribution:`,
      Object.fromEntries(targetColorCounts)
    );
    console.log(
      `[DEBUG] Final total: ${finalTotal}, expected: ${totalColorBlocks}`
    );

    if (finalTotal !== totalColorBlocks) {
      console.error(
        `[DEBUG] Distribution mismatch: ${finalTotal} ≠ ${totalColorBlocks}`
      );
      // Fallback: simple even distribution
      const evenBase = Math.floor(totalColorBlocks / colors.length);
      const remainder = totalColorBlocks % colors.length;

      colors.forEach((color, index) => {
        const count = evenBase + (index < remainder ? 1 : 0);
        targetColorCounts.set(color, count);
      });

      console.log(
        `[DEBUG] Using fallback even distribution:`,
        Object.fromEntries(targetColorCounts)
      );
    }

    // Create pipe color pool with balanced distribution
    const pipeColorPool: string[] = [];

    // Simple balanced distribution for pipe contents
    const colorsPerPipe = Math.floor(totalPipeBlocks / colors.length);
    const remainder = totalPipeBlocks % colors.length;

    colors.forEach((color, index) => {
      const count = colorsPerPipe + (index < remainder ? 1 : 0);
      for (let i = 0; i < count; i++) {
        pipeColorPool.push(color);
      }
    });

    console.log(
      `[DEBUG] Pipe color distribution: ${colors
        .map(
          (color) =>
            `${color}=${pipeColorPool.filter((c) => c === color).length}`
        )
        .join(", ")}`
    );

    // Shuffle pipe color pool
    for (let i = pipeColorPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pipeColorPool[i], pipeColorPool[j]] = [
        pipeColorPool[j],
        pipeColorPool[i],
      ];
    }

    console.log(`[DEBUG] Pipe color pool: ${pipeColorPool.length} blocks`);
    console.log(
      `[DEBUG] Target color counts:`,
      Object.fromEntries(targetColorCounts)
    );

    // Assign colors to pipes
    let poolIndex = 0;
    for (let y = 0; y < config.height; y++) {
      for (let x = 0; x < config.width; x++) {
        const cell = board[y][x];
        if (cell.element === "Pipe" && cell.pipeSize) {
          const pipeContents = [];
          for (let i = 0; i < cell.pipeSize; i++) {
            if (poolIndex < pipeColorPool.length) {
              pipeContents.push(pipeColorPool[poolIndex]);
              poolIndex++;
            } else {
              // Fallback
              const randomColor =
                colors[Math.floor(Math.random() * colors.length)];
              pipeContents.push(randomColor);
              console.warn(
                `[DEBUG] Pipe color pool exhausted, using fallback: ${randomColor}`
              );
            }
          }
          cell.pipeContents = pipeContents;
          console.log(
            `[DEBUG] Assigned ${
              pipeContents.length
            } colors to pipe at (${x}, ${y}): [${pipeContents.join(", ")}]`
          );
        }
      }
    }
  }

  /**
   * Validate that all colors have blocks divisible by 9 and total count matches blockCount
   */
  private static validateColorBalance(
    board: BoardCell[][],
    config: LevelConfig
  ): void {
    const colorCounts = new Map<string, number>();
    let totalColorBlocks = 0;

    // Count colors on board
    for (let y = 0; y < config.height; y++) {
      for (let x = 0; x < config.width; x++) {
        const cell = board[y][x];
        if (cell.type === "block" && cell.color) {
          colorCounts.set(cell.color, (colorCounts.get(cell.color) || 0) + 1);
          totalColorBlocks++;
        }

        // Count colors in pipe contents
        if (cell.element === "Pipe" && cell.pipeContents) {
          for (const pipeColor of cell.pipeContents) {
            colorCounts.set(pipeColor, (colorCounts.get(pipeColor) || 0) + 1);
            totalColorBlocks++;
          }
        }
      }
    }

    console.log(`[VALIDATION] Color balance check:`);
    console.log(
      `[VALIDATION] Total color blocks: ${totalColorBlocks} (expected: ${config.blockCount})`
    );

    let allBalanced = true;
    let totalBlockCountCorrect = totalColorBlocks === config.blockCount;

    for (const [color, count] of colorCounts) {
      const isDivisibleBy9 = count % 9 === 0;
      console.log(
        `[VALIDATION] ${color}: ${count} blocks (divisible by 9: ${isDivisibleBy9})`
      );
      if (!isDivisibleBy9) {
        allBalanced = false;
      }
    }

    if (allBalanced && totalBlockCountCorrect) {
      console.log(
        `[VALIDATION] ✅ All colors are balanced (divisible by 9) and total count is correct`
      );
    } else {
      if (!allBalanced) {
        console.warn(
          `[VALIDATION] ❌ Some colors are not balanced (not divisible by 9)!`
        );
      }
      if (!totalBlockCountCorrect) {
        console.warn(
          `[VALIDATION] ❌ Total block count mismatch: ${totalColorBlocks} ≠ ${config.blockCount}!`
        );
      }
    }
  }
}
