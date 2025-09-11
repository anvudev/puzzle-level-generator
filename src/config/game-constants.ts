export const GAME_COLORS = {
  Brown: "#876670",
  Red: "#ff0000",
  Orange: "#ff9900",
  Yellow: "#ffff00",
  Green: "#00ff00",
  Cyan: "#00ffff",
  "Light Blue": "#4a86e8",
  Blue: "#0000ff",
  Purple: "#9900ff",
  Pink: "#ff00ff",
  Grey: "#b7b7b7",
  White: "#ffffff",
} as const;

export const ELEMENT_TYPES = {
  Block: {
    name: "Block",
    description: "Block bình thường, là ô màu có sẵn màu",
    points: 1,
  },
  Barrel: {
    name: "Barrel",
    description: "Block bị ẩn màu, hiện màu khi block ở cạnh được sử dụng",
    points: 1.5,
  },
  IceBlock: {
    name: "Ice Block",
    description:
      "Block bị đóng băng, hiện số X, sau X block được sử dụng thì mới unlock",
    points: 1.5,
  },
  Pipe: {
    name: "Pipe",
    description: "Ống màu có số, đẩy màu ra ô ở phía đầu ống",
    points: 2,
  },
  BlockLock: {
    name: "Block Lock",
    description: "Block bị khoá, có key để mở xuất hiện random",
    points: 5,
  },
  BarrierLock: {
    name: "Barrier Lock",
    description: "Thanh chắn đường, mở khoá bằng cách ăn block kẹp",
    points: 5,
  },
  Bomb: {
    name: "Bomb",
    description: "Block bomb, có chứa số, giảm dần mỗi lần sử dụng",
    points: 8,
  },
  Moving: {
    name: "Moving",
    description: "Băng truyền đẩy màu đến hết cột/dòng",
    points: 1.5,
  },
} as const;

export const DIFFICULTY_LEVELS = ["Normal", "Hard", "Super Hard"] as const;

export const DEFAULT_CONFIG = {
  width: 9,
  height: 10,
  blockCount: 27,
  colorCount: 3,
  selectedColors: ["Red", "Blue", "Green"],
  generationMode: "random" as const,
  elements: {},
  difficulty: "Normal" as const,
};
