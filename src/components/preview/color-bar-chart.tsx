"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import type { GeneratedLevel } from "@/config/game-types";
// Removed GAME_COLORS import - now using colorMapping from level config
import { useColorBarStore } from "@/lib/stores/color-bar-store";

interface ColorBarChartProps {
  level: GeneratedLevel;
}

interface BarData {
  barIndex: number;
  color: string;
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
      if (cell.element === "Pipe") {
        // Đối với Pipe, thêm nội dung bên trong
        if (cell.pipeContents) {
          cell.pipeContents.forEach((pipeColor) => {
            allBlocks.push({ color: pipeColor, position });
            position++;
          });
        }
      } else if (cell.type === "block") {
        // Block thường
        allBlocks.push({ color: cell.color || "", position });
        position++;
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
      colorGroup.splice(0, 3);

      bars.push({
        barIndex: barIndex,
        color: currentColor,
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
  // State để force re-render
  const [forceRenderKey, setForceRenderKey] = useState(0);
  const [isReRendering, setIsReRendering] = useState(false);

  // Sử dụng useMemo để cache kết quả và tránh infinite loop
  // Thêm forceRenderKey vào dependency để có thể force refresh
  const analysisResult = useMemo(
    () => analyzeColorsFromBoard(level),
    [level, forceRenderKey]
  );
  const { bars: initialBars } = analysisResult;

  // Color bar store để lưu thứ tự đã sắp xếp
  const { setCustomBarOrder, getBarOrder, clearCustomBarOrder } =
    useColorBarStore();

  // State để quản lý thứ tự thanh có thể kéo thả
  const [bars, setBars] = useState<BarData[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Cập nhật bars khi initialBars thay đổi - sử dụng custom order nếu có
  useEffect(() => {
    const orderedBars = getBarOrder(initialBars, level.id);
    setBars(orderedBars);
  }, [initialBars, level.id, getBarOrder, forceRenderKey]);

  // Xử lý drag & drop
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
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
    // Lưu thứ tự mới vào store để export có thể sử dụng
    setCustomBarOrder(newBars, level.id);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleReset = () => {
    setBars(initialBars);
    // Xóa custom order khỏi store để về thứ tự gốc
    setCustomBarOrder(initialBars, level.id);
  };

  const handleReRender = () => {
    setIsReRendering(true);

    // Clear cache và force re-render
    clearCustomBarOrder();

    // Force re-analyze từ đầu
    const freshAnalysis = analyzeColorsFromBoard(level);

    // Set bars trực tiếp với kết quả mới
    setBars([...freshAnalysis.bars]);

    // Cập nhật forceRenderKey để trigger useMemo
    setForceRenderKey((prev) => prev + 1);

    // Reset sau một chút để user thấy feedback
    setTimeout(() => {
      setIsReRendering(false);
    }, 500);
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
              onClick={handleReRender}
              className="text-xs h-6 px-2"
              title="Re-render lại bar chart để fix lỗi hiển thị"
              disabled={isReRendering}
            >
              <RefreshCw
                className={`w-3 h-3 mr-1 ${
                  isReRendering ? "animate-spin" : ""
                }`}
              />
              {isReRendering ? "Đang render..." : "Re-render"}
            </Button>
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
                      level.config.colorMapping[bar.color] || "#f3f4f6",
                    width: "48px",
                    height: "32px",
                  }}
                  title={`Thanh ${bar.barIndex}: ${bar.color} - Kéo vào thanh khác để đổi chỗ`}
                >
                  <span className="text-xs font-bold text-white drop-shadow-sm">
                    {bar.color}
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
