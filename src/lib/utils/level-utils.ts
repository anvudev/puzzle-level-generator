import type { GeneratedLevel } from "@/config/game-types";

export function formatLevelForExport(level: GeneratedLevel) {
  return {
    id: level.id,
    timestamp: level.timestamp.toISOString(),
    config: level.config,
    board: level.board,
    containers: level.containers,
    difficultyScore: level.difficultyScore,
    solvable: level.solvable,
  };
}

export function generateCSVRow(level: GeneratedLevel): string {
  const headers = [
    "ID",
    "Width",
    "Height",
    "BlockCount",
    "ColorCount",
    "Colors",
    "Elements",
    "DifficultyScore",
    "Solvable",
    "Timestamp",
  ];

  const row = [
    level.id,
    level.config.width,
    level.config.height,
    level.config.blockCount,
    level.config.colorCount,
    level.config.selectedColors.join(";"),
    Object.entries(level.config.elements)
      .map(([k, v]) => `${k}:${v}`)
      .join(";"),
    level.difficultyScore,
    level.solvable,
    level.timestamp.toISOString(),
  ];

  return [headers.join(","), row.join(",")].join("\n");
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
    id: `refill-${Date.now()}`,
    board: newBoard,
    timestamp: new Date(),
  };

  return newLevel;
}
