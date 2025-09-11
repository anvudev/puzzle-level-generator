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
  // For pipe element: contains colors inside the pipe
  pipeContents?: string[];
  // For pipe element: direction (up, down, left, right)
  pipeDirection?: "up" | "down" | "left" | "right";
  // For Block Lock system: lock ID and key ID
  lockId?: string; // For Lock elements
  keyId?: string; // For Key elements (matches with lockId)
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
  // Pipe information for UI display
  pipeInfo?: Array<{
    id: string;
    contents: string[];
    direction: "up" | "down" | "left" | "right";
    position: { x: number; y: number };
  }>;
  // Block Lock information for UI display
  lockInfo?: Array<{
    lockId: string;
    lockPosition: { x: number; y: number };
    keyPosition: { x: number; y: number };
    keyReachable: boolean;
  }>;
}
