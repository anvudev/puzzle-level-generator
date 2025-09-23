import type { GeneratedLevel } from "@/config/game-types";

// Simplified interface for color bar chart data
interface BarData {
  barIndex: number;
  color: string;
}

interface ColorBarAnalysis {
  bars: BarData[];
}

/**
 * Analyze colors from board and generate color bar data
 * This function replicates the logic from ColorBarChart component
 */
function analyzeColorsFromBoard(level: GeneratedLevel): ColorBarAnalysis {
  const allBlocks: Array<{ color: string; position: number }> = [];
  let position = 0;

  // Scan board from top to bottom, left to right to collect all blocks
  for (let row = 0; row < level.board.length; row++) {
    for (let col = 0; col < level.board[row].length; col++) {
      const cell = level.board[row][col];

      if (cell.type === "block" && cell.color) {
        if (cell.element === "Pipe") {
          // For Pipe, add contents inside
          if (cell.pipeContents) {
            cell.pipeContents.forEach((pipeColor) => {
              allBlocks.push({ color: pipeColor, position });
              position++;
            });
          }
        } else {
          // Regular block
          allBlocks.push({ color: cell.color, position });
          position++;
        }
      }
    }
  }

  // Count frequency of each color
  const colorCounts: Record<string, number> = {};
  const colorFirstAppearance: Record<string, number> = {};

  allBlocks.forEach((block, index) => {
    colorCounts[block.color] = (colorCounts[block.color] || 0) + 1;
    if (!(block.color in colorFirstAppearance)) {
      colorFirstAppearance[block.color] = index;
    }
  });

  // Create color groups
  const colorGroups: Record<
    string,
    Array<{ color: string; position: number }>
  > = {};
  allBlocks.forEach((block) => {
    if (!colorGroups[block.color]) {
      colorGroups[block.color] = [];
    }
    colorGroups[block.color].push(block);
  });

  // Sort colors by first appearance order
  const colors = Object.keys(colorGroups).sort((a, b) => {
    return colorFirstAppearance[a] - colorFirstAppearance[b];
  });

  // Create alternating bars - each bar one color, consecutive bars different colors
  const bars: BarData[] = [];
  let barIndex = 1;
  let colorIndex = 0;

  while (colors.some((color) => colorGroups[color].length > 0)) {
    // Get next color in round-robin fashion
    const currentColor = colors[colorIndex % colors.length];
    const colorGroup = colorGroups[currentColor];

    if (colorGroup.length > 0) {
      // Take up to 3 blocks of same color for this bar
      colorGroup.splice(0, 3);

      bars.push({
        barIndex: barIndex,
        color: currentColor,
      });

      barIndex++;
    }

    // Move to next color
    colorIndex++;

    // If we've gone through all colors, reset to first color
    if (colorIndex >= colors.length) {
      colorIndex = 0;
    }
  }

  return {
    bars,
  };
}

export function formatLevelForExport(
  level: GeneratedLevel,
  customBars?: BarData[]
) {
  // Analyze color bar data
  const colorBarAnalysis = analyzeColorsFromBoard(level);

  // Use custom bars if provided, otherwise use default
  const barsToExport = customBars || colorBarAnalysis.bars;

  return {
    id: level.id,
    timestamp: level.timestamp.toISOString(),
    config: level.config,
    board: level.board,
    containers: level.containers,
    difficultyScore: level.difficultyScore,
    solvable: level.solvable,
    // Add color bar chart data
    colorBarChart: {
      bars: barsToExport,
    },
  };
}

export function generateCSVMatrix(level: GeneratedLevel): string {
  const rows: string[] = [];

  // Iterate through each row in the board matrix
  for (let row = 0; row < level.board.length; row++) {
    const csvRow: string[] = [];

    // Iterate through each column in this row
    for (let col = 0; col < level.board[row].length; col++) {
      const cell = level.board[row][col];

      // Create clean cell object (remove undefined properties)
      const cellData: Record<string, unknown> = {
        type: cell.type,
        color: cell.color,
        element: cell.element,
      };

      // Add optional properties only if they exist
      if (cell.pipeDirection !== undefined) {
        cellData.pipeDirection = cell.pipeDirection;
      }
      if (cell.pipeSize !== undefined) {
        cellData.pipeSize = cell.pipeSize;
      }
      if (cell.pipeContents !== undefined) {
        cellData.pipeContents = cell.pipeContents;
      }
      if (cell.lockId !== undefined) {
        cellData.lockId = cell.lockId;
      }
      if (cell.keyId !== undefined) {
        cellData.keyId = cell.keyId;
      }
      if (cell.lockPairNumber !== undefined) {
        cellData.lockPairNumber = cell.lockPairNumber;
      }
      if (cell.pullPinDirection !== undefined) {
        cellData.pullPinDirection = cell.pullPinDirection;
      }
      if (cell.pullPinGateSize !== undefined) {
        cellData.pullPinGateSize = cell.pullPinGateSize;
      }
      if (cell.iceCount !== undefined) {
        cellData.iceCount = cell.iceCount;
      }

      // Convert to JSON string and escape quotes for CSV
      const jsonString = JSON.stringify(cellData).replace(/"/g, '""');
      csvRow.push(`"${jsonString}"`);
    }

    rows.push(csvRow.join(","));
  }

  return rows.join("\n");
}

export function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case "Normal":
      return "bg-green-500";
    case "Hard":
      return "bg-yellow-500";
    case "Super Hard":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
}

export function getElementIcon(elementType: string): string {
  const icons: Record<string, string> = {
    Barrel: "📦",
    IceBlock: "🧊",
    Pipe: "⬆️",
    BlockLock: "🔒",
    PullPin: "🔱",
    Bomb: "💣",
    Moving: "➡️",
    Key: "🔑",
  };
  return icons[elementType] || "⬜";
}

export function getPipeIcon(direction: string): string {
  const icons: Record<string, string> = {
    up: "⬆️",
    down: "⬇️",
    left: "⬅️",
    right: "➡️",
  };
  return icons[direction] || "⬜";
}

/**
 * ReFill level - shuffle colors while keeping layout and element positions
 * @param level - Original level to refill
 * @returns New level with shuffled colors
 */
export function refillLevel(level: GeneratedLevel): GeneratedLevel {
  // Collect all block colors from the current board
  const blockColors: string[] = [];
  const blockPositions: Array<{ row: number; col: number }> = [];

  // First pass: collect all block colors and positions
  level.board.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell.type === "block" && cell.color && !cell.element) {
        // Only collect regular blocks (not elements like Pipe, Barrel, etc.)
        blockColors.push(cell.color);
        blockPositions.push({ row: rowIndex, col: colIndex });
      }
    });
  });

  // Count original colors
  const originalColorCounts: Record<string, number> = {};
  blockColors.forEach((color) => {
    originalColorCounts[color] = (originalColorCounts[color] || 0) + 1;
  });

  // Shuffle the colors array
  const shuffledColors = [...blockColors];
  for (let i = shuffledColors.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledColors[i], shuffledColors[j]] = [
      shuffledColors[j],
      shuffledColors[i],
    ];
  }

  console.log("🔀 ReFill - Shuffled colors:", shuffledColors);

  // Verify color counts remain the same
  const shuffledColorCounts: Record<string, number> = {};
  shuffledColors.forEach((color) => {
    shuffledColorCounts[color] = (shuffledColorCounts[color] || 0) + 1;
  });
  console.log("📊 ReFill - Shuffled color counts:", shuffledColorCounts);

  // Create new board with shuffled colors
  const newBoard = level.board.map((row) => row.map((cell) => ({ ...cell })));

  // Second pass: assign shuffled colors to block positions
  blockPositions.forEach((pos, index) => {
    const cell = newBoard[pos.row][pos.col];
    if (cell.type === "block" && !cell.element) {
      cell.color = shuffledColors[index];
    }
  });

  // Create new level with same config but new board and timestamp
  const newLevel: GeneratedLevel = {
    ...level,
    id: `level_${Date.now()}`,
    board: newBoard,
    timestamp: new Date(),
  };

  return newLevel;
}
