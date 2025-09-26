export interface LevelConfig {
  name: string;
  width: number;
  height: number;
  blockCount: number;
  colorCount: number;
  selectedColors: string[]; // Now contains "1", "2", etc.
  colorMapping: Record<string, string>; // Maps "1" -> #ff0000, etc.
  generationMode: "random" | "symmetric";
  elements: Record<string, number>;
  difficulty: "Normal" | "Hard" | "Super Hard";
  // Pipe configuration
  pipeCount?: number; // Number of pipes to generate
  pipeBlockCount?: number; // Default number of blocks inside each pipe
  pipeBlockCounts?: number[]; // Individual block counts for each pipe

  // Bomb configuration
  bombCounts?: number[]; // Individual counts for each bomb (1-3 power each)

  // Ice configuration
  iceCounts?: number[]; // Individual counts for each ice block (1-3 hits each)

  // Moving configuration
  movingCount?: number; // Number of moving elements to generate
  movingBlockCount?: number; // Default number of blocks inside each moving element
  movingBlockCounts?: number[]; // Individual block counts for each moving element
}

export interface BoardCell {
  type: "empty" | "block" | "wall";
  color: string | null;
  element: string | null;
  // For pipe element: contains colors inside the pipe
  pipeContents?: string[];
  // For pipe element: direction (up, down, left, right)
  pipeDirection?: "up" | "down" | "left" | "right";
  // For pipe element: size (number of blocks inside)
  pipeSize?: number;
  // For Block Lock system: lock ID and key ID
  lockId?: string; // For Lock elements
  keyId?: string; // For Key elements (matches with lockId)
  lockPairNumber?: number; // Display number for lock-key pairs (1, 2, 3, etc.)

  // For Pull Pin element: direction and gate configuration
  pullPinDirection?: "up" | "down" | "left" | "right";
  pullPinGateSize?: number; // Number of empty cells (1-3) in front of the pin

  // For Ice Block element: remaining count
  iceCount?: number; // Number of hits needed to break ice

  // For Bomb element: explosion radius or count
  bombCount?: number; // Explosion power or remaining uses

  // For Moving element: direction and movement configuration
  movingDirection?: "up" | "down" | "left" | "right";
  movingDistance?: number; // How many cells it can move (random 1-3)
  movingContents?: string[]; // Colors inside the moving element
  movingSize?: number; // Number of blocks inside the moving element
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
  // Pipe information for UI display
  pipeInfo?: Array<{
    id: string;
    contents: string[];
    direction: "up" | "down" | "left" | "right";
    position: { x: number; y: number };
  }>;
  // Moving information for UI display
  movingInfo?: Array<{
    id: string;
    contents: string[];
    direction: "up" | "down" | "left" | "right";
    distance: number;
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
