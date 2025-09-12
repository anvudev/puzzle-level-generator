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
    BarrierLock: "🚧",
    Bomb: "💣",
    Moving: "➡️",
  };
  return icons[elementType] || "⬜";
}
