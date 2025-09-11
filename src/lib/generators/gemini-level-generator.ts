import type {
  LevelConfig,
  BoardCell,
  Container,
  GeneratedLevel,
} from "@/config/game-types";

export class GeminiLevelGenerator {
  private static apiKey = "AIzaSyDtL9apWT9BaPeMkWtW8GLmml3zMnm_yrk";

  static setApiKey(key: string) {
    this.apiKey = key;
  }

  private static createLevelPrompt(config: LevelConfig): string {
    const specialElements = Object.entries(config.elements)
      .filter(([, count]) => count > 0)
      .map(([type, count]) => `${type}:${count}`)
      .join(", ");

    const symmetryInstructions =
      config.generationMode === "symmetric"
        ? `

QUAN TRỌNG - HƯỚNG DẪN ĐỐI XỨNG:
Khi tạo level đối xứng, hãy tạo các hình dạng pixel art đối xứng qua trục dọc (bilateral symmetry):

VÍ DỤ CÁC HÌNH ĐỐI XỨNG:
1. HÌNH CÂY: Thân cây ở giữa, cành lá đối xứng hai bên
   \`\`\`
   . . G G G . .
   . G G G G G .
   G G G G G G G
   . . G G G . .
   . . B B B . .
   \`\`\`

2. HÌNH HOA: Cánh hoa đối xứng quanh tâm
   \`\`\`
   . R . G . R .
   R G G G G G R
   . G G Y G G .
   R G G G G G R
   . R . G . R .
   \`\`\`

3. HÌNH NHÀ: Mái nhà tam giác, cửa sổ đối xứng
   \`\`\`
   . . R R R . .
   . R R R R R .
   R R R R R R R
   B B G B G B B
   B B G B G B B
   \`\`\`

4. HÌNH BƯỚM: Cánh đối xứng hoàn hảo
   \`\`\`
   R G . . . G R
   R G G . G G R
   . R G B G R .
   . . R B R . .
   \`\`\`

QUY TẮC ĐỐI XỨNG:
- Mỗi block ở vị trí (x,y) phải có block tương ứng ở vị trí (width-1-x,y) với cùng màu
- Tạo hình dạng nhận diện được: cây, hoa, nhà, bướm, mây, lá
- Trục đối xứng ở giữa board (x = width/2)
- Có thể để trống một số vị trí để tạo hình rõ ràng hơn
- Ưu tiên tạo hình có ý nghĩa thay vì chỉ đối xứng ngẫu nhiên

`
        : "";

    const elementDistributionRules = specialElements
      ? `

QUY TẮC PHÂN BỐ ELEMENT ĐẶC BIỆT:
- KHÔNG được đẩy tất cả elements lên đầu board
- Phân bố đều elements theo các vùng:
  * Vùng trên (0-33% height): tối đa 30% elements
  * Vùng giữa (33-66% height): 40-50% elements  
  * Vùng dưới (66-100% height): 20-30% elements
- Các element cùng loại sẽ đứng cạnh nhau nhiều hơn nhưng không phải tất cả, vẫn phải phân bổ đều
- Elements phải tạo thành pattern tự nhiên, không cluster
- Ưu tiên đặt elements ở vị trí chiến lược (góc, giữa, cạnh)
- Với level đối xứng: elements phải đối xứng qua trục dọc

VÍ DỤ PHÂN BỐ TỐT:
\`\`\`
. . B . . . B . .  ← Barrel ở trên (30%)
. . . . . . . . .
. . . . P . . . .  ← Pipe ở giữa
. . . . . . . . .
. P . . . . . P .  ← Pipe đối xứng
. . . . . . . . .
. . . B . . B . .  ← Barrel ở dưới (20%)
\`\`\`

VÍ DỤ PHÂN BỐ XẤU (TRÁNH):
\`\`\`
B B P P B P B P .  ← Tất cả elements ở trên
. . . . . . . . .
. . . . . . . . .
. . . . . . . . .
\`\`\`
`
      : "";

    return `Tạo puzzle level ${config.width}x${config.height}, ${
      config.blockCount
    } blocks, màu: ${config.selectedColors.join(",")}.
${
  config.generationMode === "symmetric"
    ? "MODE: ĐỐI XỨNG - Tạo hình pixel art đối xứng"
    : "MODE: NGẪU NHIÊN"
}

${symmetryInstructions}
${elementDistributionRules}

Quy tắc chung:
- Mỗi màu chia hết cho 3 blocks
- Container 3-5 slots, không trống
- Level phải solvable
- Elements đặc biệt: ${specialElements || "không"}

JSON format:
{
  "board": [[{"type":"block|empty","color":"color|null","element":"element|null"}]],
  "containers": [{"id":"container_0","slots":4,"contents":[{"color":"red","type":"block"}]}],
  "solvable": true,
  "reasoning": "brief explanation"
}`;
  }

  static async generateLevelWithGemini(
    config: LevelConfig
  ): Promise<GeneratedLevel> {
    if (!this.apiKey) {
      throw new Error("Google Gemini API key chưa được thiết lập");
    }

    const prompt = this.createLevelPrompt(config);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 4096, // Increased token limit
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API Response Error:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        throw new Error(
          `Gemini API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data = await response.json();
      console.log("[v0] Gemini API Response:", data);

      if (!data.candidates || data.candidates.length === 0) {
        console.error("No candidates in Gemini response:", data);
        throw new Error("Không có candidates trong response từ Gemini API");
      }

      const candidate = data.candidates[0];

      if (candidate.finishReason === "MAX_TOKENS") {
        console.warn(
          "Gemini response was truncated due to MAX_TOKENS, using fallback"
        );
        return this.generateFallbackLevel(config);
      }

      if (
        !candidate.content ||
        !candidate.content.parts ||
        candidate.content.parts.length === 0
      ) {
        console.error("Invalid candidate structure:", candidate);
        throw new Error("Cấu trúc candidate không hợp lệ từ Gemini API");
      }

      const generatedText = candidate.content.parts[0].text;
      console.log("[v0] Generated text from Gemini:", generatedText);

      if (!generatedText) {
        throw new Error("Không nhận được text từ Gemini API");
      }

      let jsonMatch = generatedText.match(/```json\s*([\s\S]*?)\s*```/);
      if (!jsonMatch) {
        jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      }

      if (!jsonMatch) {
        console.error("No JSON found in response:", generatedText);
        throw new Error("Không tìm thấy JSON trong response từ Gemini");
      }

      let levelData;
      try {
        levelData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        console.log("[v0] Parsed level data:", levelData);
      } catch (parseError) {
        console.error(
          "JSON parse error:",
          parseError,
          "Raw JSON:",
          jsonMatch[0]
        );
        throw new Error("Lỗi parse JSON từ Gemini response");
      }

      const level: GeneratedLevel = {
        id: `gemini_level_${Date.now()}`,
        config: { ...config },
        board: levelData.board || this.generateFallbackBoard(config),
        containers:
          levelData.containers || this.generateFallbackContainers(config),
        difficultyScore: this.calculateDifficultyScore(config),
        solvable: levelData.solvable || false,
        timestamp: new Date(),
        aiReasoning: levelData.reasoning || "Được tạo bởi Gemini AI",
      };

      if (this.validateLevel(level)) {
        return level;
      } else {
        console.warn("Level từ Gemini không hợp lệ, sử dụng fallback");
        return this.generateFallbackLevel(config);
      }
    } catch (error) {
      console.error("Lỗi khi gọi Gemini API:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return this.generateFallbackLevel(config);
    }
  }

  private static validateLevel(level: GeneratedLevel): boolean {
    if (!level.board || level.board.length !== level.config.height) {
      return false;
    }

    if (!level.board.every((row) => row.length === level.config.width)) {
      return false;
    }

    if (!level.containers || level.containers.length === 0) {
      return false;
    }

    if (level.containers.some((c) => c.contents.length === 0)) {
      return false;
    }

    return true;
  }

  private static generateFallbackLevel(config: LevelConfig): GeneratedLevel {
    return {
      id: `fallback_level_${Date.now()}`,
      config: { ...config },
      board: this.generateFallbackBoard(config),
      containers: this.generateFallbackContainers(config),
      difficultyScore: this.calculateDifficultyScore(config),
      solvable: false,
      timestamp: new Date(),
      aiReasoning: "Fallback level - Gemini API không khả dụng",
    };
  }

  private static generateFallbackBoard(config: LevelConfig): BoardCell[][] {
    const board: BoardCell[][] = Array(config.height)
      .fill(null)
      .map(() =>
        Array(config.width)
          .fill(null)
          .map(() => ({
            type: "empty" as const,
            color: null,
            element: null,
          }))
      );

    if (config.generationMode === "symmetric") {
      return this.generateSymmetricFallbackBoard(config);
    }

    const colors = config.selectedColors;
    const totalBlocks = config.blockCount;

    const baseBlocksPerColor = Math.floor(totalBlocks / colors.length);
    const remainder = totalBlocks % colors.length;

    const colorDistribution: string[] = [];
    colors.forEach((color, index) => {
      const blocksForThisColor =
        baseBlocksPerColor + (index < remainder ? 1 : 0);
      for (let i = 0; i < blocksForThisColor; i++) {
        colorDistribution.push(color);
      }
    });

    // Shuffle the color distribution
    for (let i = colorDistribution.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [colorDistribution[i], colorDistribution[j]] = [
        colorDistribution[j],
        colorDistribution[i],
      ];
    }

    const availablePositions = [];
    for (let y = 0; y < config.height; y++) {
      for (let x = 0; x < config.width; x++) {
        availablePositions.push({ x, y });
      }
    }

    // Shuffle available positions
    for (let i = availablePositions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availablePositions[i], availablePositions[j]] = [
        availablePositions[j],
        availablePositions[i],
      ];
    }

    // Place exactly totalBlocks blocks
    for (let i = 0; i < Math.min(totalBlocks, availablePositions.length); i++) {
      const pos = availablePositions[i];
      board[pos.y][pos.x] = {
        type: "block",
        color: colorDistribution[i],
        element: null,
      };
    }

    Object.entries(config.elements).forEach(([elementType, count]) => {
      if (count > 0) {
        const blockPositions = [];
        for (let y = 0; y < config.height; y++) {
          for (let x = 0; x < config.width; x++) {
            if (board[y][x].type === "block" && !board[y][x].element) {
              blockPositions.push({ x, y });
            }
          }
        }

        // Distribute elements across three regions
        const topRegion = blockPositions.filter(
          (pos) => pos.y < config.height * 0.33
        );
        const middleRegion = blockPositions.filter(
          (pos) => pos.y >= config.height * 0.33 && pos.y < config.height * 0.66
        );
        const bottomRegion = blockPositions.filter(
          (pos) => pos.y >= config.height * 0.66
        );

        const topCount = Math.floor(count * 0.3);
        const middleCount = Math.floor(count * 0.45);
        const bottomCount = count - topCount - middleCount;

        // Place elements in each region
        const placeInRegion = (
          region: { x: number; y: number }[],
          targetCount: number
        ) => {
          const shuffled = [...region].sort(() => Math.random() - 0.5);
          for (let i = 0; i < Math.min(targetCount, shuffled.length); i++) {
            const pos = shuffled[i];
            board[pos.y][pos.x].element = elementType as "barrel" | "pipe";
          }
        };

        placeInRegion(topRegion, topCount);
        placeInRegion(middleRegion, middleCount);
        placeInRegion(bottomRegion, bottomCount);
      }
    });

    return board;
  }

  private static generateSymmetricFallbackBoard(
    config: LevelConfig
  ): BoardCell[][] {
    const board: BoardCell[][] = Array(config.height)
      .fill(null)
      .map(() =>
        Array(config.width)
          .fill(null)
          .map(() => ({
            type: "empty" as const,
            color: null,
            element: null,
          }))
      );

    const colors = config.selectedColors;
    const centerX = Math.floor(config.width / 2);
    const totalBlocks = config.blockCount;

    const baseBlocksPerColor = Math.floor(totalBlocks / colors.length);
    const remainder = totalBlocks % colors.length;

    const colorDistribution: string[] = [];
    colors.forEach((color, index) => {
      const blocksForThisColor =
        baseBlocksPerColor + (index < remainder ? 1 : 0);
      for (let i = 0; i < blocksForThisColor; i++) {
        colorDistribution.push(color);
      }
    });

    // Shuffle colors for variety
    for (let i = colorDistribution.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [colorDistribution[i], colorDistribution[j]] = [
        colorDistribution[j],
        colorDistribution[i],
      ];
    }

    let placedBlocks = 0;
    let colorIndex = 0;

    // Generate symmetric pattern with exact block count
    const placeSymmetricBlock = (x: number, y: number) => {
      if (placedBlocks >= totalBlocks || colorIndex >= colorDistribution.length)
        return false;
      if (x < 0 || x >= config.width || y < 0 || y >= config.height)
        return false;
      if (board[y][x].type !== "empty") return false;

      board[y][x] = {
        type: "block",
        color: colorDistribution[colorIndex],
        element: null,
      };
      placedBlocks++;
      colorIndex++;

      // Place symmetric counterpart if different position
      const mirrorX = config.width - 1 - x;
      if (
        mirrorX !== x &&
        placedBlocks < totalBlocks &&
        colorIndex < colorDistribution.length
      ) {
        if (board[y][mirrorX].type === "empty") {
          board[y][mirrorX] = {
            type: "block",
            color: colorDistribution[colorIndex],
            element: null,
          };
          placedBlocks++;
          colorIndex++;
        }
      }
      return true;
    };

    // Tree pattern
    const patterns = [
      () => {
        // Tree crown
        for (
          let y = 0;
          y < Math.min(4, config.height - 2) && placedBlocks < totalBlocks;
          y++
        ) {
          const width = Math.min(y + 2, centerX);
          for (
            let x = centerX - width;
            x <= centerX + width && placedBlocks < totalBlocks;
            x++
          ) {
            placeSymmetricBlock(x, y);
          }
        }
        // Tree trunk
        for (
          let y = Math.min(4, config.height - 2);
          y < Math.min(config.height, 6) && placedBlocks < totalBlocks;
          y++
        ) {
          placeSymmetricBlock(centerX, y);
        }
      },
      () => {
        // House pattern
        const roofHeight = Math.min(3, config.height - 3);
        // Roof
        for (let y = 0; y < roofHeight && placedBlocks < totalBlocks; y++) {
          const width = roofHeight - y;
          for (
            let x = centerX - width;
            x <= centerX + width && placedBlocks < totalBlocks;
            x++
          ) {
            placeSymmetricBlock(x, y);
          }
        }
        // House body
        for (
          let y = roofHeight;
          y < Math.min(config.height, roofHeight + 3) &&
          placedBlocks < totalBlocks;
          y++
        ) {
          for (
            let x = centerX - 2;
            x <= centerX + 2 && placedBlocks < totalBlocks;
            x++
          ) {
            placeSymmetricBlock(x, y);
          }
        }
      },
      () => {
        // Flower pattern
        const centerY = Math.floor(config.height / 2);
        // Center
        placeSymmetricBlock(centerX, centerY);
        // Petals
        const petalPositions = [
          [-1, -1],
          [0, -1],
          [1, -1],
          [-1, 0],
          [1, 0],
          [-1, 1],
          [0, 1],
          [1, 1],
        ];
        petalPositions.forEach(([dx, dy]) => {
          if (placedBlocks < totalBlocks) {
            placeSymmetricBlock(centerX + dx, centerY + dy);
          }
        });
      },
    ];

    // Execute random pattern
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    pattern();

    while (
      placedBlocks < totalBlocks &&
      colorIndex < colorDistribution.length
    ) {
      const availablePositions = [];
      for (let y = 0; y < config.height; y++) {
        for (let x = 0; x <= centerX; x++) {
          if (board[y][x].type === "empty") {
            availablePositions.push({ x, y });
          }
        }
      }

      if (availablePositions.length === 0) break;

      const randomPos =
        availablePositions[
          Math.floor(Math.random() * availablePositions.length)
        ];
      if (!placeSymmetricBlock(randomPos.x, randomPos.y)) break;
    }

    Object.entries(config.elements).forEach(([elementType, count]) => {
      if (count > 0) {
        const blockPositions = [];
        for (let y = 0; y < config.height; y++) {
          for (let x = 0; x <= centerX; x++) {
            if (board[y][x].type === "block" && !board[y][x].element) {
              blockPositions.push({ x, y });
            }
          }
        }

        // Distribute elements across regions for symmetric placement
        const topRegion = blockPositions.filter(
          (pos) => pos.y < config.height * 0.33
        );
        const middleRegion = blockPositions.filter(
          (pos) => pos.y >= config.height * 0.33 && pos.y < config.height * 0.66
        );
        const bottomRegion = blockPositions.filter(
          (pos) => pos.y >= config.height * 0.66
        );

        const totalElementsToPlace = Math.floor(count / 2); // Half for each side
        const topCount = Math.floor(totalElementsToPlace * 0.3);
        const middleCount = Math.floor(totalElementsToPlace * 0.45);
        const bottomCount = totalElementsToPlace - topCount - middleCount;

        const placeSymmetricElements = (
          region: { x: number; y: number }[],
          targetCount: number
        ) => {
          const shuffled = [...region].sort(() => Math.random() - 0.5);
          for (let i = 0; i < Math.min(targetCount, shuffled.length); i++) {
            const pos = shuffled[i];
            board[pos.y][pos.x].element = elementType as "barrel" | "pipe";

            // Place symmetric counterpart
            const mirrorX = config.width - 1 - pos.x;
            if (
              mirrorX !== pos.x &&
              board[pos.y][mirrorX].type === "block" &&
              !board[pos.y][mirrorX].element
            ) {
              board[pos.y][mirrorX].element = elementType as "barrel" | "pipe";
            }
          }
        };

        placeSymmetricElements(topRegion, topCount);
        placeSymmetricElements(middleRegion, middleCount);
        placeSymmetricElements(bottomRegion, bottomCount);
      }
    });

    console.log(
      `[v0] Symmetric board generated: ${placedBlocks} blocks placed (requested: ${totalBlocks})`
    );
    return board;
  }

  private static generateFallbackContainers(config: LevelConfig): Container[] {
    const containerCount = Math.max(3, Math.ceil(config.blockCount / 12));
    const containers: Container[] = [];

    for (let i = 0; i < containerCount; i++) {
      const slots = Math.floor(Math.random() * 3) + 3; // 3-5 slots
      const initialFill = Math.max(1, Math.floor(Math.random() * (slots - 1))); // At least 1, max slots-1

      const contents = [];
      for (let j = 0; j < initialFill; j++) {
        contents.push({
          color:
            config.selectedColors[
              Math.floor(Math.random() * config.selectedColors.length)
            ],
          type: "block",
        });
      }

      containers.push({
        id: `container_${i}`,
        slots: slots,
        contents: contents,
      });
    }

    return containers;
  }

  private static calculateDifficultyScore(config: LevelConfig): number {
    let score = 0;
    score += config.colorCount * 3;
    score += config.blockCount * 1;

    Object.entries(config.elements).forEach(([, count]) => {
      score += count * 1.5;
    });

    return score;
  }

  static generateBoard = this.generateFallbackBoard;
  static generateContainers = this.generateFallbackContainers;
  static checkSolvability(
    _board: BoardCell[][],
    _containers: Container[]
  ): boolean {
    return true; // Simplified for fallback
  }
  static async generateLevel(config: LevelConfig): Promise<GeneratedLevel> {
    return this.generateLevelWithGemini(config);
  }
}
