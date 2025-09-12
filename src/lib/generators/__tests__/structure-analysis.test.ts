import { describe, test, expect } from 'vitest';
import { FallbackLevelGenerator } from '../fallback-level-generator';
import type { LevelConfig, BoardCell } from '@/config/game-types';

describe('Structure Analysis - Pipe vs Block Problem', () => {
  const createTestConfig = (overrides: Partial<LevelConfig> = {}): LevelConfig => ({
    width: 9,
    height: 10,
    blockCount: 27,
    colorCount: 5,
    selectedColors: ['Red', 'Blue', 'Green', 'Yellow', 'Brown'],
    generationMode: 'random',
    elements: {
      Pipe: 1,
      BlockLock: 0,
    },
    difficulty: 'Normal',
    ...overrides,
  });

  test('should demonstrate the pipe structure problem', () => {
    const config = createTestConfig();
    console.log(`\n🔍 Testing with config: ${config.blockCount} blocks, ${config.elements.Pipe} pipes`);
    
    const level = FallbackLevelGenerator.generateLevel(config);
    const analysis = analyzeBoard(level.board);
    
    console.log('\n📊 Current Structure Analysis:');
    console.log(`Expected total blocks: ${config.blockCount}`);
    console.log(`Actual analysis:`, analysis);
    
    // The problem: pipe is counted as a block but shouldn't be
    console.log('\n❌ Problem identified:');
    console.log(`- Pipes are marked as type: "block" but they are NOT blocks`);
    console.log(`- This causes confusion in counting`);
    console.log(`- Real blocks = board blocks + pipe contents`);
    console.log(`- But pipes themselves are NOT blocks!`);
    
    // Demonstrate the issue
    const pipePositions = findPipePositions(level.board);
    console.log(`\n🔍 Pipe positions found: ${pipePositions.length}`);
    
    pipePositions.forEach((pos, index) => {
      const cell = level.board[pos.y][pos.x];
      console.log(`Pipe ${index + 1} at (${pos.x}, ${pos.y}):`);
      console.log(`  - type: "${cell.type}" ❌ (should be "pipe", not "block")`);
      console.log(`  - element: "${cell.element}" ✅`);
      console.log(`  - color: ${cell.color} ✅ (pipes have no color)`);
      console.log(`  - pipeContents: [${cell.pipeContents?.join(', ') || 'empty'}] ✅`);
    });
    
    // The fix should be: pipes are NOT blocks, only their contents are blocks
    const correctBlockCount = analysis.normalBlocks + analysis.pipeContents + analysis.lockBlocks;
    console.log(`\n✅ Correct calculation should be:`);
    console.log(`  - Normal blocks: ${analysis.normalBlocks}`);
    console.log(`  - Pipe contents: ${analysis.pipeContents}`);
    console.log(`  - Lock blocks: ${analysis.lockBlocks}`);
    console.log(`  - Total REAL blocks: ${correctBlockCount}`);
    console.log(`  - Pipes themselves: ${analysis.pipeStructures} (NOT blocks, just containers)`);
    
    // This test will fail with current structure, proving the problem
    expect(analysis.total).toBe(config.blockCount);
  });

  test('should show the counting confusion', () => {
    const config = createTestConfig({ blockCount: 25, elements: { Pipe: 2, BlockLock: 0 } });
    
    const level = FallbackLevelGenerator.generateLevel(config);
    const analysis = analyzeBoard(level.board);
    
    console.log('\n🧮 Counting Confusion Demo:');
    console.log(`Expected: ${config.blockCount} blocks`);
    console.log(`Current counting: ${analysis.total} (includes pipe structures as blocks ❌)`);
    console.log(`Correct counting: ${analysis.normalBlocks + analysis.pipeContents + analysis.lockBlocks} (excludes pipe structures ✅)`);
    
    // Show the difference
    const difference = analysis.total - (analysis.normalBlocks + analysis.pipeContents + analysis.lockBlocks);
    console.log(`Difference: ${difference} (this equals number of pipes: ${analysis.pipeStructures})`);
    
    expect(difference).toBe(analysis.pipeStructures);
  });
});

function analyzeBoard(board: BoardCell[][]): {
  boardBlocks: number;
  normalBlocks: number;
  pipeStructures: number;
  pipeContents: number;
  lockBlocks: number;
  total: number;
  colorDistribution: Record<string, number>;
} {
  let boardBlocks = 0;
  let normalBlocks = 0;
  let pipeStructures = 0;
  let pipeContents = 0;
  let lockBlocks = 0;
  const colorDistribution: Record<string, number> = {};

  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[y].length; x++) {
      const cell = board[y][x];

      if (cell.type === 'block') {
        boardBlocks++;

        if (cell.element === 'Pipe') {
          pipeStructures++;
          // Count pipe contents
          if (cell.pipeContents) {
            pipeContents += cell.pipeContents.length;
            cell.pipeContents.forEach(color => {
              colorDistribution[color] = (colorDistribution[color] || 0) + 1;
            });
          }
        } else if (cell.element === 'BlockLock' || cell.element === 'Key') {
          lockBlocks++;
          if (cell.color) {
            colorDistribution[cell.color] = (colorDistribution[cell.color] || 0) + 1;
          }
        } else {
          normalBlocks++;
          if (cell.color) {
            colorDistribution[cell.color] = (colorDistribution[cell.color] || 0) + 1;
          }
        }
      }
    }
  }

  return {
    boardBlocks,
    normalBlocks,
    pipeStructures,
    pipeContents,
    lockBlocks,
    total: boardBlocks + pipeContents, // Current (wrong) calculation
    colorDistribution,
  };
}

function findPipePositions(board: BoardCell[][]): { x: number; y: number }[] {
  const positions = [];
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[y].length; x++) {
      if (board[y][x].element === 'Pipe') {
        positions.push({ x, y });
      }
    }
  }
  return positions;
}
