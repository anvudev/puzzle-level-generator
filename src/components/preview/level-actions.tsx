"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Copy,
  RefreshCw,
  CheckCircle,
  RotateCcw,
} from "lucide-react";
import type { BoardCell, GeneratedLevel } from "@/config/game-types";
import {
  formatLevelForExport,
  generateCSVMatrix,
  type BarData,
} from "@/lib/utils/level-utils";
import { useColorBarStore } from "@/lib/stores/color-bar-store";
import { copyToClipboard } from "@/lib/utils/export-utils";

interface LevelActionsProps {
  level: GeneratedLevel;
  onRegenerate?: () => void;
  onReFill?: () => void;
}

export function LevelActions({
  level,
  onRegenerate,
  onReFill,
}: LevelActionsProps) {
  const [copiedBoard, setCopiedBoard] = useState(false);
  const [copiedTray, setCopiedTray] = useState(false);
  const [copiedMetaData, setCopiedMetaData] = useState(false);
  // Get custom bar order from store
  const { getBarOrder } = useColorBarStore();

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

  const getExportData = () => {
    const customBars = getCustomBars();
    const data = formatLevelForExport(level, customBars);
    return JSON.stringify(data, null, 2);
  };

  const handleCopyBoardData = async () => {
    const customBars = getCustomBars();
    const data = formatLevelForExport(level, customBars) as {
      board: BoardCell[][];
    };
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

  const handleDownloadCSV = () => {
    const customBars = getCustomBars();
    const csv = generateCSVMatrix(level, customBars);
    const filename = `WoolSoft_level_${level.id}.csv`;
    const blob = new Blob([csv], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyMetaData = async () => {
    const data = { difficulty: level.config.difficulty };
    const success = await copyToClipboard(JSON.stringify(data, null, 2));
    if (success) {
      setCopiedMetaData(true);
      setTimeout(() => setCopiedMetaData(false), 2000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Quick Actions */}
        <div className="flex gap-2">
          {onRegenerate && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerate}
              className="flex items-center gap-2 flex-1"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </Button>
          )}

          {onReFill && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReFill}
              className="flex items-center gap-2 flex-1"
            >
              <RotateCcw className="w-4 h-4" />
              ReFill
            </Button>
          )}
        </div>

        {/* Export Options */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyTrayData}
            className="flex items-center gap-2 flex-1"
          >
            {copiedTray ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            {copiedTray ? "Copied!" : "Copy Tray Data"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyBoardData}
            className="flex items-center gap-2 flex-1"
          >
            {copiedBoard ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            {copiedBoard ? "Copied!" : "Copy Board Data"}
          </Button>

          <Button variant="outline" size="sm" onClick={handleCopyMetaData}>
            {copiedMetaData ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            {copiedMetaData ? "Copied!" : "Copy Meta Data"}
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadCSV}
            className="flex items-center gap-2 flex-1"
          >
            <Download className="w-4 h-4" />
            Download CSV
          </Button>
        </div>

        {/* Preview Export */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full">
              Preview JSON
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>JSON Preview</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">JSON Format</Badge>
                <Badge variant="outline">Level ID: {level.id}</Badge>
              </div>
              <Textarea
                value={getExportData()}
                readOnly
                className="min-h-[400px] font-mono text-sm"
              />
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
