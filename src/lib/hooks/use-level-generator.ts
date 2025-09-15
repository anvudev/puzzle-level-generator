"use client";

import { useState, useCallback } from "react";
import type { LevelConfig, GeneratedLevel } from "@/config/game-types";
import { GeminiLevelGenerator } from "@/lib/generators/gemini-level-generator";

export function useLevelGenerator() {
  const [generatedLevel, setGeneratedLevel] = useState<GeneratedLevel | null>(
    null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiKey, setApiKey] = useState<string>("");

  const isLevelValid = (level: GeneratedLevel): boolean => {
    // Kiểm tra cấu trúc cơ bản
    if (!level.board || level.board.length !== level.config.height)
      return false;
    if (!level.board.every((row) => row.length === level.config.width))
      return false;

    // Thống kê số block chơi được: block có màu trên board + pipe contents
    let coloredBlocksOnBoard = 0;
    let totalPipeContents = 0;
    const colorCounts: Record<string, number> = {};

    for (const row of level.board) {
      for (const cell of row) {
        if (cell.type === "block") {
          if (cell.element === "Pipe") {
            if (cell.pipeContents) {
              for (const color of cell.pipeContents) {
                colorCounts[color] = (colorCounts[color] || 0) + 1;
                totalPipeContents++;
              }
            }
          } else if (cell.color) {
            colorCounts[cell.color] = (colorCounts[cell.color] || 0) + 1;
            coloredBlocksOnBoard++;
          }
        }
      }
    }

    // Điều kiện Stats: tổng block chơi được đúng và mỗi màu chia hết cho 3
    const actualPlayableBlocks = coloredBlocksOnBoard + totalPipeContents;
    if (actualPlayableBlocks !== level.config.blockCount) return false;
    for (const count of Object.values(colorCounts)) {
      if (count % 3 !== 0) return false;
    }

    return true;
  };

  const generateLevel = useCallback(
    async (config: LevelConfig, options?: { maxAttempts?: number }) => {
      setIsGenerating(true);

      const maxAttempts = options?.maxAttempts ?? 600;
      let lastError: unknown = null;

      try {
        if (apiKey) {
          GeminiLevelGenerator.setApiKey(apiKey);
        }

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            // Giả lập độ trễ tạo level (nếu cần giữ UX)
            // await new Promise((resolve) => setTimeout(resolve, 200));

            const level = await GeminiLevelGenerator.generateLevel(config);
            if (isLevelValid(level)) {
              setGeneratedLevel(level);
              return level;
            }

            // Nếu chưa valid và chưa hết lượt thì tiếp tục thử
          } catch (err) {
            lastError = err;
          }
        }

        // Nếu không tạo được level hợp lệ sau các lần thử
        if (lastError) throw lastError;
        throw new Error(
          `Không tạo được level hợp lệ sau ${maxAttempts} lần thử`
        );
      } catch (error) {
        console.error("[v0] Level generation failed:", error);
        throw error;
      } finally {
        setIsGenerating(false);
      }
    },
    [apiKey]
  );

  const clearLevel = useCallback(() => {
    setGeneratedLevel(null);
  }, []);

  const updateApiKey = useCallback((key: string) => {
    setApiKey(key);
  }, []);

  return {
    generatedLevel,
    setGeneratedLevel,
    isGenerating,
    generateLevel,
    clearLevel,
    apiKey,
    setApiKey: updateApiKey,
  };
}
