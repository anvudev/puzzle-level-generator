import { describe, test, expect } from 'vitest';
import { MigrationAdapter } from '../migration-adapter';
import { FallbackLevelGenerator } from '../fallback-level-generator';
import type { LevelConfig } from '@/config/game-types';

describe('Color Balance Fix - Critical Issues Resolution', () => {
  const createTestConfig = (overrides: Partial<LevelConfig> = {}): LevelConfig => ({
    width: 9,
    height: 10,
    blockCount: 27,
    colorCount: 3,
    selectedColors: ['Red', 'Blue', 'Green'],
    generationMode: 'random',
    elements: {
      Pipe: 1,
      BlockLock: 0,
    },
    difficulty: 'Normal',
    ...overrides,
  });

  test('should ensure all colors are divisible by 9 in V3 generator', () => {
    const config = createTestConfig({ blockCount: 27 }); // 27 = 9 * 3 colors
    console.log(`\n🎯 Testing V3 generator color balance (divisible by 9)`);
    
    // Enable V3 generator
    MigrationAdapter.enableV3Generator(true);
    
    const level = MigrationAdapter.generateLevel(config);
    
    // Analyze color distribution
    const colorCounts = new Map<string, number>();
    let totalColorBlocks = 0;
    
    for (let y = 0; y < level.board.length; y++) {
      for (let x = 0; x < level.board[y].length; x++) {
        const cell = level.board[y][x];
        
        if (cell.type === 'block' && cell.color) {
          colorCounts.set(cell.color, (colorCounts.get(cell.color) || 0) + 1);
          totalColorBlocks++;
        }
        
        // Count pipe contents
        if (cell.element === 'Pipe' && cell.pipeContents) {
          for (const pipeColor of cell.pipeContents) {
            colorCounts.set(pipeColor, (colorCounts.get(pipeColor) || 0) + 1);
            totalColorBlocks++;
          }
        }
      }
    }
    
    console.log(`📊 V3 Color Distribution:`);
    for (const [color, count] of colorCounts) {
      const isDivisibleBy9 = count % 9 === 0;
      console.log(`  ${color}: ${count} blocks (divisible by 9: ${isDivisibleBy9})`);
      expect(count % 9).toBe(0); // Must be divisible by 9
    }
    
    console.log(`📊 Total color blocks: ${totalColorBlocks} (expected: ${config.blockCount})`);
    expect(totalColorBlocks).toBe(config.blockCount);
    
    console.log(`✅ V3 generator: All colors divisible by 9 and total count correct`);
  });

  test('should ensure all colors are divisible by 9 in fallback generator', () => {
    const config = createTestConfig({ blockCount: 27 }); // 27 = 9 * 3 colors
    console.log(`\n🎯 Testing fallback generator color balance (divisible by 9)`);
    
    const level = FallbackLevelGenerator.generateLevel(config);
    
    // Analyze color distribution
    const colorCounts = new Map<string, number>();
    let totalColorBlocks = 0;
    
    for (let y = 0; y < level.board.length; y++) {
      for (let x = 0; x < level.board[y].length; x++) {
        const cell = level.board[y][x];
        
        if (cell.type === 'block' && cell.color) {
          colorCounts.set(cell.color, (colorCounts.get(cell.color) || 0) + 1);
          totalColorBlocks++;
        }
        
        // Count pipe contents
        if (cell.element === 'Pipe' && cell.pipeContents) {
          for (const pipeColor of cell.pipeContents) {
            colorCounts.set(pipeColor, (colorCounts.get(pipeColor) || 0) + 1);
            totalColorBlocks++;
          }
        }
      }
    }
    
    console.log(`📊 Fallback Color Distribution:`);
    for (const [color, count] of colorCounts) {
      const isDivisibleBy9 = count % 9 === 0;
      console.log(`  ${color}: ${count} blocks (divisible by 9: ${isDivisibleBy9})`);
      expect(count % 9).toBe(0); // Must be divisible by 9
    }
    
    console.log(`📊 Total color blocks: ${totalColorBlocks} (expected: ${config.blockCount})`);
    expect(totalColorBlocks).toBe(config.blockCount);
    
    console.log(`✅ Fallback generator: All colors divisible by 9 and total count correct`);
  });

  test('should handle different block counts that are multiples of 9', () => {
    const testCases = [
      { blockCount: 18, colors: 2 }, // 9 per color
      { blockCount: 27, colors: 3 }, // 9 per color
      { blockCount: 36, colors: 4 }, // 9 per color
      { blockCount: 45, colors: 5 }, // 9 per color
    ];
    
    testCases.forEach(({ blockCount, colors }) => {
      const selectedColors = ['Red', 'Blue', 'Green', 'Yellow', 'Brown'].slice(0, colors);
      const config = createTestConfig({ 
        blockCount, 
        colorCount: colors,
        selectedColors,
        elements: { Pipe: 1, BlockLock: 0 }
      });
      
      console.log(`\n🧪 Testing ${blockCount} blocks with ${colors} colors`);
      
      const level = MigrationAdapter.generateLevel(config);
      
      // Analyze color distribution
      const colorCounts = new Map<string, number>();
      let totalColorBlocks = 0;
      
      for (let y = 0; y < level.board.length; y++) {
        for (let x = 0; x < level.board[y].length; x++) {
          const cell = level.board[y][x];
          
          if (cell.type === 'block' && cell.color) {
            colorCounts.set(cell.color, (colorCounts.get(cell.color) || 0) + 1);
            totalColorBlocks++;
          }
          
          // Count pipe contents
          if (cell.element === 'Pipe' && cell.pipeContents) {
            for (const pipeColor of cell.pipeContents) {
              colorCounts.set(pipeColor, (colorCounts.get(pipeColor) || 0) + 1);
              totalColorBlocks++;
            }
          }
        }
      }
      
      // Validate each color is divisible by 9
      for (const [color, count] of colorCounts) {
        expect(count % 9).toBe(0);
      }
      
      // Validate total count
      expect(totalColorBlocks).toBe(config.blockCount);
      
      console.log(`  ✅ ${blockCount} blocks: All colors divisible by 9, total correct`);
    });
  });

  test('should correctly count blocks excluding pipe structures', () => {
    const config = createTestConfig({ 
      blockCount: 27,
      elements: { Pipe: 2, BlockLock: 0 }
    });
    
    console.log(`\n🔍 Testing block counting logic (excluding pipe structures)`);
    
    const level = MigrationAdapter.generateLevel(config);
    
    // Count different types of blocks
    let normalBlocks = 0;
    let pipeStructures = 0;
    let pipeContents = 0;
    let totalColorBlocks = 0;
    
    for (let y = 0; y < level.board.length; y++) {
      for (let x = 0; x < level.board[y].length; x++) {
        const cell = level.board[y][x];
        
        if (cell.type === 'block') {
          if (cell.element === 'Pipe') {
            pipeStructures++; // Pipe structures (NOT counted in blockCount)
            if (cell.pipeContents) {
              pipeContents += cell.pipeContents.length; // Pipe contents (counted)
              totalColorBlocks += cell.pipeContents.length;
            }
          } else if (cell.color) {
            normalBlocks++; // Normal color blocks (counted)
            totalColorBlocks++;
          }
        }
      }
    }
    
    console.log(`📊 Block Analysis:`);
    console.log(`  Normal blocks: ${normalBlocks}`);
    console.log(`  Pipe structures: ${pipeStructures} (NOT counted)`);
    console.log(`  Pipe contents: ${pipeContents} (counted)`);
    console.log(`  Total color blocks: ${totalColorBlocks}`);
    console.log(`  Expected: ${config.blockCount}`);
    
    // Validate block counting logic
    expect(pipeStructures).toBe(config.elements.Pipe); // Should have correct number of pipes
    expect(totalColorBlocks).toBe(config.blockCount); // Total should match blockCount
    expect(normalBlocks + pipeContents).toBe(config.blockCount); // Sum should equal blockCount
    
    console.log(`✅ Block counting logic correct: pipe structures excluded, contents included`);
  });

  test('should handle edge case with maximum pipes and locks', () => {
    const config = createTestConfig({ 
      blockCount: 45,
      colorCount: 5,
      selectedColors: ['Red', 'Blue', 'Green', 'Yellow', 'Brown'],
      elements: { Pipe: 3, BlockLock: 2 }
    });
    
    console.log(`\n🚀 Testing edge case: 45 blocks, 3 pipes, 2 locks`);
    
    const level = MigrationAdapter.generateLevel(config);
    
    // Analyze complete structure
    const colorCounts = new Map<string, number>();
    let totalColorBlocks = 0;
    let pipeCount = 0;
    let lockCount = 0;
    
    for (let y = 0; y < level.board.length; y++) {
      for (let x = 0; x < level.board[y].length; x++) {
        const cell = level.board[y][x];
        
        if (cell.type === 'block') {
          if (cell.element === 'Pipe') {
            pipeCount++;
            if (cell.pipeContents) {
              for (const pipeColor of cell.pipeContents) {
                colorCounts.set(pipeColor, (colorCounts.get(pipeColor) || 0) + 1);
                totalColorBlocks++;
              }
            }
          } else if (cell.element === 'BlockLock') {
            lockCount++;
            if (cell.color) {
              colorCounts.set(cell.color, (colorCounts.get(cell.color) || 0) + 1);
              totalColorBlocks++;
            }
          } else if (cell.color) {
            colorCounts.set(cell.color, (colorCounts.get(cell.color) || 0) + 1);
            totalColorBlocks++;
          }
        }
      }
    }
    
    console.log(`📊 Edge Case Analysis:`);
    console.log(`  Pipes found: ${pipeCount} (expected: ${config.elements.Pipe})`);
    console.log(`  Locks found: ${lockCount} (expected: ${config.elements.BlockLock})`);
    console.log(`  Total color blocks: ${totalColorBlocks} (expected: ${config.blockCount})`);
    
    // Validate structure
    expect(pipeCount).toBe(config.elements.Pipe);
    expect(lockCount).toBe(config.elements.BlockLock);
    expect(totalColorBlocks).toBe(config.blockCount);
    
    // Validate color balance
    for (const [color, count] of colorCounts) {
      expect(count % 9).toBe(0);
    }
    
    console.log(`✅ Edge case handled correctly: all validations passed`);
  });
});
