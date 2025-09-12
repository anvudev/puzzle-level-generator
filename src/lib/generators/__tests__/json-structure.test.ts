import { describe, test, expect } from 'vitest';
import { MigrationAdapter } from '../migration-adapter';
import type { LevelConfig } from '@/config/game-types';

describe('JSON Structure Validation - UI Compatibility', () => {
  const createTestConfig = (overrides: Partial<LevelConfig> = {}): LevelConfig => ({
    width: 9,
    height: 10,
    blockCount: 27,
    colorCount: 5,
    selectedColors: ['Red', 'Blue', 'Green', 'Yellow', 'Brown'],
    generationMode: 'random',
    elements: {
      Pipe: 1,
      BlockLock: 1,
    },
    difficulty: 'Normal',
    ...overrides,
  });

  test('should return complete JSON structure for UI', () => {
    const config = createTestConfig();
    console.log(`\n🔍 Testing complete JSON structure for UI compatibility`);
    
    const level = MigrationAdapter.generateLevel(config);
    
    console.log('\n📋 Generated Level Structure:');
    console.log(`ID: ${level.id}`);
    console.log(`Timestamp: ${level.timestamp}`);
    console.log(`Solvable: ${level.solvable}`);
    console.log(`Difficulty Score: ${level.difficultyScore}`);
    console.log(`AI Reasoning: ${level.aiReasoning}`);
    
    // Validate required fields
    expect(level.id).toBeDefined();
    expect(level.config).toBeDefined();
    expect(level.board).toBeDefined();
    expect(level.containers).toBeDefined();
    expect(level.difficultyScore).toBeGreaterThan(0);
    expect(level.solvable).toBe(true);
    expect(level.timestamp).toBeInstanceOf(Date);
    expect(level.aiReasoning).toContain('V3');
    
    console.log(`✅ All required fields present`);
  });

  test('should provide detailed board structure for UI rendering', () => {
    const config = createTestConfig();
    console.log(`\n🎨 Testing board structure for UI rendering`);
    
    const level = MigrationAdapter.generateLevel(config);
    
    // Analyze board structure
    let totalCells = 0;
    let emptyCells = 0;
    let blockCells = 0;
    let pipeCells = 0;
    let lockCells = 0;
    let keyCells = 0;
    
    const cellTypes = new Set<string>();
    const elements = new Set<string>();
    const colors = new Set<string>();
    
    for (let y = 0; y < level.board.length; y++) {
      for (let x = 0; x < level.board[y].length; x++) {
        const cell = level.board[y][x];
        totalCells++;
        
        cellTypes.add(cell.type);
        if (cell.element) elements.add(cell.element);
        if (cell.color) colors.add(cell.color);
        
        switch (cell.type) {
          case 'empty':
            emptyCells++;
            break;
          case 'block':
            blockCells++;
            if (cell.element === 'Pipe') pipeCells++;
            if (cell.element === 'BlockLock') lockCells++;
            if (cell.element === 'Key') keyCells++;
            break;
        }
      }
    }
    
    console.log('\n📊 Board Analysis:');
    console.log(`Total cells: ${totalCells}`);
    console.log(`Empty cells: ${emptyCells}`);
    console.log(`Block cells: ${blockCells}`);
    console.log(`Pipe cells: ${pipeCells}`);
    console.log(`Lock cells: ${lockCells}`);
    console.log(`Key cells: ${keyCells}`);
    console.log(`Cell types: [${Array.from(cellTypes).join(', ')}]`);
    console.log(`Elements: [${Array.from(elements).join(', ')}]`);
    console.log(`Colors: [${Array.from(colors).join(', ')}]`);
    
    // Validate board structure
    expect(totalCells).toBe(config.width * config.height);
    expect(cellTypes.has('empty')).toBe(true);
    expect(cellTypes.has('block')).toBe(true);
    expect(pipeCells).toBe(config.elements.Pipe);
    expect(lockCells).toBe(config.elements.BlockLock);
    expect(keyCells).toBe(config.elements.BlockLock); // Each lock has a key
    
    console.log(`✅ Board structure valid for UI rendering`);
  });

  test('should provide pipe info for UI components', () => {
    const config = createTestConfig({ elements: { Pipe: 2, BlockLock: 0 } });
    console.log(`\n🔧 Testing pipe info for UI components`);
    
    const level = MigrationAdapter.generateLevel(config);
    
    console.log('\n🔍 Pipe Info Analysis:');
    console.log(`Pipe info entries: ${level.pipeInfo?.length || 0}`);
    
    if (level.pipeInfo) {
      level.pipeInfo.forEach((pipe, index) => {
        console.log(`Pipe ${index + 1}:`);
        console.log(`  - ID: ${pipe.id}`);
        console.log(`  - Position: (${pipe.position.x}, ${pipe.position.y})`);
        console.log(`  - Direction: ${pipe.direction}`);
        console.log(`  - Contents: [${pipe.contents.join(', ')}] (${pipe.contents.length} blocks)`);
        
        // Validate pipe info structure
        expect(pipe.id).toBeDefined();
        expect(pipe.position).toBeDefined();
        expect(pipe.position.x).toBeGreaterThanOrEqual(0);
        expect(pipe.position.y).toBeGreaterThanOrEqual(0);
        expect(['up', 'down', 'left', 'right']).toContain(pipe.direction);
        expect(Array.isArray(pipe.contents)).toBe(true);
      });
      
      expect(level.pipeInfo.length).toBe(config.elements.Pipe);
      console.log(`✅ Pipe info structure valid for UI`);
    }
  });

  test('should provide lock info for UI components', () => {
    const config = createTestConfig({ elements: { Pipe: 0, BlockLock: 2 } });
    console.log(`\n🔐 Testing lock info for UI components`);
    
    const level = MigrationAdapter.generateLevel(config);
    
    console.log('\n🔍 Lock Info Analysis:');
    console.log(`Lock info entries: ${level.lockInfo?.length || 0}`);
    
    if (level.lockInfo) {
      level.lockInfo.forEach((lock, index) => {
        console.log(`Lock ${index + 1}:`);
        console.log(`  - ID: ${lock.id}`);
        console.log(`  - Lock Position: (${lock.lockPosition.x}, ${lock.lockPosition.y})`);
        console.log(`  - Key Position: (${lock.keyPosition.x}, ${lock.keyPosition.y})`);
        console.log(`  - Color: ${lock.color}`);
        
        // Validate lock info structure
        expect(lock.id).toBeDefined();
        expect(lock.lockPosition).toBeDefined();
        expect(lock.keyPosition).toBeDefined();
        expect(lock.color).toBeDefined();
        expect(config.selectedColors).toContain(lock.color);
      });
      
      expect(level.lockInfo.length).toBe(config.elements.BlockLock);
      console.log(`✅ Lock info structure valid for UI`);
    }
  });

  test('should provide container info for UI components', () => {
    const config = createTestConfig();
    console.log(`\n📦 Testing container info for UI components`);
    
    const level = MigrationAdapter.generateLevel(config);
    
    console.log('\n🔍 Container Analysis:');
    console.log(`Container count: ${level.containers.length}`);
    
    level.containers.forEach((container, index) => {
      console.log(`Container ${index + 1}:`);
      console.log(`  - ID: ${container.id}`);
      console.log(`  - Slots: ${container.slots}`);
      console.log(`  - Contents: ${container.contents.length}/${container.slots}`);
      
      container.contents.forEach((item, itemIndex) => {
        console.log(`    ${itemIndex + 1}. ${item.color} ${item.type}`);
      });
      
      // Validate container structure
      expect(container.id).toBeDefined();
      expect(container.slots).toBeGreaterThan(0);
      expect(Array.isArray(container.contents)).toBe(true);
      expect(container.contents.length).toBeLessThanOrEqual(container.slots);
      
      container.contents.forEach(item => {
        expect(item.color).toBeDefined();
        expect(item.type).toBeDefined();
        expect(config.selectedColors).toContain(item.color);
      });
    });
    
    expect(level.containers.length).toBeGreaterThan(0);
    console.log(`✅ Container structure valid for UI`);
  });

  test('should validate complete JSON serialization', () => {
    const config = createTestConfig();
    console.log(`\n📄 Testing JSON serialization compatibility`);
    
    const level = MigrationAdapter.generateLevel(config);
    
    // Test JSON serialization
    let jsonString: string;
    let parsedLevel: any;
    
    try {
      jsonString = JSON.stringify(level);
      parsedLevel = JSON.parse(jsonString);
      
      console.log(`✅ JSON serialization successful`);
      console.log(`JSON size: ${(jsonString.length / 1024).toFixed(2)} KB`);
      
    } catch (error) {
      console.error(`❌ JSON serialization failed:`, error);
      throw error;
    }
    
    // Validate parsed structure
    expect(parsedLevel.id).toBe(level.id);
    expect(parsedLevel.config).toBeDefined();
    expect(parsedLevel.board).toBeDefined();
    expect(parsedLevel.containers).toBeDefined();
    expect(parsedLevel.pipeInfo).toBeDefined();
    expect(parsedLevel.lockInfo).toBeDefined();
    
    // Validate board structure after parsing
    expect(parsedLevel.board.length).toBe(config.height);
    expect(parsedLevel.board[0].length).toBe(config.width);
    
    console.log(`✅ JSON structure valid after serialization/parsing`);
  });

  test('should provide all necessary data for UI state management', () => {
    const config = createTestConfig();
    console.log(`\n🎮 Testing UI state management compatibility`);
    
    const level = MigrationAdapter.generateLevel(config);
    
    // Check if all UI-required data is present
    const uiRequiredFields = [
      'id',           // For level identification
      'config',       // For level configuration
      'board',        // For board rendering
      'containers',   // For container UI
      'pipeInfo',     // For pipe interactions
      'lockInfo',     // For lock/key mechanics
      'solvable',     // For game logic
      'difficultyScore', // For difficulty display
      'timestamp',    // For level tracking
    ];
    
    console.log('\n🔍 UI Required Fields Check:');
    uiRequiredFields.forEach(field => {
      const hasField = field in level;
      console.log(`  ${hasField ? '✅' : '❌'} ${field}: ${hasField ? 'present' : 'missing'}`);
      expect(hasField).toBe(true);
    });
    
    // Check board cell structure for UI rendering
    const sampleCell = level.board[0][0];
    const cellRequiredFields = ['type', 'color', 'element'];
    
    console.log('\n🔍 Cell Structure Check:');
    cellRequiredFields.forEach(field => {
      const hasField = field in sampleCell;
      console.log(`  ${hasField ? '✅' : '❌'} ${field}: ${hasField ? 'present' : 'missing'}`);
      expect(hasField).toBe(true);
    });
    
    console.log(`✅ All UI-required data present and accessible`);
  });
});
