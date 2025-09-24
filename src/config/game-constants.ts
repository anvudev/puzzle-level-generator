// Color mapping system - colors are now referenced by index
export const COLOR_MAPPING = {
  1: "#ff0000", // Red
  2: "#0000ff", // Blue
  3: "#00ff00", // Green
  4: "#ffff00", // Yellow
  5: "#ff9900", // Orange
  6: "#9900ff", // Purple
  7: "#ff00ff", // Pink
  8: "#00ffff", // Cyan
  9: "#4a86e8", // Light Blue
  10: "#876670", // Brown
  11: "#b7b7b7", // Grey
  12: "#ffffff", // White
} as const;

export const ELEMENT_TYPES = {
  Barrel: {
    name: "Barrel",
    description:
      "Block ẩn màu, đã định nghĩa sẵn màu. Chỉ khi có block được pick ở **bất kỳ ô kề 8 hướng** quanh Barrel thì Barrel **lộ màu** (vẫn là block thường sau khi lộ)",
    points: 1.5,
  },
  IceBlock: {
    name: "Ice Block",
    description:
      " block bị đóng băng, hiển thị số X. Mỗi lần pick **một block nằm kề 8 hướng** quanh ô Ice thì X - 1. Khi về 0, Ice unlock và lộ màu có sẵn. Bản thân Ice không thể được pick khi chưa unlock.",
    points: 1.5,
  },
  Pipe: {
    name: "Pipe",
    description:
      "ống có **duy nhất 1 hướng** được random từ đầu game (↑/→/↓/←). Khi **block ở ô cửa của Pipe được pick**, Pipe tự động **đẩy 1 block tiếp theo** ra theo hướng đó vào ô Pipe (tuần tự theo **thứ tự màu đã định sẵn** trong ống). Khi số đếm của Pipe về 0 thì Pipe rỗng (không đẩy nữa). Nếu ô phía trước bị tường (Pull Pin) hoặc ra ngoài board → **không sinh map như vậy** (invalid).",
    points: 2,
  },
  BlockLock: {
    name: "Block Lock",
    description:
      "mỗi Lock đi kèm **1 Key**. **Key chỉ được đặt lên block thường** (không đặt trên Barrel/Ice/Pipe/Bomb/Moving). Khi pick block chứa Key, Lock tương ứng mở. **Bắt buộc** Key phải reachable (không bị pull pin cứng cô lập) trước thời điểm cần mở Loc",
    points: 5,
  },
  PullPin: {
    name: "Pull Pin",
    description:
      'là **tường cứng** có hướng như pipe. Có đầu–đuôi, chắn thẳng đến hết cột hoặc hết dòng theo hướng của pull pin. Phía trước hướng của Pull Pin có 1-3 ô trống tạo hiệu ứng "cổng" hoặc "lối mở". Chỉ biến mất khi pick block “kẹp” ở đầu pull pin. Không cho phép sinh pull pin cắt board thành vùng không thể tiếp cận mục tiêu/Key.',
    points: 5,
  },
  Bomb: {
    name: "Bomb",
    description:
      "có số đếm. **Mỗi lần pick bất kỳ block**, Bomb - 1. Khi về 0 → THUA ngay. Bomb không reset số đếm. Không sinh level có Bomb mà countdown quá thấp đến mức không thể hoàn thành mục tiêu tối thiểu.",
    points: 8,
  },
  Moving: {
    name: "Moving",
    description:
      "chỉ **kích hoạt khi pick block liên quan** (đứng trên băng chuyền hoặc ô trigger). Khi kích hoạt, nó **đẩy liên tiếp** theo hướng cho đến khi hết cột/dòng hoặc gặp vật cản cứng (Barrier). Không tạo tình huống đẩy block xuyên tường.",
    points: 1.5,
  },
} as const;

export const DIFFICULTY_LEVELS = ["Normal", "Hard", "Super Hard"] as const;

export const DEFAULT_CONFIG = {
  name: "Level",
  width: 9,
  height: 10,
  blockCount: 27,
  colorCount: 3,
  selectedColors: ["1", "2", "3"],
  colorMapping: {
    "1": COLOR_MAPPING[1],
    "2": COLOR_MAPPING[2],
    "3": COLOR_MAPPING[3],
  },
  generationMode: "random" as const,
  elements: {},
  difficulty: "Normal" as const,
};

// AI Generation Settings
export const AI_GENERATION_CONFIG = {
  // Bật/tắt việc sử dụng AI (Gemini) để generate level
  ENABLE_AI_GENERATION: false,

  // Nếu AI bị tắt hoặc lỗi, sử dụng thuật toán fallback
  FORCE_USE_FALLBACK: false,

  // Timeout cho AI request (milliseconds)
  AI_TIMEOUT: 10000,

  // Số lần retry khi AI fail
  AI_RETRY_COUNT: 1,
} as const;

export const REALM = {
  APP_ID: "application-0-tnebttj",
  DB_NAME: "Puzzle",
  COLL_HISTORY: "history",
  COLL_IMPORT: "import",
};
