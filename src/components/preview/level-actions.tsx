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
import type { GeneratedLevel } from "@/config/game-types";
import {
  formatLevelForExport,
  generateCSVMatrix,
  type BarData,
} from "@/lib/utils/level-utils";
import { useColorBarStore } from "@/lib/stores/color-bar-store";

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
  const [copied, setCopied] = useState(false);

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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getExportData());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDownload = () => {
    const data = getExportData();
    const filename = `level-${level.id}.json`;
    const blob = new Blob([data], {
      type: "application/json",
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

  const handleDownloadCSV = () => {
    const csv = generateCSVMatrix(level);
    const filename = `level-${level.id}.csv`;
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
            onClick={handleCopy}
            className="flex items-center gap-2 flex-1"
          >
            {copied ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            {copied ? "Copied!" : "Copy JSON"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="flex items-center gap-2 flex-1"
          >
            <Download className="w-4 h-4" />
            Download JSON
          </Button>
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
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCopy}>
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy to Clipboard
                    </>
                  )}
                </Button>
                <Button onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download File
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
