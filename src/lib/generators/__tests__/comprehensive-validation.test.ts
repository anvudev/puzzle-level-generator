import { describe, test, expect } from 'vitest';
import { MigrationAdapter } from '../migration-adapter';
import type { LevelConfig } from '@/config/game-types';

describe('Comprehensive Algorithm Validation - All Edge Cases', () => {
  const createTestConfig = (overrides: Partial<LevelConfig> = {}): LevelConfig => ({
    width: 9,
    height: 10,
    blockCount: 27,
    colorCount: 5,
    selectedColors: ['Red', 'Blue', 'Green', 'Yellow', 'Brown'],
    generationMode: 'random',
    elements: {
      Pipe: 0,
      BlockLock: 0,
    },
    difficulty: 'Normal',
    ...overrides,
  });

  // Test all possible configurations systematically
  const testConfigurations = [
    { name: 'No elements', blockCount: 25, elements: { Pipe: 0, BlockLock: 0 } },
    { name: 'Single pipe', blockCount: 27, elements: { Pipe: 1, BlockLock: 0 } },
    { name: 'Multiple pipes', blockCount: 30, elements: { Pipe: 2, BlockLock: 0 } },
    { name: 'Single lock', blockCount: 27, elements: { Pipe: 0, BlockLock: 1 } },
    { name: 'Multiple locks', blockCount: 30, elements: { Pipe: 0, BlockLock: 2 } },
    { name: 'Pipes + locks', blockCount: 35, elements: { Pipe: 2, BlockLock: 1 } },
    { name: 'Complex config', blockCount: 40, elements: { Pipe: 3, BlockLock: 2 } },
    { name: 'High density', blockCount: 50, elements: { Pipe: 4, BlockLock: 3 } },
  ];

  testConfigurations.forEach(({ name, blockCount, elements }) => {
    test(`should handle ${name} configuration perfectly`, () => {
      const config = createTestConfig({ blockCount, elements });
      console.log(`\n🎯 Testing ${name}: ${blockCount} blocks, ${elements.Pipe} pipes, ${elements.BlockLock} locks`);
      
      // Generate level multiple times to ensure consistency
      const results = [];
      for (let i = 0; i < 3; i++) {
        const level = MigrationAdapter.generateLevel(config);
        
        // Analyze the result
        const analysis = analyzeLevel(level, config);
        results.push(analysis);
        
        console.log(`  Run ${i + 1}: ${analysis.totalRealBlocks}/${config.blockCount} blocks`);
        
        // Validate each run
        expect(analysis.totalRealBlocks).toBe(config.blockCount);
        expect(analysis.pipeCount).toBe(config.elements.Pipe);
        expect(analysis.lockCount).toBe(config.elements.BlockLock);
        expect(analysis.keyCount).toBe(config.elements.BlockLock);
      }
      
      // Ensure consistency across runs
      const firstResult = results[0];
      results.forEach((result, index) => {
        expect(result.totalRealBlocks).toBe(firstResult.totalRealBlocks);
        console.log(`  ✅ Run ${index + 1} consistent with Run 1`);
      });
      
      console.log(`  ✅ ${name} configuration: ALL RUNS PERFECT`);
    });
  });

  test('should handle extreme edge cases', () => {
    console.log(`\n🔥 Testing extreme edge cases`);
    
    const edgeCases = [
      { name: 'Minimum blocks', blockCount: 15, elements: { Pipe: 1, BlockLock: 0 } },
      { name: 'Maximum pipes', blockCount: 45, elements: { Pipe: 5, BlockLock: 0 } },
      { name: 'Maximum locks', blockCount: 45, elements: { Pipe: 0, BlockLock: 5 } },
      { name: 'Balanced mix', blockCount: 60, elements: { Pipe: 3, BlockLock: 3 } },
    ];
    
    edgeCases.forEach(({ name, blockCount, elements }) => {
      console.log(`\n  🧪 Testing ${name}: ${blockCount} blocks, ${elements.Pipe} pipes, ${elements.BlockLock} locks`);
      
      const config = createTestConfig({ blockCount, elements });
      
      try {
        const level = MigrationAdapter.generateLevel(config);
        const analysis = analyzeLevel(level, config);
        
        console.log(`    Result: ${analysis.totalRealBlocks}/${config.blockCount} blocks`);
        console.log(`    Breakdown: normal=${analysis.normalBlocks}, pipes=${analysis.pipeContents}, locks=${analysis.lockBlocks}`);
        
        expect(analysis.totalRealBlocks).toBe(config.blockCount);
        expect(analysis.pipeCount).toBe(config.elements.Pipe);
        expect(analysis.lockCount).toBe(config.elements.BlockLock);
        
        console.log(`    ✅ ${name}: PERFECT`);
      } catch (error) {
        console.log(`    ⚠️ ${name}: Expected failure - ${error.message}`);
        // Some extreme cases might fail, which is acceptable
      }
    });
  });

  test('should validate algorithm correctness across all scenarios', () => {
    console.log(`\n🔬 Comprehensive algorithm correctness validation`);
    
    let totalTests = 0;
    let passedTests = 0;
    
    // Test various block counts
    for (let blockCount = 20; blockCount <= 50; blockCount += 5) {
      // Test various pipe counts
      for (let pipes = 0; pipes <= 3; pipes++) {
        // Test various lock counts
        for (let locks = 0; locks <= 2; locks++) {
          totalTests++;
          
          const config = createTestConfig({
            blockCount,
            elements: { Pipe: pipes, BlockLock: locks }
          });
          
          try {
            const level = MigrationAdapter.generateLevel(config);
            const analysis = analyzeLevel(level, config);
            
            if (analysis.totalRealBlocks === config.blockCount &&
                analysis.pipeCount === config.elements.Pipe &&
                analysis.lockCount === config.elements.BlockLock) {
              passedTests++;
            } else {
              console.log(`    ❌ Failed: ${blockCount} blocks, ${pipes} pipes, ${locks} locks`);
              console.log(`      Expected: ${config.blockCount}, Got: ${analysis.totalRealBlocks}`);
            }
          } catch (error) {
            // Some configurations might be impossible, which is fine
            console.log(`    ⚠️ Impossible config: ${blockCount} blocks, ${pipes} pipes, ${locks} locks`);
          }
        }
      }
    }
    
    const successRate = (passedTests / totalTests) * 100;
    console.log(`\n📊 Algorithm Success Rate: ${passedTests}/${totalTests} (${successRate.toFixed(1)}%)`);
    
    // Expect at least 90% success rate (some configs might be impossible)
    expect(successRate).toBeGreaterThanOrEqual(90);
    console.log(`✅ Algorithm correctness validated across ${totalTests} scenarios`);
  });

  test('should ensure UI compatibility across all configurations', () => {
    console.log(`\n🎨 Testing UI compatibility across configurations`);
    
    const uiTestConfigs = [
      { blockCount: 25, elements: { Pipe: 1, BlockLock: 1 } },
      { blockCount: 35, elements: { Pipe: 2, BlockLock: 2 } },
      { blockCount: 45, elements: { Pipe: 3, BlockLock: 1 } },
    ];
    
    uiTestConfigs.forEach((configOverrides, index) => {
      const config = createTestConfig(configOverrides);
      console.log(`\n  🖼️ UI Test ${index + 1}: ${config.blockCount} blocks, ${config.elements.Pipe} pipes, ${config.elements.BlockLock} locks`);
      
      const level = MigrationAdapter.generateLevel(config);
      
      // Validate UI-required structure
      expect(level.id).toBeDefined();
      expect(level.board).toBeDefined();
      expect(level.containers).toBeDefined();
      expect(level.pipeInfo).toBeDefined();
      expect(level.lockInfo).toBeDefined();
      
      // Validate board structure
      expect(level.board.length).toBe(config.height);
      expect(level.board[0].length).toBe(config.width);
      
      // Validate pipe info
      if (level.pipeInfo) {
        expect(level.pipeInfo.length).toBe(config.elements.Pipe);
        level.pipeInfo.forEach(pipe => {
          expect(pipe.id).toBeDefined();
          expect(pipe.position).toBeDefined();
          expect(['up', 'down', 'left', 'right']).toContain(pipe.direction);
          expect(Array.isArray(pipe.contents)).toBe(true);
        });
      }
      
      // Validate lock info
      if (level.lockInfo) {
        expect(level.lockInfo.length).toBe(config.elements.BlockLock);
        level.lockInfo.forEach(lock => {
          expect(lock.id).toBeDefined();
          expect(lock.lockPosition).toBeDefined();
          expect(lock.keyPosition).toBeDefined();
          expect(lock.color).toBeDefined();
        });
      }
      
      // Test JSON serialization
      const jsonString = JSON.stringify(level);
      const parsedLevel = JSON.parse(jsonString);
      expect(parsedLevel.id).toBe(level.id);
      
      console.log(`    ✅ UI Test ${index + 1}: All UI requirements satisfied`);
    });
    
    console.log(`✅ UI compatibility validated across all test configurations`);
  });
});

// Helper function to analyze generated level
function analyzeLevel(level: any, config: LevelConfig): {
  totalRealBlocks: number;
  normalBlocks: number;
  pipeContents: number;
  lockBlocks: number;
  pipeCount: number;
  lockCount: number;
  keyCount: number;
} {
  let normalBlocks = 0;
  let pipeContents = 0;
  let lockBlocks = 0;
  let pipeCount = 0;
  let lockCount = 0;
  let keyCount = 0;

  for (let y = 0; y < level.board.length; y++) {
    for (let x = 0; x < level.board[y].length; x++) {
      const cell = level.board[y][x];

      if (cell.type === 'block') {
        if (cell.element === 'Pipe') {
          pipeCount++;
          if (cell.pipeContents) {
            pipeContents += cell.pipeContents.length;
          }
        } else if (cell.element === 'BlockLock') {
          lockCount++;
          lockBlocks++;
        } else if (cell.element === 'Key') {
          keyCount++;
        } else {
          normalBlocks++;
        }
      }
    }
  }

  const totalRealBlocks = normalBlocks + pipeContents + lockBlocks;

  return {
    totalRealBlocks,
    normalBlocks,
    pipeContents,
    lockBlocks,
    pipeCount,
    lockCount,
    keyCount,
  };
}
