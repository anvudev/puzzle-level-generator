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

  const adjustLevelToMeetStats = (
    level: GeneratedLevel
  ): GeneratedLevel | null => {
    const board = level.board.map((row) => row.map((cell) => ({ ...cell })));

    // Tính thống kê hiện tại
    const colors = level.config.selectedColors;
    const colorCounts: Record<string, number> = Object.fromEntries(
      colors.map((c) => [c, 0])
    );
    let coloredBlocksOnBoard = 0;
    let totalPipeContents = 0;

    for (let y = 0; y < level.config.height; y++) {
      for (let x = 0; x < level.config.width; x++) {
        const cell = board[y][x];
        if (cell.type === "block") {
          if (cell.element === "Pipe") {
            if (cell.pipeContents) {
              for (const color of cell.pipeContents) {
                if (color in colorCounts) {
                  colorCounts[color] = (colorCounts[color] || 0) + 1;
                }
                totalPipeContents++;
              }
            }
          } else if (cell.color) {
            if (cell.color in colorCounts) {
              colorCounts[cell.color] = (colorCounts[cell.color] || 0) + 1;
            }
            coloredBlocksOnBoard++;
          }
        }
      }
    }

    const targetTotal = level.config.blockCount;
    let currentPlayable = coloredBlocksOnBoard + totalPipeContents;
    if (currentPlayable > targetTotal) {
      // Vượt quá mục tiêu thì không thể thêm để sửa
      return null;
    }

    // Tính số lượng cần bổ sung cho mỗi màu để đạt bội số 3
    const deficitPerColor: Array<{ color: string; needed: number }> = [];
    for (const color of colors) {
      const count = colorCounts[color] || 0;
      const remainder = count % 3;
      const needed = remainder === 0 ? 0 : 3 - remainder;
      if (needed > 0) deficitPerColor.push({ color, needed });
    }

    // Nếu chưa đủ tổng blockCount, tiếp tục phân bổ thêm theo vòng tròn các màu đã chọn
    const remainingCapacity = () => targetTotal - currentPlayable;

    // Tạo danh sách vị trí trống: ưu tiên hàng trên cùng và dưới cùng, gần giữa nhất
    const centerX = Math.floor(level.config.width / 2);
    const topCandidates: Array<{ x: number; y: number; score: number }> = [];
    const bottomCandidates: Array<{ x: number; y: number; score: number }> = [];
    const otherCandidates: Array<{ x: number; y: number; score: number }> = [];

    for (let y = 0; y < level.config.height; y++) {
      for (let x = 0; x < level.config.width; x++) {
        const cell = board[y][x];
        if (cell.type === "empty") {
          const score = Math.abs(x - centerX); // càng gần giữa càng tốt
          if (y === 0) topCandidates.push({ x, y, score });
          else if (y === level.config.height - 1)
            bottomCandidates.push({ x, y, score });
          else otherCandidates.push({ x, y, score });
        }
      }
    }

    const byBest = (a: { score: number }, b: { score: number }) =>
      a.score - b.score;
    topCandidates.sort(byBest);
    bottomCandidates.sort(byBest);
    otherCandidates.sort((a, b) => {
      // Ưu tiên gần giữa cả theo x và y
      const centerY = Math.floor(level.config.height / 2);
      const da = Math.abs(a.y - centerY) + a.score;
      const db = Math.abs(b.y - centerY) + b.score;
      return da - db;
    });

    const hasBlockNeighbor = (x: number, y: number): boolean => {
      const dirs = [
        [0, -1],
        [0, 1],
        [-1, 0],
        [1, 0],
      ];
      for (const [dx, dy] of dirs) {
        const nx = x + dx;
        const ny = y + dy;
        if (
          ny >= 0 &&
          ny < level.config.height &&
          nx >= 0 &&
          nx < level.config.width &&
          board[ny][nx].type === "block"
        ) {
          return true;
        }
      }
      return false;
    };

    const takeNextEmpty = (): { x: number; y: number } | null => {
      // Chỉ chọn ô trống có kề cạnh block bất kỳ, ưu tiên top -> bottom -> other
      const pick = (
        arr: Array<{ x: number; y: number }>
      ): { x: number; y: number } | null => {
        for (let i = 0; i < arr.length; i++) {
          const pos = arr[i];
          if (
            board[pos.y][pos.x].type === "empty" &&
            hasBlockNeighbor(pos.x, pos.y)
          ) {
            arr.splice(i, 1);
            return pos;
          }
        }
        return null;
      };

      return (
        pick(topCandidates) || pick(bottomCandidates) || pick(otherCandidates)
      );
    };

    // Bổ sung theo thiếu hụt để đạt bội số 3 trước
    for (
      let i = 0;
      i < deficitPerColor.length && remainingCapacity() > 0;
      i++
    ) {
      const entry = deficitPerColor[i];
      while (entry.needed > 0 && remainingCapacity() > 0) {
        const pos = takeNextEmpty();
        if (!pos) break;
        board[pos.y][pos.x] = {
          type: "block",
          color: entry.color,
          element: null,
        } as any;
        entry.needed -= 1;
        currentPlayable += 1;
      }
    }

    // Nếu vẫn còn thiếu tổng, phân đều theo danh sách màu đã chọn (vòng tròn)
    let colorIndex = 0;
    while (remainingCapacity() > 0) {
      const pos = takeNextEmpty();
      if (!pos) break;
      const color = colors[colorIndex % colors.length];
      board[pos.y][pos.x] = {
        type: "block",
        color,
        element: null,
      } as any;
      colorIndex++;
      currentPlayable += 1;
    }

    const adjusted: GeneratedLevel = {
      ...level,
      board,
    };

    return isLevelValid(adjusted) ? adjusted : null;
  };

  const generateLevel = useCallback(
    async (config: LevelConfig, options?: { maxAttempts?: number }) => {
      setIsGenerating(true);

      const maxAttempts = options?.maxAttempts ?? 600;
      let lastError: unknown = null;
      let lastLevel: GeneratedLevel | null = null;

      try {
        if (apiKey) {
          GeminiLevelGenerator.setApiKey(apiKey);
        }

        // Nhường CPU để React kịp render spinner trước khi vào vòng lặp nặng
        await new Promise((resolve) => setTimeout(resolve, 0));

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            // Giả lập độ trễ tạo level (nếu cần giữ UX)
            // await new Promise((resolve) => setTimeout(resolve, 200));

            const level = await GeminiLevelGenerator.generateLevel(config);
            lastLevel = level;
            if (isLevelValid(level)) {
              setGeneratedLevel(level);
              return level;
            }

            // Nếu chưa valid và chưa hết lượt thì tiếp tục thử
          } catch (err) {
            lastError = err;
          }

          // Định kỳ yield về event loop để UI không bị đơ và spinner hiển thị
          if (attempt % 20 === 0) {
            await new Promise((resolve) => setTimeout(resolve, 0));
          }
        }

        // Nếu không có level hợp lệ sau các lần thử, thử hiệu chỉnh level cuối cùng
        if (lastLevel) {
          const adjusted = adjustLevelToMeetStats(lastLevel);
          if (adjusted) {
            setGeneratedLevel(adjusted);
            return adjusted;
          }
          setGeneratedLevel(lastLevel);
          return lastLevel;
        }

        // Không tạo được level nào -> ném lỗi cuối cùng (nếu có) hoặc tạo lỗi chung
        if (lastError) throw lastError;
        throw new Error(`Không tạo được level sau ${maxAttempts} lần thử`);
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
