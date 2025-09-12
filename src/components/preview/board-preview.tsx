"use client";

import type React from "react";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GAME_COLORS } from "@/config/game-constants";
import type { GeneratedLevel, BoardCell } from "@/config/game-types";
import { getElementIcon } from "@/lib/utils/level-utils";
import { RotateCcw, Move, RotateCw } from "lucide-react";

interface BoardPreviewProps {
  level: GeneratedLevel;
  onLevelUpdate?: (updatedLevel: GeneratedLevel) => void;
}

export function BoardPreview({ level, onLevelUpdate }: BoardPreviewProps) {
  const [isDragMode, setIsDragMode] = useState(false);
  const [draggedCell, setDraggedCell] = useState<{
    cell: BoardCell;
    index: number;
  } | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isPipeEditMode, setIsPipeEditMode] = useState(false);

  // Pipe direction rotation logic
  const rotatePipeDirection = (
    currentDirection: string
  ): "up" | "right" | "down" | "left" => {
    const directions: Array<"up" | "right" | "down" | "left"> = [
      "up",
      "right",
      "down",
      "left",
    ];
    const currentIndex = directions.indexOf(
      currentDirection as "up" | "right" | "down" | "left"
    );
    const nextIndex = (currentIndex + 1) % directions.length;
    return directions[nextIndex];
  };

  const handlePipeClick = (x: number, y: number, cell: BoardCell) => {
    if (!onLevelUpdate || cell.element !== "Pipe") return;

    const currentDirection = cell.pipeDirection || "up";
    const newDirection = rotatePipeDirection(currentDirection);

    // Create updated level with new pipe direction
    const updatedBoard = level.board.map((row, rowIndex) =>
      row.map((c, colIndex) => {
        if (rowIndex === y && colIndex === x) {
          return {
            ...c,
            pipeDirection: newDirection,
          } as BoardCell;
        }
        return c;
      })
    );

    // Update pipe info if it exists
    const updatedPipeInfo = level.pipeInfo?.map((pipe) => {
      if (pipe.position.x === x && pipe.position.y === y) {
        return {
          ...pipe,
          direction: newDirection,
        };
      }
      return pipe;
    });

    const updatedLevel = {
      ...level,
      board: updatedBoard,
      pipeInfo: updatedPipeInfo,
    };

    onLevelUpdate(updatedLevel);
  };

  const handleDragStart = (
    e: React.DragEvent,
    cell: BoardCell,
    index: number
  ) => {
    if (!isDragMode || cell.type === "empty") return;
    setDraggedCell({ cell, index });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (!isDragMode || !draggedCell) return;
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!isDragMode || !draggedCell || !onLevelUpdate) return;

    const newBoard = [...level.board.flat()];
    const sourceIndex = draggedCell.index;

    // Swap the cells
    const temp = newBoard[sourceIndex];
    newBoard[sourceIndex] = newBoard[targetIndex];
    newBoard[targetIndex] = temp;

    // Convert back to 2D array
    const updatedBoard = [];
    for (let i = 0; i < level.config.height; i++) {
      updatedBoard.push(
        newBoard.slice(i * level.config.width, (i + 1) * level.config.width)
      );
    }

    const updatedLevel = {
      ...level,
      board: updatedBoard,
    };

    onLevelUpdate(updatedLevel);
    setDraggedCell(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedCell(null);
    setDragOverIndex(null);
  };

  const resetBoard = () => {
    if (onLevelUpdate) {
      // This would trigger a regeneration - for now just toggle drag mode off
      setIsDragMode(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Bảng game</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={isDragMode ? "default" : "outline"}
              size="sm"
              onClick={() => setIsDragMode(!isDragMode)}
              className="flex items-center gap-2"
            >
              <Move className="w-4 h-4" />
              {isDragMode ? "Hoàn thành" : "Sắp xếp lại"}
            </Button>
            <Button
              variant={isPipeEditMode ? "default" : "outline"}
              size="sm"
              onClick={() => setIsPipeEditMode(!isPipeEditMode)}
              className="flex items-center gap-2"
            >
              <RotateCw className="w-4 h-4" />
              {isPipeEditMode ? "Hoàn thành" : "Chỉnh pipe"}
            </Button>
            {isDragMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetBoard}
                className="flex items-center gap-2 bg-transparent"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
            )}
          </div>
        </div>
        {isDragMode && (
          <p className="text-sm text-muted-foreground">
            Kéo thả các block để sắp xếp lại vị trí. Chỉ có thể di chuyển các
            block có màu.
          </p>
        )}
        {isPipeEditMode && (
          <p className="text-sm text-muted-foreground">
            Click vào pipe để thay đổi hướng (↑→↓←). Pipe sẽ nhấp nháy màu xanh
            khi có thể chỉnh sửa.
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="bg-muted p-4 rounded-lg">
          <div
            className="grid gap-1 mx-auto"
            style={{
              gridTemplateColumns: `repeat(${level.config.width}, 1fr)`,
              maxWidth: "400px",
            }}
          >
            {level.board.flat().map((cell, index) => {
              const isDragging = draggedCell?.index === index;
              const isDragOver = dragOverIndex === index;
              const canDrag = isDragMode && cell.type !== "empty";
              const canEditPipe = isPipeEditMode && cell.element === "Pipe";

              return (
                <div
                  key={index}
                  className={`aspect-square rounded border border-border flex items-center justify-center text-xs font-bold relative transition-all duration-200 ${
                    canDrag ? "cursor-move hover:scale-105 hover:shadow-lg" : ""
                  } ${
                    canEditPipe
                      ? "cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-offset-1"
                      : ""
                  } ${isDragging ? "opacity-50 scale-95" : ""} ${
                    isDragOver && draggedCell
                      ? "ring-2 ring-primary ring-offset-2"
                      : ""
                  }`}
                  style={{
                    backgroundColor:
                      cell.element === "Pipe"
                        ? "#6b7280" // Gray color for pipe blocks (dead blocks)
                        : cell.color
                        ? GAME_COLORS[cell.color as keyof typeof GAME_COLORS]
                        : "#f3f4f6",
                    color:
                      cell.element === "Pipe"
                        ? "#fff" // White text for pipe blocks
                        : cell.color && ["Yellow", "White"].includes(cell.color)
                        ? "#000"
                        : "#fff",
                  }}
                  draggable={canDrag}
                  onDragStart={(e) => handleDragStart(e, cell, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  onClick={() => {
                    if (canEditPipe) {
                      const x = index % level.config.width;
                      const y = Math.floor(index / level.config.width);
                      handlePipeClick(x, y, cell);
                    }
                  }}
                >
                  {cell.element && (
                    <div className="absolute top-0 right-0 flex items-center gap-1 bg-black/20 backdrop-blur-sm rounded-bl-md px-1 py-0.5">
                      {cell.element === "Pipe" && cell.pipeDirection ? (
                        // For Pipe, only show arrow, no element icon
                        <span
                          className={`text-lg font-bold drop-shadow-lg ${
                            canEditPipe
                              ? "text-blue-400 animate-pulse"
                              : "text-orange-400"
                          }`}
                        >
                          {cell.pipeDirection === "up" && "↑"}
                          {cell.pipeDirection === "down" && "↓"}
                          {cell.pipeDirection === "left" && "←"}
                          {cell.pipeDirection === "right" && "→"}
                        </span>
                      ) : cell.element === "Key" ? (
                        // For Key element, show key icon
                        <span className="text-yellow-400 drop-shadow-md text-base">
                          🗝️
                        </span>
                      ) : (
                        // For other elements, show icon
                        <span className="text-white drop-shadow-md">
                          {getElementIcon(cell.element)}
                        </span>
                      )}
                    </div>
                  )}
                  {cell.type === "empty"
                    ? ""
                    : cell.element === "Pipe"
                    ? "PIPE"
                    : cell.color?.charAt(0) || ""}
                  {canDrag && (
                    <div className="absolute inset-0 bg-black/10 rounded opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <Move className="w-3 h-3 text-white drop-shadow-lg" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
