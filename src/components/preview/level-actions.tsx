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
  Save,
  FileText,
  Code,
  CheckCircle,
} from "lucide-react";
import type { GeneratedLevel } from "@/config/game-types";

interface LevelActionsProps {
  level: GeneratedLevel;
  onRegenerate?: () => void;
  onSave?: (level: GeneratedLevel) => void;
}

export function LevelActions({ level, onRegenerate, onSave }: LevelActionsProps) {
  const [exportFormat, setExportFormat] = useState<"json" | "readable">("json");
  const [copied, setCopied] = useState(false);

  const generateReadableFormat = () => {
    const colorCounts: Record<string, number> = {};
    let totalBlocks = 0;
    let pipeBlocks = 0;

    // Count colors and blocks
    level.board.forEach((row) => {
      row.forEach((cell) => {
        if (cell.type === "block") {
          totalBlocks++;
          
          if (cell.element === "Pipe") {
            pipeBlocks++;
            if (cell.pipeContents) {
              cell.pipeContents.forEach((color) => {
                colorCounts[color] = (colorCounts[color] || 0) + 1;
              });
            }
          } else if (cell.color) {
            colorCounts[cell.color] = (colorCounts[cell.color] || 0) + 1;
          }
        }
      });
    });

    const boardString = level.board
      .map((row, y) =>
        row
          .map((cell, x) => {
            if (cell.type === "empty") return "⬜";
            if (cell.element === "Pipe") {
              const directionSymbol = {
                up: "⬆️",
                down: "⬇️",
                left: "⬅️",
                right: "➡️",
              }[cell.pipeDirection || "up"];
              return directionSymbol;
            }
            return cell.color ? cell.color.charAt(0) : "?";
          })
          .join("")
      )
      .join("\n");

    return `# Level ${level.id}

## Configuration
- Size: ${level.config.width}x${level.config.height}
- Total Blocks: ${totalBlocks}
- Colors: ${level.config.selectedColors.join(", ")}
- Mode: ${level.config.generationMode}
- Difficulty: ${level.config.difficulty}

## Color Distribution
${Object.entries(colorCounts)
  .map(([color, count]) => `- ${color}: ${count} blocks ${count % 3 === 0 ? "✅" : "❌"}`)
  .join("\n")}

## Board Layout
\`\`\`
${boardString}
\`\`\`

## Elements
${Object.entries(level.config.elements)
  .filter(([_, count]) => count > 0)
  .map(([element, count]) => `- ${element}: ${count}`)
  .join("\n") || "- No special elements"}

${level.pipeInfo && level.pipeInfo.length > 0 ? `
## Pipe Details
${level.pipeInfo
  .map(
    (pipe, index) =>
      `### Pipe ${index + 1} (${pipe.position.x}, ${pipe.position.y})
- Direction: ${pipe.direction.toUpperCase()}
- Contents: ${pipe.contents.join(" → ")}`
  )
  .join("\n")}
` : ""}

## Validation
- Solvable: ${level.solvable ? "✅" : "❌"}
- Difficulty Score: ${level.difficultyScore}
- Generated: ${level.timestamp.toLocaleString()}
`;
  };

  const getExportData = () => {
    if (exportFormat === "json") {
      return JSON.stringify(level, null, 2);
    } else {
      return generateReadableFormat();
    }
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
    const filename = `level-${level.id}.${exportFormat === "json" ? "json" : "md"}`;
    const blob = new Blob([data], { 
      type: exportFormat === "json" ? "application/json" : "text/markdown" 
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
        <div className="grid grid-cols-2 gap-2">
          {onRegenerate && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerate}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </Button>
          )}
          
          {onSave && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSave(level)}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </Button>
          )}
        </div>

        {/* Export Options */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Export format:</span>
            <div className="flex gap-1">
              <Button
                variant={exportFormat === "json" ? "default" : "outline"}
                size="sm"
                onClick={() => setExportFormat("json")}
                className="flex items-center gap-1"
              >
                <Code className="w-3 h-3" />
                JSON
              </Button>
              <Button
                variant={exportFormat === "readable" ? "default" : "outline"}
                size="sm"
                onClick={() => setExportFormat("readable")}
                className="flex items-center gap-1"
              >
                <FileText className="w-3 h-3" />
                Readable
              </Button>
            </div>
          </div>

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
              {copied ? "Copied!" : "Copy"}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex items-center gap-2 flex-1"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>
        </div>

        {/* Preview Export */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full">
              Preview Export
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Export Preview - {exportFormat.toUpperCase()}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {exportFormat === "json" ? "JSON Format" : "Markdown Format"}
                </Badge>
                <Badge variant="outline">
                  Level ID: {level.id}
                </Badge>
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
