"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileJson, FileSpreadsheet, Copy } from "lucide-react";
import { useState } from "react";
import type { BoardCell, GeneratedLevel } from "@/config/game-types";
import {
  downloadJSON,
  downloadCSV,
  copyToClipboard,
} from "@/lib/utils/export-utils";
import {
  formatLevelForExport,
  generateCSVMatrix,
  type BarData,
} from "@/lib/utils/level-utils";
import { useColorBarStore } from "@/lib/stores/color-bar-store";

interface ExportPanelProps {
  level: GeneratedLevel | null;
}

export function ExportPanel({ level }: ExportPanelProps) {
  const [copiedBoard, setCopiedBoard] = useState(false);
  const [copiedTray, setCopiedTray] = useState(false);
  // Get custom bar order from store
  const { getBarOrder } = useColorBarStore();

  if (!level) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileJson className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Chưa có level để xuất
          </h3>
          <p className="text-muted-foreground text-center">
            Hãy tạo một level trước khi xuất file
          </p>
        </CardContent>
      </Card>
    );
  }

  // Helper function to get custom bars from store
  const getCustomBars = () => {
    // First get default bars
    const defaultData = formatLevelForExport(level) as {
      colorBarChart: { bars: BarData[] };
    };
    const defaultBars = defaultData.colorBarChart.bars;

    // Then get custom order from store
    return getBarOrder(defaultBars, level.id);
  };

  const exportJSON = () => {
    const customBars = getCustomBars();
    const data = formatLevelForExport(level, customBars);
    downloadJSON(data, `${level.id}.json`);
  };

  const exportCSV = () => {
    const customBars = getCustomBars();
    const csv = generateCSVMatrix(level, customBars);
    downloadCSV(csv, `${level.id}.csv`);
  };

  const handleCopyBoardData = async () => {
    const customBars = getCustomBars();
    const data = formatLevelForExport(level, customBars) as {
      board: BoardCell[][];
    };
    console.log("Original data:", data);

    // Function to transpose and format like rangeToString
    const rangeToString = (inputRange: BoardCell[][]) => {
      if (!inputRange || inputRange.length === 0) return "";

      // Transpose mảng để duyệt theo cột
      const cols = inputRange[0].map((_, colIndex) =>
        inputRange.map((row) => row[colIndex])
      );

      // Convert each column: cells in column joined by "|", columns joined by ";"
      const final = cols
        .map((col) => col.map((cell) => JSON.stringify(cell)).join("|"))
        .join(";");

      return "[" + final + "]";
    };

    const boardString = rangeToString(data.board);
    console.log("Processed board data:", boardString);

    const success = await copyToClipboard(boardString);

    if (success) {
      setCopiedBoard(true);
      setTimeout(() => setCopiedBoard(false), 2000);
    }
  };

  const handleCopyTrayData = async () => {
    const customBars = getCustomBars();
    const data = customBars.map((bar) => bar.color);
    const success = await copyToClipboard(data.join(","));
    if (success) {
      setCopiedTray(true);
      setTimeout(() => setCopiedTray(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Xuất file Level</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button onClick={exportJSON} className="flex items-center gap-2">
              <FileJson className="w-4 h-4" />
              Xuất JSON
            </Button>
            <Button
              onClick={exportCSV}
              variant="outline"
              className="flex items-center gap-2 bg-transparent"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Xuất CSV
            </Button>
            <Button
              onClick={handleCopyBoardData}
              variant="outline"
              className="flex items-center gap-2 bg-transparent"
            >
              <Copy className="w-4 h-4" />
              {copiedBoard ? "Đã copy!" : "Copy Board Data"}
            </Button>
            <Button
              onClick={handleCopyTrayData}
              variant="outline"
              className="flex items-center gap-2 bg-transparent"
            >
              <Copy className="w-4 h-4" />
              {copiedTray ? "Đã copy!" : "Copy Tray Data"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Level Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Tóm tắt Level</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">ID Level</p>
                <p className="font-mono text-sm">{level.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Kích thước</p>
                <p className="font-semibold">
                  {level.config.width} × {level.config.height}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Số block</p>
                <p className="font-semibold">{level.config.blockCount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Điểm khó</p>
                <p className="font-semibold">{level.difficultyScore}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Màu sử dụng</p>
              <div className="flex flex-wrap gap-1">
                {level.config.selectedColors.map((color) => (
                  <Badge key={color} variant="outline">
                    {color}
                  </Badge>
                ))}
              </div>
            </div>

            {Object.keys(level.config.elements).length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Element đặc biệt
                </p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(level.config.elements).map(
                    ([element, count]) => (
                      <Badge key={element} variant="secondary">
                        {element}: {count}
                      </Badge>
                    )
                  )}
                </div>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground">Thời gian tạo</p>
              <p className="text-sm">
                {level.timestamp.toLocaleString("vi-VN")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* JSON Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Preview JSON</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-96">
            {JSON.stringify(
              {
                id: level.id,
                config: level.config,
                board: level.board.slice(0, 3), // Show only first 3 rows for preview
                containers: level.containers,
                difficultyScore: level.difficultyScore,
                solvable: level.solvable,
                colorBarChart: (
                  formatLevelForExport(level, getCustomBars()) as {
                    colorBarChart: unknown;
                  }
                ).colorBarChart,
              },
              null,
              2
            )}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
