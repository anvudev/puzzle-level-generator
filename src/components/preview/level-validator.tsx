"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle } from "lucide-react";
import type { GeneratedLevel } from "@/config/game-types";

interface LevelValidatorProps {
  level: GeneratedLevel;
}

export function LevelValidator({ level }: LevelValidatorProps) {
  const validateLevel = () => {
    const issues: Array<{
      type: "error" | "warning" | "info";
      message: string;
    }> = [];

    // Count colors on board
    const colorCounts: Record<string, number> = {};
    let totalBlocks = 0;
    let pipeBlocks = 0;
    let movingBlocks = 0;
    let pullPinBlocks = 0;
    let coloredBlocksOnBoard = 0;

    level.board.forEach((row) => {
      row.forEach((cell) => {
        if (cell.type === "block") {
          totalBlocks++;

          if (cell.element === "Pipe") {
            pipeBlocks++;
            // Count pipe contents
            if (cell.pipeContents) {
              cell.pipeContents.forEach((color) => {
                colorCounts[color] = (colorCounts[color] || 0) + 1;
              });
            }
          } else if (cell.element === "Moving") {
            movingBlocks++;
            // Count moving contents
            if (cell.movingContents) {
              cell.movingContents.forEach((color) => {
                colorCounts[color] = (colorCounts[color] || 0) + 1;
              });
            }
          } else if (cell.element === "PullPin") {
            pullPinBlocks++;
            // Pull Pin blocks don't contribute to color counts
          } else if (cell.color) {
            colorCounts[cell.color] = (colorCounts[cell.color] || 0) + 1;
            coloredBlocksOnBoard++;
          }
        }
      });
    });

    // Check color balance (each color should be divisible by 3)
    const unbalancedColors: string[] = [];
    Object.entries(colorCounts).forEach(([color, count]) => {
      if (count % 3 !== 0) {
        unbalancedColors.push(`${color}: ${count} blocks`);
      }
    });

    if (unbalancedColors.length > 0) {
      issues.push({
        type: "error",
        message: `Colors not balanced (not divisible by 3): ${unbalancedColors.join(
          ", "
        )}`,
      });
    }

    // Check if all selected colors are used
    const usedColors = Object.keys(colorCounts);
    const missingColors = level.config.selectedColors.filter(
      (color) => !usedColors.includes(color)
    );

    if (missingColors.length > 0) {
      issues.push({
        type: "warning",
        message: `Colors not used: ${missingColors.join(", ")}`,
      });
    }

    // Check block count (only colored blocks on board + pipe contents + moving contents)
    const expectedBlocks = level.config.blockCount;
    let totalPipeContents = 0;
    let totalMovingContents = 0;
    level.board.forEach((row) => {
      row.forEach((cell) => {
        if (cell.element === "Pipe" && cell.pipeContents) {
          totalPipeContents += cell.pipeContents.length;
        }
        if (cell.element === "Moving" && cell.movingContents) {
          totalMovingContents += cell.movingContents.length;
        }
      });
    });
    const actualPlayableBlocks =
      coloredBlocksOnBoard + totalPipeContents + totalMovingContents;

    if (actualPlayableBlocks !== expectedBlocks) {
      issues.push({
        type: "error",
        message: `Block count mismatch: expected ${expectedBlocks}, got ${actualPlayableBlocks} (board colored: ${coloredBlocksOnBoard}, pipe: ${totalPipeContents}, moving: ${totalMovingContents})`,
      });
    }

    // Check pipe validation
    if (pipeBlocks > 0) {
      let totalPipeContents = 0;
      level.board.forEach((row) => {
        row.forEach((cell) => {
          if (cell.element === "Pipe" && cell.pipeContents) {
            totalPipeContents += cell.pipeContents.length;
          }
        });
      });

      issues.push({
        type: "info",
        message: `Pipes: ${pipeBlocks} pipes with ${totalPipeContents} total contents`,
      });
    }

    // Check Pull Pin validation
    if (pullPinBlocks > 0) {
      let validPullPins = 0;
      level.board.forEach((row) => {
        row.forEach((cell) => {
          if (cell.element === "PullPin") {
            if (cell.pullPinDirection && cell.pullPinGateSize) {
              validPullPins++;
            }
          }
        });
      });

      issues.push({
        type: "info",
        message: `Pull Pins: ${pullPinBlocks} pins (${validPullPins} with valid direction/gate)`,
      });

      if (validPullPins < pullPinBlocks) {
        issues.push({
          type: "warning",
          message: `Some Pull Pins missing direction or gate configuration`,
        });
      }
    }

    // Check board connectivity (basic check)
    const connectedBlocks = checkConnectivity();
    if (connectedBlocks < totalBlocks) {
      issues.push({
        type: "warning",
        message: `Board connectivity issue: ${connectedBlocks}/${totalBlocks} blocks connected`,
      });
    }

    return {
      issues,
      colorCounts,
      totalBlocks,
      pipeBlocks,
      movingBlocks,
      pullPinBlocks,
      isValid: issues.filter((i) => i.type === "error").length === 0,
    };
  };

  const checkConnectivity = () => {
    const visited = new Set<string>();
    const queue: Array<[number, number]> = [];

    // Find first block
    let startFound = false;
    for (let y = 0; y < level.board.length && !startFound; y++) {
      for (let x = 0; x < level.board[y].length && !startFound; x++) {
        if (level.board[y][x].type === "block") {
          queue.push([y, x]);
          startFound = true;
        }
      }
    }

    if (!startFound) return 0;

    // BFS to count connected blocks
    while (queue.length > 0) {
      const [y, x] = queue.shift()!;
      const key = `${y},${x}`;

      if (visited.has(key)) continue;
      visited.add(key);

      // Check 4 directions
      const directions = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ];
      for (const [dy, dx] of directions) {
        const ny = y + dy;
        const nx = x + dx;

        if (
          ny >= 0 &&
          ny < level.board.length &&
          nx >= 0 &&
          nx < level.board[ny].length &&
          level.board[ny][nx].type === "block" &&
          !visited.has(`${ny},${nx}`)
        ) {
          queue.push([ny, nx]);
        }
      }
    }

    return visited.size;
  };

  const validation = validateLevel();

  // const getIcon = (type: string) => {
  //   switch (type) {
  //     case "error":
  //       return <XCircle className="w-4 h-4 text-red-500" />;
  //     case "warning":
  //       return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
  //     case "info":
  //       return <Info className="w-4 h-4 text-blue-500" />;
  //     default:
  //       return <CheckCircle className="w-4 h-4 text-green-500" />;
  //   }
  // };

  return (
    <Card>
      <CardContent className="space-y-4">
        {/* Color Statistics */}
        <div>
          <h4 className="font-medium mb-2">Color Distribution</h4>
          <div className="grid grid-cols-8 gap-2">
            {Object.entries(validation.colorCounts).map(([color, count]) => (
              <div
                key={color}
                className="flex items-center justify-between text-sm"
              >
                <span>{color.replace("color_", "")}:</span>
                <Badge variant={count % 3 === 0 ? "default" : "destructive"}>
                  {count} {count % 3 === 0 ? "✓" : "✗"}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Block Statistics */}
        {/* <div>
          <h4 className="font-medium mb-2">Block Statistics</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Total blocks:</span>
              <span>{validation.totalBlocks}</span>
            </div>
            <div className="flex justify-between">
              <span>Pipe blocks:</span>
              <span>{validation.pipeBlocks}</span>
            </div>
            <div className="flex justify-between">
              <span>Regular blocks:</span>
              <span>{validation.totalBlocks - validation.pipeBlocks}</span>
            </div>
          </div>
        </div> */}

        {/* Issues */}
        {/* {validation.issues.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Issues</h4>
            <div className="space-y-2">
              {validation.issues.map((issue, index) => (
                <Alert key={index} className="py-2">
                  <div className="flex items-start gap-2">
                    {getIcon(issue.type)}
                    <AlertDescription className="text-sm">
                      {issue.message}
                    </AlertDescription>
                  </div>
                </Alert>
              ))}
            </div>
          </div>
        )} */}

        {validation.isValid && validation.issues.length === 0 && (
          <Alert>
            <CheckCircle className="w-4 h-4 text-green-500" />
            <AlertDescription>
              Level is valid and ready to use! 🎉
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
