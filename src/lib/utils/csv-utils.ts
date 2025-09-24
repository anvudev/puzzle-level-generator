import type { LevelConfig } from "@/config/game-types";
import { DEFAULT_CONFIG, COLOR_MAPPING } from "@/config/game-constants";

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
  "iceCounts",
  "blockLockCount",
  "pullPinCount",
  "bombCount",
  "bombCounts",
  "movingCount",
] as const;

export const CSV_FORMAT_EXAMPLE = `name,width,height,difficulty,selectedColors,blockCount,generationMode,pipeCount,pipeBlockCounts,barrelCount,iceBlockCount,iceCounts,blockLockCount,pullPinCount,bombCount,bombCounts,movingCount
"Test1",9,10,Normal,"1,2,3",60,random,2,"3,4",2,1,"5",0,0,1,"8",0
"Test2",9,10,Hard,"1,2,3,4",54,symmetric,3,"4,5,6",3,2,"2,3",1,3,1,"2",0
"Test3",9,10,"Super Hard","1,2,3,4,6",72,symmetric,4,"5,6,7,8",4,3,"2,3,4",2,4,2,"2,3",1
"Test4",9,10,Normal,"1,2",40,symmetric,3,"2,3,4",2,0,"",0,0,0,"",0
"Test5",9,10,Hard,"1,2,3,4",48,symmetric,2,"4,5",3,2,"4,5",2,1,1,0,0`;

export const CSV_FORMAT_DOCUMENTATION = `
CSV Format Documentation:

Required Columns:
- name: Tên level (string)
- width: Chiều rộng board (5-20)
- height: Chiều cao board (5-20)
- difficulty: Độ khó (Normal/Hard/Super Hard)
- selectedColors: Màu sắc sử dụng, cách nhau bởi dấu phẩy (1,2,3,4,6)
- blockCount: Tổng số block trong level (10-200)
- generationMode: Chế độ tạo level (random/symmetric)
- pipeCount: Số lượng pipe (0-20)
- pipeBlockCounts: Số block riêng cho từng pipe, cách nhau bởi dấu phẩy ("3,4,5")
- barrelCount: Số lượng barrel - block ẩn màu (0-30)
- iceBlockCount: Số lượng ice block - block đóng băng (0-8)
- blockLockCount: Số lượng block lock - khóa cần chìa (0-5)
- pullPinCount: Số lượng pull pin - tường có thể phá (0-10)
- bombCount: Số lượng bomb - đếm ngược (0-10)
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
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "11",
      "12",
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      // Legacy support for old color names
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
      // Legacy color_x format
      "color_1",
      "color_2",
      "color_3",
      "color_4",
      "color_5",
      "color_6",
      "color_7",
      "color_8",
      "color_9",
      "color_10",
      "color_11",
      "color_12",
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
    (config.blockCount < 10 || config.blockCount > 200)
  ) {
    errors.push(`Dòng ${lineNumber}: Block count phải từ 10-200`);
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

  if ((elements["Barrel"] || 0) < 0 || (elements["Barrel"] || 0) > 30) {
    errors.push(`Dòng ${lineNumber}: Barrel count phải từ 0-30`);
  }

  if ((elements["IceBlock"] || 0) < 0 || (elements["IceBlock"] || 0) > 8) {
    errors.push(`Dòng ${lineNumber}: Ice Block count phải từ 0-8`);
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

  if ((elements["Bomb"] || 0) < 0 || (elements["Bomb"] || 0) > 10) {
    errors.push(`Dòng ${lineNumber}: Bomb count phải từ 0-10`);
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
      elements: {}, // Fresh empty object for each config
    };

    headers.forEach((header, index) => {
      const value = values[index];
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

            // Convert legacy color names to number system
            const normalizedColors = colors.map((color: string | number) => {
              const colorStr = String(color);
              const lower = colorStr.toLowerCase();

              // If already a number or string number, convert to string
              if (typeof color === "number") return color.toString();
              if (/^\d+$/.test(colorStr)) return colorStr;

              // Convert legacy color_x format to number
              if (colorStr.startsWith("color_")) {
                const num = colorStr.replace("color_", "");
                return num;
              }

              // Convert legacy color names to numbers
              if (lower === "red") return "1";
              if (lower === "blue") return "2";
              if (lower === "green") return "3";
              if (lower === "yellow") return "4";
              if (lower === "orange") return "5";
              if (lower === "purple") return "6";
              if (lower === "pink") return "7";
              if (lower === "cyan") return "8";
              if (lower === "light blue") return "9";
              if (lower === "brown") return "10";
              if (lower === "grey") return "11";
              if (lower === "white") return "12";
              return colorStr; // Keep original if no match
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
        case "iceCounts":
          if (value && value !== '""' && value !== "") {
            config.iceCounts = value
              .replace(/"/g, "")
              .split(",")
              .map((n) => parseInt(n.trim()) || 2);
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
        case "bombCounts":
          if (value && value !== '""' && value !== "") {
            config.bombCounts = value
              .replace(/"/g, "")
              .split(",")
              .map((n) => parseInt(n.trim()) || 2);
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

    // Create colorMapping for the selected colors
    if (config.selectedColors) {
      config.colorMapping = {};
      config.selectedColors.forEach((colorKey) => {
        const numKey = parseInt(colorKey);
        if (
          !isNaN(numKey) &&
          COLOR_MAPPING[numKey as keyof typeof COLOR_MAPPING]
        ) {
          config.colorMapping![colorKey] =
            COLOR_MAPPING[numKey as keyof typeof COLOR_MAPPING];
        }
      });
    }

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

/**
 * Convert configs back to CSV format
 */
export function configsToCSV(configs: CSVLevelConfig[]): string {
  const headers = CSV_HEADERS.join(",");
  const rows = configs.map((config) => {
    const row = CSV_HEADERS.map((header) => {
      switch (header) {
        case "name":
          return `"${config.name || ""}"`;
        case "width":
          return config.width?.toString() || "10";
        case "height":
          return config.height?.toString() || "10";
        case "difficulty":
          return config.difficulty || "Normal";
        case "selectedColors":
          return `"${config.selectedColors?.join(",") || "1,2,3"}"`;
        case "blockCount":
          return config.blockCount?.toString() || "30";
        case "generationMode":
          return config.generationMode || "random";
        case "pipeCount":
          return (config.elements?.Pipe || 0).toString();
        case "pipeBlockCounts":
          return config.pipeBlockCounts && config.pipeBlockCounts.length > 0
            ? `"${config.pipeBlockCounts.join(",")}"`
            : '""';
        case "barrelCount":
          return (config.elements?.Barrel || 0).toString();
        case "iceBlockCount":
          return (config.elements?.IceBlock || 0).toString();
        case "iceCounts":
          return config.iceCounts && config.iceCounts.length > 0
            ? `"${config.iceCounts.join(",")}"`
            : '""';
        case "blockLockCount":
          return (
            config.elements?.BlockLock ||
            config.elements?.["Block Lock"] ||
            0
          ).toString();
        case "pullPinCount":
          return (config.elements?.PullPin || 0).toString();
        case "bombCount":
          return (config.elements?.Bomb || 0).toString();
        case "bombCounts":
          return config.bombCounts && config.bombCounts.length > 0
            ? `"${config.bombCounts.join(",")}"`
            : '""';
        case "movingCount":
          return (config.elements?.Moving || 0).toString();
        default:
          return "";
      }
    });
    return row.join(",");
  });

  return [headers, ...rows].join("\n");
}
