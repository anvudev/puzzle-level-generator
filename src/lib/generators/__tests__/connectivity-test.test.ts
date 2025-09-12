import { describe, it, expect } from "vitest";
import { MigrationAdapter } from "../migration-adapter";
import type { LevelConfig } from "../../types/game-types";

describe("Connectivity Test - Pipe Placement", () => {
  it("should place pipes connected to main cluster", () => {
    const config: LevelConfig = {
      width: 9,
      height: 10,
      blockCount: 36,
      colorCount: 4,
      selectedColors: ["Red", "Blue", "Green", "Yellow"],
      generationMode: "random" as const,
      elements: { Pipe: 3, BlockLock: 0 },
      difficulty: "Normal" as const,
    };

    console.log("🧪 Testing pipe connectivity with 3 pipes");
    const level = MigrationAdapter.generateLevel(config);

    // Extract pipe positions
    const pipePositions: Array<{ x: number; y: number }> = [];
    const blockPositions: Array<{ x: number; y: number }> = [];

    for (let y = 0; y < config.height; y++) {
      for (let x = 0; x < config.width; x++) {
        const cell = level.board[y][x];
        if (cell.element === "Pipe") {
          pipePositions.push({ x, y });
        } else if (cell.type === "block" && !cell.element) {
          blockPositions.push({ x, y });
        }
      }
    }

    console.log(`📍 Found ${pipePositions.length} pipes at:`, pipePositions);
    console.log(`📍 Found ${blockPositions.length} normal blocks`);

    // Check if each pipe is adjacent to at least one block
    let connectedPipes = 0;
    for (const pipe of pipePositions) {
      const adjacent = [
        { x: pipe.x - 1, y: pipe.y },
        { x: pipe.x + 1, y: pipe.y },
        { x: pipe.x, y: pipe.y - 1 },
        { x: pipe.x, y: pipe.y + 1 },
      ];

      const hasAdjacentBlock = adjacent.some((pos) => {
        if (pos.x < 0 || pos.x >= config.width || pos.y < 0 || pos.y >= config.height) {
          return false;
        }
        const cell = level.board[pos.y][pos.x];
        return cell.type === "block" && !cell.element;
      });

      if (hasAdjacentBlock) {
        connectedPipes++;
        console.log(`✅ Pipe at (${pipe.x}, ${pipe.y}) is connected to blocks`);
      } else {
        console.log(`❌ Pipe at (${pipe.x}, ${pipe.y}) is isolated`);
      }
    }

    // Validate connectivity
    expect(pipePositions.length).toBe(3);
    expect(connectedPipes).toBe(3); // All pipes should be connected
    console.log(`🎯 Connectivity: ${connectedPipes}/${pipePositions.length} pipes connected`);
  });

  it("should place multiple elements with good connectivity", () => {
    const config: LevelConfig = {
      width: 9,
      height: 10,
      blockCount: 45,
      colorCount: 5,
      selectedColors: ["Red", "Blue", "Green", "Yellow", "Brown"],
      generationMode: "random" as const,
      elements: { Pipe: 2, BlockLock: 1 },
      difficulty: "Normal" as const,
    };

    console.log("🧪 Testing complex connectivity with pipes + locks");
    const level = MigrationAdapter.generateLevel(config);

    // Count elements
    let pipes = 0;
    let locks = 0;
    let keys = 0;
    let normalBlocks = 0;
    let connectedElements = 0;

    for (let y = 0; y < config.height; y++) {
      for (let x = 0; x < config.width; x++) {
        const cell = level.board[y][x];
        
        if (cell.element === "Pipe") {
          pipes++;
          // Check connectivity
          const adjacent = [
            { x: x - 1, y },
            { x: x + 1, y },
            { x, y: y - 1 },
            { x, y: y + 1 },
          ];

          const hasAdjacentBlock = adjacent.some((pos) => {
            if (pos.x < 0 || pos.x >= config.width || pos.y < 0 || pos.y >= config.height) {
              return false;
            }
            const adjCell = level.board[pos.y][pos.x];
            return adjCell.type === "block";
          });

          if (hasAdjacentBlock) connectedElements++;
        } else if (cell.element === "BlockLock") {
          locks++;
        } else if (cell.element === "Key") {
          keys++;
        } else if (cell.type === "block" && !cell.element) {
          normalBlocks++;
        }
      }
    }

    console.log(`📊 Elements: ${pipes} pipes, ${locks} locks, ${keys} keys, ${normalBlocks} blocks`);
    console.log(`🔗 Connected elements: ${connectedElements}/${pipes + locks + keys}`);

    // Validate
    expect(pipes).toBe(2);
    expect(locks).toBe(1);
    expect(keys).toBe(1);
    expect(connectedElements).toBeGreaterThanOrEqual(pipes); // At least pipes should be connected
  });
});
