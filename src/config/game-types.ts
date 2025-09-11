export interface LevelConfig {
  width: number;
  height: number;
  blockCount: number;
  colorCount: number;
  selectedColors: string[];
  generationMode: "random" | "symmetric";
  elements: Record<string, number>;
  difficulty: "Normal" | "Hard" | "Super Hard";
}

export interface BoardCell {
  type: "empty" | "block";
  color: string | null;
  element: string | null;
}

export interface Container {
  id: string;
  slots: number;
  contents: Array<{
    color: string;
    type: string;
  }>;
}

export interface GeneratedLevel {
  id: string;
  config: LevelConfig;
  board: BoardCell[][];
  containers: Container[];
  difficultyScore: number;
  solvable: boolean;
  timestamp: Date;
  aiReasoning?: string;
}
