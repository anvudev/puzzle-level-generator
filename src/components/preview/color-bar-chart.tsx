"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GeneratedLevel } from "@/config/game-types";
import { GAME_COLORS } from "@/config/game-constants";

interface ColorBarChartProps {
  level: GeneratedLevel;
}

interface BarData {
  barIndex: number;
  blocks: Array<{
    color: string;
    position: number;
  }>;
}

interface ColorSummary {
  color: string;
  totalCount: number;
  percentage: number;
}

/**
 * Phân tích và tạo thanh màu xen kẽ - mỗi thanh 1 màu duy nhất
 * Các thanh liên tiếp phải có màu khác nhau để tạo sự xen kẽ
 * @param level - Level data để phân tích
 * @returns Object chứa danh sách thanh và thống kê màu
 */
function analyzeColorsFromBoard(level: GeneratedLevel): {
  bars: BarData[];
  colorSummary: ColorSummary[];
  totalBlocks: number;
} {
  const allBlocks: Array<{ color: string; position: number }> = [];
  let position = 0;

  // Quét board từ trên xuống dưới, từ trái qua phải để thu thập tất cả blocks
  for (let row = 0; row < level.board.length; row++) {
    for (let col = 0; col < level.board[row].length; col++) {
      const cell = level.board[row][col];

      if (cell.type === "block" && cell.color) {
        if (cell.element === "Pipe") {
          // Đối với Pipe, thêm nội dung bên trong
          if (cell.pipeContents) {
            cell.pipeContents.forEach((pipeColor) => {
              allBlocks.push({ color: pipeColor, position });
              position++;
            });
          }
        } else {
          // Block thường
          allBlocks.push({ color: cell.color, position });
          position++;
        }
      }
    }
  }

  // Đếm tần suất xuất hiện của mỗi màu
  const colorCounts: Record<string, number> = {};
  const colorFirstAppearance: Record<string, number> = {};

  allBlocks.forEach((block, index) => {
    colorCounts[block.color] = (colorCounts[block.color] || 0) + 1;
    if (!(block.color in colorFirstAppearance)) {
      colorFirstAppearance[block.color] = index;
    }
  });

  // Tạo các nhóm màu
  const colorGroups: Record<
    string,
    Array<{ color: string; position: number }>
  > = {};
  allBlocks.forEach((block) => {
    if (!colorGroups[block.color]) {
      colorGroups[block.color] = [];
    }
    colorGroups[block.color].push(block);
  });

  // Sắp xếp màu theo thứ tự xuất hiện đầu tiên
  const colors = Object.keys(colorGroups).sort((a, b) => {
    return colorFirstAppearance[a] - colorFirstAppearance[b];
  });

  // Tạo các thanh xen kẽ - mỗi thanh 1 màu, thanh liên tiếp khác màu
  const bars: BarData[] = [];
  let barIndex = 1;
  let colorIndex = 0;

  while (colors.some((color) => colorGroups[color].length > 0)) {
    // Lấy màu tiếp theo theo vòng tròn
    const currentColor = colors[colorIndex % colors.length];
    const colorGroup = colorGroups[currentColor];

    if (colorGroup.length > 0) {
      // Lấy tối đa 3 blocks cùng màu cho thanh này
      const barBlocks = colorGroup.splice(0, 3);

      bars.push({
        barIndex: barIndex,
        blocks: barBlocks,
      });

      barIndex++;
    }

    // Chuyển sang màu tiếp theo
    colorIndex++;

    // Nếu đã duyệt hết tất cả màu, reset về màu đầu tiên
    if (colorIndex >= colors.length) {
      colorIndex = 0;
    }
  }

  // Tạo thống kê màu
  const colorSummary: ColorSummary[] = Object.entries(colorCounts)
    .map(([color, count]) => ({
      color,
      totalCount: count,
      percentage: (count / allBlocks.length) * 100,
    }))
    .sort((a, b) => {
      if (a.totalCount !== b.totalCount) {
        return b.totalCount - a.totalCount;
      }
      return colorFirstAppearance[a.color] - colorFirstAppearance[b.color];
    });

  return {
    bars,
    colorSummary,
    totalBlocks: allBlocks.length,
  };
}

export function ColorBarChart({ level }: ColorBarChartProps) {
  // Sử dụng useMemo để cache kết quả và tránh infinite loop
  const analysisResult = useMemo(() => analyzeColorsFromBoard(level), [level]);

  const { bars: initialBars, colorSummary, totalBlocks } = analysisResult;

  // State để quản lý thứ tự thanh có thể kéo thả
  const [bars, setBars] = useState<BarData[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Cập nhật bars khi initialBars thay đổi - chỉ khi thực sự khác nhau
  useEffect(() => {
    setBars(initialBars);
  }, [initialBars]);

  // Xử lý drag & drop
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newBars = [...bars];

    // Đơn giản: đổi chỗ 2 thanh với nhau (swap)
    const temp = newBars[draggedIndex];
    newBars[draggedIndex] = newBars[dropIndex];
    newBars[dropIndex] = temp;

    // Cập nhật lại barIndex cho 2 thanh đã đổi chỗ
    newBars[draggedIndex].barIndex = draggedIndex + 1;
    newBars[dropIndex].barIndex = dropIndex + 1;

    setBars(newBars);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setIsDragging(false);
  };

  const handleReset = () => {
    setBars(initialBars);
  };

  if (bars.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bảng thanh màu</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Không có dữ liệu màu sắc
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Bảng thanh màu</span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {bars.length} thanh
            </Badge>
            <Badge variant="secondary" className="text-xs">
              🔄 Kéo thả để đổi chỗ
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="text-xs h-6 px-2"
              title="Khôi phục thứ tự ban đầu"
            >
              ↺ Reset
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Hiển thị các thanh theo thứ tự */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {bars.map((bar, index) => (
              <div key={`bar-${index}`} className="relative">
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`relative flex items-center justify-center rounded border transition-all duration-300 cursor-move ${
                    draggedIndex === index
                      ? "opacity-30 scale-90 border-blue-500 shadow-xl bg-blue-100"
                      : "border-border hover:scale-105 hover:shadow-md hover:border-blue-300"
                  }`}
                  style={{
                    backgroundColor:
                      bar.blocks.length > 0
                        ? GAME_COLORS[
                            bar.blocks[0].color as keyof typeof GAME_COLORS
                          ]
                        : "#f3f4f6",
                    width: "48px",
                    height: "32px",
                    background:
                      bar.blocks.length > 1
                        ? `linear-gradient(to right, ${bar.blocks
                            .map(
                              (block) =>
                                GAME_COLORS[
                                  block.color as keyof typeof GAME_COLORS
                                ]
                            )
                            .join(", ")})`
                        : GAME_COLORS[
                            bar.blocks[0]?.color as keyof typeof GAME_COLORS
                          ] || "#f3f4f6",
                  }}
                  title={`Thanh ${bar.barIndex}: ${bar.blocks
                    .map((b) => b.color)
                    .join(", ")} - Kéo vào thanh khác để đổi chỗ`}
                >
                  <span className="text-xs font-bold text-white drop-shadow-sm">
                    {bar.blocks.length}
                  </span>
                  {/* Số thứ tự thanh */}
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-gray-800 text-white text-[10px] rounded-full flex items-center justify-center border border-white">
                    {bar.barIndex}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
