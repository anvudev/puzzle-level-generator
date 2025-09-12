import { describe, test, expect } from 'vitest';
import { CorrectStructureGenerator } from '../correct-structure-generator';
import { BlockCounterV2 } from '@/config/game-types-v2';
import type { LevelConfigV2 } from '@/config/game-types-v2';

describe('Correct Structure Generator - Pipes are NOT blocks', () => {
  const createTestConfig = (overrides: Partial<LevelConfigV2> = {}): LevelConfigV2 => ({
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

  test('should generate exact block count with correct structure', () => {
    const config = createTestConfig();
    console.log(`\n🎯 Testing CORRECT structure: ${config.blockCount} blocks, ${config.elements.Pipe} pipes`);
    
    const level = CorrectStructureGenerator.generateLevel(config);
    const validation = BlockCounterV2.validateBlockCount(level.board, config.blockCount);
    
    console.log('\n✅ Correct Structure Analysis:');
    console.log(`Expected: ${validation.expected}`);
    console.log(`Actual: ${validation.actual}`);
    console.log(`Breakdown:`, validation.breakdown);
    
    // This should PASS with correct structure
    expect(validation.isValid).toBe(true);
    expect(validation.actual).toBe(config.blockCount);
    
    // Verify pipe structures are NOT counted as blocks
    expect(validation.breakdown.pipeStructures).toBeGreaterThan(0);
    expect(validation.breakdown.totalRealBlocks).toBe(
      validation.breakdown.normalBlocks + 
      validation.breakdown.pipeContents + 
      validation.breakdown.lockBlocks
    );
  });

  test('should handle multiple pipes correctly', () => {
    const config = createTestConfig({
      blockCount: 30,
      elements: { Pipe: 2, BlockLock: 0 },
    });
    
    console.log(`\n🎯 Testing with 2 pipes: ${config.blockCount} blocks`);
    
    const level = CorrectStructureGenerator.generateLevel(config);
    const validation = BlockCounterV2.validateBlockCount(level.board, config.blockCount);
    
    console.log(`✅ Result: ${validation.actual}/${validation.expected}`);
    console.log(`Breakdown:`, validation.breakdown);
    
    expect(validation.isValid).toBe(true);
    expect(validation.breakdown.pipeStructures).toBe(2);
  });

  test('should handle no pipes correctly', () => {
    const config = createTestConfig({
      blockCount: 25,
      elements: { Pipe: 0, BlockLock: 0 },
    });
    
    console.log(`\n🎯 Testing with no pipes: ${config.blockCount} blocks`);
    
    const level = CorrectStructureGenerator.generateLevel(config);
    const validation = BlockCounterV2.validateBlockCount(level.board, config.blockCount);
    
    console.log(`✅ Result: ${validation.actual}/${validation.expected}`);
    console.log(`Breakdown:`, validation.breakdown);
    
    expect(validation.isValid).toBe(true);
    expect(validation.breakdown.pipeStructures).toBe(0);
    expect(validation.breakdown.pipeContents).toBe(0);
    expect(validation.breakdown.normalBlocks).toBe(25);
  });

  test('should demonstrate the difference from old structure', () => {
    const config = createTestConfig();
    
    console.log(`\n🔍 Demonstrating structure difference:`);
    console.log(`Config: ${config.blockCount} blocks, ${config.elements.Pipe} pipes`);
    
    const level = CorrectStructureGenerator.generateLevel(config);
    const validation = BlockCounterV2.validateBlockCount(level.board, config.blockCount);
    
    console.log(`\n✅ NEW STRUCTURE (correct):`);
    console.log(`  - Normal blocks: ${validation.breakdown.normalBlocks}`);
    console.log(`  - Pipe contents: ${validation.breakdown.pipeContents} (real blocks)`);
    console.log(`  - Pipe structures: ${validation.breakdown.pipeStructures} (NOT blocks, just containers)`);
    console.log(`  - Total REAL blocks: ${validation.breakdown.totalRealBlocks}`);
    console.log(`  - Validation: ${validation.isValid ? '✅ PASS' : '❌ FAIL'}`);
    
    console.log(`\n❌ OLD STRUCTURE (wrong) would count:`);
    console.log(`  - Board blocks: ${validation.breakdown.normalBlocks + validation.breakdown.pipeStructures} (includes pipe structures ❌)`);
    console.log(`  - Pipe contents: ${validation.breakdown.pipeContents}`);
    console.log(`  - Total: ${validation.breakdown.normalBlocks + validation.breakdown.pipeStructures + validation.breakdown.pipeContents} ≠ ${config.blockCount} ❌`);
    
    // Verify the fix
    expect(validation.isValid).toBe(true);
    
    // Verify pipe structures exist but are not counted
    const pipeCount = level.board.flat().filter(cell => cell.type === 'pipe').length;
    expect(pipeCount).toBe(config.elements.Pipe);
    expect(validation.breakdown.pipeStructures).toBe(pipeCount);
  });

  test('should verify pipe structure properties', () => {
    const config = createTestConfig();
    
    const level = CorrectStructureGenerator.generateLevel(config);
    
    // Find pipe cells
    const pipeCells = level.board.flat().filter(cell => cell.type === 'pipe');
    
    console.log(`\n🔍 Pipe structure verification:`);
    pipeCells.forEach((pipe, index) => {
      console.log(`Pipe ${index + 1}:`);
      console.log(`  - type: "${pipe.type}" ✅ (correct: not "block")`);
      console.log(`  - element: "${pipe.element}" ✅`);
      console.log(`  - color: ${pipe.color} ✅ (pipes have no color)`);
      console.log(`  - pipeContents: [${pipe.pipeContents?.join(', ') || 'empty'}] ✅`);
      console.log(`  - pipeDirection: ${pipe.pipeDirection} ✅`);
    });
    
    expect(pipeCells.length).toBe(config.elements.Pipe);
    pipeCells.forEach(pipe => {
      expect(pipe.type).toBe('pipe');
      expect(pipe.element).toBe('Pipe');
      expect(pipe.color).toBe(null);
      expect(pipe.pipeContents).toBeDefined();
      expect(pipe.pipeDirection).toBeDefined();
    });
  });
});

describe('BlockCounterV2 - New counting logic', () => {
  test('should count blocks correctly', () => {
    // Mock board with correct structure
    const board = [
      [
        { type: 'block', color: 'Red', element: null },
        { type: 'block', color: 'Blue', element: null },
        { type: 'empty', color: null, element: null },
      ],
      [
        { type: 'pipe', color: null, element: 'Pipe', pipeContents: ['Green', 'Yellow'] },
        { type: 'block', color: 'Brown', element: null },
        { type: 'empty', color: null, element: null },
      ],
    ] as any;
    
    const result = BlockCounterV2.countRealBlocks(board);
    
    console.log(`\n🧮 BlockCounterV2 test:`, result);
    
    expect(result.normalBlocks).toBe(3); // Red, Blue, Brown
    expect(result.pipeContents).toBe(2); // Green, Yellow inside pipe
    expect(result.pipeStructures).toBe(1); // 1 pipe structure (NOT counted)
    expect(result.totalRealBlocks).toBe(5); // 3 + 2 + 0
    expect(result.lockBlocks).toBe(0);
  });
});
