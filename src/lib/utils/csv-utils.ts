import type { LevelConfig } from "@/config/game-types";
import { DEFAULT_CONFIG } from "@/config/game-constants";

export interface CSVLevelConfig extends LevelConfig {
  name: string;
}

export const CSV_HEADERS = [
  "name",
  "width",
  "height",
  "difficulty",
  "selectedColors",
  "blockCount",
  "generationMode",
  "pipeCount",
  "pipeBlockCounts",
  "barrelCount",
  "iceBlockCount",
  "blockLockCount",
  "pullPinCount",
  "bombCount",
  "movingCount",
] as const;

export const CSV_FORMAT_EXAMPLE = `name,width,height,difficulty,selectedColors,blockCount,generationMode,pipeCount,pipeBlockCounts,barrelCount,iceBlockCount,blockLockCount,pullPinCount,bombCount,movingCount
"Simple Level",10,10,Normal,"Red,Blue,Green",60,random,3,"3,4,5",2,1,0,2,0,0
"Medium Challenge",12,12,Hard,"Red,Blue,Green,Yellow",100,symmetric,4,"4,5,6,7",3,2,1,3,1,0
"Hard Puzzle",15,15,"Super Hard","Red,Blue,Green,Yellow,Purple",150,random,5,"5,6,7,8,9",4,3,2,4,2,1
"Pipe Focus",8,8,Normal,"Red,Blue",40,symmetric,5,"2,3,4,5,6",0,0,0,0,0,0
"Element Mix",12,12,Hard,"Red,Blue,Green,Yellow",120,random,2,"4,5",3,2,1,2,1,1`;

export const CSV_FORMAT_DOCUMENTATION = `
CSV Format Documentation:

Required Columns:
- name: Tên level (string)
- width: Chiều rộng board (5-20)
- height: Chiều cao board (5-20)
- difficulty: Độ khó (Normal/Hard/Super Hard)
- selectedColors: Màu sắc sử dụng, cách nhau bởi dấu phẩy (Red,Blue,Green,Yellow,Purple)
- blockCount: Tổng số block trong level (10-400)
- generationMode: Chế độ tạo level (random/symmetric)
- pipeCount: Số lượng pipe (0-20)
- pipeBlockCounts: Số block riêng cho từng pipe, cách nhau bởi dấu phẩy ("3,4,5")
- barrelCount: Số lượng barrel - block ẩn màu (0-10)
- iceBlockCount: Số lượng ice block - block đóng băng (0-10)
- blockLockCount: Số lượng block lock - khóa cần chìa (0-5)
- pullPinCount: Số lượng pull pin - tường có thể phá (0-10)
- bombCount: Số lượng bomb - đếm ngược (0-3)
- movingCount: Số lượng moving - băng chuyền (0-5)

Notes:
- Sử dụng dấu ngoặc kép cho các giá trị có chứa dấu phẩy
- pipeBlockCounts có thể để trống để sử dụng giá trị mặc định
- blockCount sẽ quyết định mật độ block trên board
- Tất cả elements đều optional, có thể để 0
- Tổng elements không nên vượt quá 50% số block
- selectedColors phải chứa ít nhất 1 màu hợp lệ
`;

export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

export function validateCSVConfig(
  config: Partial<CSVLevelConfig>,
  lineNumber: number
): string[] {
  const errors: string[] = [];

  // Validate name
  if (!config.name || config.name.trim() === "") {
    errors.push(`Dòng ${lineNumber}: Thiếu tên level`);
  }

  // Validate dimensions
  if (!config.width || config.width < 5 || config.width > 20) {
    errors.push(`Dòng ${lineNumber}: Width phải từ 5-20`);
  }

  if (!config.height || config.height < 5 || config.height > 20) {
    errors.push(`Dòng ${lineNumber}: Height phải từ 5-20`);
  }

  // Validate difficulty
  if (
    !config.difficulty ||
    !["Normal", "Hard", "Super Hard", "easy", "medium", "hard"].includes(
      config.difficulty
    )
  ) {
    errors.push(
      `Dòng ${lineNumber}: Difficulty phải là Normal, Hard, Super Hard (hoặc easy, medium, hard)`
    );
  }

  // Validate colors
  if (!config.selectedColors || config.selectedColors.length === 0) {
    errors.push(`Dòng ${lineNumber}: Phải có ít nhất 1 màu`);
  } else {
    const validColors = [
      "red",
      "blue",
      "green",
      "yellow",
      "purple",
      "Red",
      "Blue",
      "Green",
      "Yellow",
      "Purple",
      "Brown",
      "Orange",
      "Cyan",
      "Light Blue",
      "Pink",
      "Grey",
      "White",
    ];
    const invalidColors = config.selectedColors.filter(
      (color) => !validColors.includes(color)
    );
    if (invalidColors.length > 0) {
      errors.push(
        `Dòng ${lineNumber}: Màu không hợp lệ: ${invalidColors.join(", ")}`
      );
    }
  }

  // Validate pipe count
  if (
    config.pipeCount !== undefined &&
    (config.pipeCount < 0 || config.pipeCount > 20)
  ) {
    errors.push(`Dòng ${lineNumber}: Pipe count phải từ 0-20`);
  }

  // Validate block count
  if (
    config.blockCount !== undefined &&
    (config.blockCount < 10 || config.blockCount > 400)
  ) {
    errors.push(`Dòng ${lineNumber}: Block count phải từ 10-400`);
  }

  // Validate generation mode
  if (
    config.generationMode &&
    !["random", "symmetric"].includes(config.generationMode)
  ) {
    errors.push(
      `Dòng ${lineNumber}: Generation mode phải là random hoặc symmetric`
    );
  }

  // Validate pipe block counts array
  if (config.pipeBlockCounts && config.pipeCount) {
    if (config.pipeBlockCounts.length !== config.pipeCount) {
      errors.push(
        `Dòng ${lineNumber}: Số lượng pipe block counts (${config.pipeBlockCounts.length}) phải bằng pipe count (${config.pipeCount})`
      );
    }

    const invalidBlockCounts = config.pipeBlockCounts.filter(
      (count) => count < 1 || count > 20
    );
    if (invalidBlockCounts.length > 0) {
      errors.push(`Dòng ${lineNumber}: Pipe block counts phải từ 1-20`);
    }
  }

  // Validate all element counts
  const elements = config.elements || {};

  if ((elements["Barrel"] || 0) < 0 || (elements["Barrel"] || 0) > 10) {
    errors.push(`Dòng ${lineNumber}: Barrel count phải từ 0-10`);
  }

  if ((elements["IceBlock"] || 0) < 0 || (elements["IceBlock"] || 0) > 10) {
    errors.push(`Dòng ${lineNumber}: Ice Block count phải từ 0-10`);
  }

  if (
    (elements["BlockLock"] || elements["Block Lock"] || 0) < 0 ||
    (elements["BlockLock"] || elements["Block Lock"] || 0) > 5
  ) {
    errors.push(`Dòng ${lineNumber}: Block Lock count phải từ 0-5`);
  }

  if ((elements["PullPin"] || 0) < 0 || (elements["PullPin"] || 0) > 10) {
    errors.push(`Dòng ${lineNumber}: Pull Pin count phải từ 0-10`);
  }

  if ((elements["Bomb"] || 0) < 0 || (elements["Bomb"] || 0) > 3) {
    errors.push(`Dòng ${lineNumber}: Bomb count phải từ 0-3`);
  }

  if ((elements["Moving"] || 0) < 0 || (elements["Moving"] || 0) > 5) {
    errors.push(`Dòng ${lineNumber}: Moving count phải từ 0-5`);
  }

  // Validate total elements don't exceed reasonable limits
  const totalElements = Object.values(elements).reduce(
    (sum, count) => sum + count,
    0
  );
  const maxElements = Math.floor(
    (config.width || 10) * (config.height || 10) * 0.5
  );
  if (totalElements > maxElements) {
    errors.push(
      `Dòng ${lineNumber}: Tổng số elements (${totalElements}) không nên vượt quá 50% board (${maxElements})`
    );
  }

  return errors;
}

export function parseCSVToConfigs(csvText: string): CSVLevelConfig[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) {
    throw new Error("File CSV phải có ít nhất 2 dòng (header và dữ liệu)");
  }

  const headers = parseCSVLine(lines[0]).map((h) => h.trim());
  console.log("📋 CSV Headers:", headers);
  console.log("📋 Expected Headers:", CSV_HEADERS);

  const configs: CSVLevelConfig[] = [];
  const allErrors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]).map((v) => v.trim());
    if (values.length !== headers.length) {
      allErrors.push(
        `Dòng ${i + 1}: Số cột không khớp với header (có ${
          values.length
        }, cần ${headers.length})`
      );
      continue;
    }

    const config: Partial<CSVLevelConfig> = {
      ...DEFAULT_CONFIG,
    };

    headers.forEach((header, index) => {
      const value = values[index];
      console.log(`🔍 Processing ${header}: "${value}"`);
      switch (header) {
        case "name":
          config.name = value || `Level ${i}`;
          break;
        case "width":
          config.width = parseInt(value) || DEFAULT_CONFIG.width;
          break;
        case "height":
          config.height = parseInt(value) || DEFAULT_CONFIG.height;
          break;
        case "difficulty":
          // Normalize difficulty values
          let normalizedDifficulty = value;
          if (value === "easy") normalizedDifficulty = "Normal";
          else if (value === "medium") normalizedDifficulty = "Hard";
          else if (value === "hard") normalizedDifficulty = "Super Hard";

          config.difficulty = ["Normal", "Hard", "Super Hard"].includes(
            normalizedDifficulty
          )
            ? (normalizedDifficulty as "Normal" | "Hard" | "Super Hard")
            : DEFAULT_CONFIG.difficulty;
          break;
        case "selectedColors":
          if (value && value !== '""' && value !== "") {
            const colors = value
              .replace(/"/g, "")
              .split(",")
              .map((c) => c.trim())
              .filter((c) => c);

            // Normalize color names (capitalize first letter)
            const normalizedColors = colors.map((color) => {
              const lower = color.toLowerCase();
              if (lower === "red") return "Red";
              if (lower === "blue") return "Blue";
              if (lower === "green") return "Green";
              if (lower === "yellow") return "Yellow";
              if (lower === "purple") return "Purple";
              if (lower === "brown") return "Brown";
              if (lower === "orange") return "Orange";
              if (lower === "cyan") return "Cyan";
              if (lower === "light blue") return "Light Blue";
              if (lower === "pink") return "Pink";
              if (lower === "grey") return "Grey";
              if (lower === "white") return "White";
              return color; // Keep original if no match
            });

            config.selectedColors = normalizedColors;
          } else {
            config.selectedColors = DEFAULT_CONFIG.selectedColors;
          }
          break;
        case "blockCount":
          config.blockCount = parseInt(value) || DEFAULT_CONFIG.blockCount;
          break;
        case "generationMode":
          config.generationMode = ["random", "symmetric"].includes(value)
            ? (value as "random" | "symmetric")
            : DEFAULT_CONFIG.generationMode;
          break;
        case "pipeCount":
          const pipeCount = parseInt(value) || 0;
          config.pipeCount = pipeCount;
          if (pipeCount > 0) {
            config.elements = config.elements || {};
            config.elements["Pipe"] = pipeCount;
          }
          break;
        case "pipeBlockCounts":
          if (value && value !== '""' && value !== "") {
            config.pipeBlockCounts = value
              .replace(/"/g, "")
              .split(",")
              .map((n) => parseInt(n.trim()) || 3);
          }
          break;
        case "barrelCount":
          const barrelCount = parseInt(value) || 0;
          if (barrelCount > 0) {
            config.elements = config.elements || {};
            config.elements["Barrel"] = barrelCount;
          }
          break;
        case "iceBlockCount":
          const iceBlockCount = parseInt(value) || 0;
          if (iceBlockCount > 0) {
            config.elements = config.elements || {};
            config.elements["IceBlock"] = iceBlockCount;
          }
          break;
        case "blockLockCount":
          const blockLockCount = parseInt(value) || 0;
          if (blockLockCount > 0) {
            config.elements = config.elements || {};
            config.elements["BlockLock"] = blockLockCount;
          }
          break;
        case "pullPinCount":
          const pullPinCount = parseInt(value) || 0;
          if (pullPinCount > 0) {
            config.elements = config.elements || {};
            config.elements["PullPin"] = pullPinCount;
          }
          break;
        case "bombCount":
          const bombCount = parseInt(value) || 0;
          if (bombCount > 0) {
            config.elements = config.elements || {};
            config.elements["Bomb"] = bombCount;
          }
          break;
        case "movingCount":
          const movingCount = parseInt(value) || 0;
          if (movingCount > 0) {
            config.elements = config.elements || {};
            config.elements["Moving"] = movingCount;
          }
          break;
      }
    });

    // Debug parsed config
    console.log("🔧 Parsed config:", {
      name: config.name,
      elements: config.elements,
      pipeCount: config.pipeCount,
      pipeBlockCounts: config.pipeBlockCounts,
    });

    // Validate the config
    const errors = validateCSVConfig(config, i + 1);
    if (errors.length > 0) {
      allErrors.push(...errors);
    } else {
      configs.push(config as CSVLevelConfig);
    }
  }

  if (allErrors.length > 0) {
    throw new Error(allErrors.join("\n"));
  }

  return configs;
}

export function downloadCSVTemplate() {
  const blob = new Blob([CSV_FORMAT_EXAMPLE], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "level-template.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
