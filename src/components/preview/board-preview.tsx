"use client";

import type React from "react";
// removed unused import 'ring'
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GAME_COLORS } from "@/config/game-constants";
import type { GeneratedLevel, BoardCell } from "@/config/game-types";
import { getElementIcon } from "@/lib/utils/level-utils";
import { RotateCcw, Move } from "lucide-react";
import { LevelEditor } from "./level-editor";
import { LevelHelp } from "./level-help";

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
  const [editingCount, setEditingCount] = useState<{
    row: number;
    col: number;
    type: "ice" | "bomb";
  } | null>(null);

  const handleCountClick = (row: number, col: number, type: "ice" | "bomb") => {
    const newCount = prompt(
      `Enter new ${type} count (1-20):`,
      type === "ice"
        ? level.board[row][col].iceCount?.toString()
        : level.board[row][col].bombCount?.toString()
    );

    if (newCount && !isNaN(Number(newCount))) {
      const count = Math.max(1, Math.min(20, Number(newCount)));
      const newBoard = level.board.map((boardRow, r) =>
        boardRow.map((cell, c) => {
          if (r === row && c === col) {
            return {
              ...cell,
              [type === "ice" ? "iceCount" : "bombCount"]: count,
            };
          }
          return cell;
        })
      );

      if (onLevelUpdate) {
        onLevelUpdate({
          ...level,
          board: newBoard,
        });
      }
    }
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

  const handlePullPinClick = (index: number) => {
    if (!onLevelUpdate) return;

    const row = Math.floor(index / level.config.width);
    const col = index % level.config.width;
    const cell = level.board[row][col];

    if (cell.element === "PullPin") {
      // Cycle through directions: up -> right -> down -> left -> up
      const directions: Array<"up" | "down" | "left" | "right"> = [
        "up",
        "right",
        "down",
        "left",
      ];
      const currentIndex = directions.indexOf(cell.pullPinDirection || "up");
      const nextDirection = directions[(currentIndex + 1) % directions.length];

      // Update the board with new direction
      const newBoard = level.board.map((boardRow, rowIndex) =>
        boardRow.map((boardCell, colIndex) => {
          if (rowIndex === row && colIndex === col) {
            return {
              ...boardCell,
              pullPinDirection: nextDirection,
            };
          }
          return boardCell;
        })
      );

      // Update the level
      const updatedLevel = {
        ...level,
        board: newBoard,
      };

      onLevelUpdate(updatedLevel);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Bảng game</CardTitle>
          <div className="flex items-center gap-2">
            <LevelEditor
              level={level}
              onLevelUpdate={onLevelUpdate || (() => {})}
            />
            <LevelHelp />
            <Button
              variant={isDragMode ? "default" : "outline"}
              size="sm"
              onClick={() => setIsDragMode(!isDragMode)}
              className="flex items-center gap-2"
            >
              <Move className="w-4 h-4" />
              {isDragMode ? "Hoàn thành" : "Sắp xếp lại"}
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
              const row = Math.floor(index / level.config.width);
              const col = index % level.config.width;

              return (
                <div
                  key={index}
                  className={`aspect-square rounded border border-border flex items-center justify-center text-xs font-bold relative transition-all duration-200 ${
                    canDrag ? "cursor-move hover:scale-105 hover:shadow-lg" : ""
                  } ${isDragging ? "opacity-50 scale-95" : ""} ${
                    isDragOver && draggedCell
                      ? "ring-2 ring-primary ring-offset-2"
                      : ""
                  } ${
                    cell.element === "PullPin" && !isDragMode
                      ? "cursor-pointer hover:ring-2 hover:ring-blue-400"
                      : ""
                  }`}
                  style={{
                    backgroundColor:
                      cell.element === "Pipe"
                        ? "" // Gray color for pipe blocks (dead blocks)
                        : cell.element === "PullPin"
                        ? "#fff" // Brown color for pull pin blocks (barrier)
                        : cell.color
                        ? GAME_COLORS[cell.color as keyof typeof GAME_COLORS]
                        : "#f3f4f6",
                    color:
                      cell.element === "Pipe"
                        ? "#fff" // White text for pipe blocks
                        : cell.element === "PullPin"
                        ? "#fff" // White text for pull pin blocks
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
                    if (!isDragMode && cell.element === "PullPin") {
                      handlePullPinClick(index);
                    }
                  }}
                >
                  {cell.element && (
                    <div className="absolute top-0 flex items-center gap-1   rounded-bl-md px-1 py-0.5">
                      {cell.element === "Pipe" && cell.pipeDirection ? (
                        // For Pipe, only show arrow, no element icon
                        <span className="text-4xl font-bold text-orange-400 ">
                          {cell.pipeDirection === "up" && "⬆️"}
                          {cell.pipeDirection === "down" && "⬇️"}
                          {cell.pipeDirection === "left" && "⬅️"}
                          {cell.pipeDirection === "right" && "➡️"}
                        </span>
                      ) : cell.element === "PullPin" &&
                        cell.pullPinDirection ? (
                        // For Pull Pin, show directional pin icon
                        <span className="text-sm text-yellow-400 ">
                          {cell.pullPinDirection === "up" && "🔱⬆️"}
                          {cell.pullPinDirection === "down" && "🔱⬇️"}
                          {cell.pullPinDirection === "left" && "🔱⬅️"}
                          {cell.pullPinDirection === "right" && "🔱➡️"}
                        </span>
                      ) : cell.element === "Key" ? (
                        // For Key element, show key icon with pair number
                        <div className="relative">
                          <span className="text-yellow-400 drop-shadow-md text-3xl">
                            🗝️
                          </span>
                          {cell.lockPairNumber && (
                            <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                              {cell.lockPairNumber}
                            </span>
                          )}
                        </div>
                      ) : cell.element === "BlockLock" ||
                        cell.element === "Block Lock" ? (
                        // For Lock element, show lock icon with pair number
                        <div className="relative">
                          <span className="text-red-400 drop-shadow-md text-3xl">
                            🔒
                          </span>
                          {cell.lockPairNumber && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                              {cell.lockPairNumber}
                            </span>
                          )}
                        </div>
                      ) : cell.element === "IceBlock" ? (
                        // For Ice element, show ice icon with count
                        <div className="relative">
                          <span className="text-blue-300 drop-shadow-md text-3xl">
                            🧊
                          </span>
                          {cell.iceCount && (
                            <span
                              className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold cursor-pointer hover:bg-blue-600 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCountClick(row, col, "ice");
                              }}
                              title="Click to edit ice count"
                            >
                              {cell.iceCount}
                            </span>
                          )}
                        </div>
                      ) : cell.element === "Bomb" ? (
                        // For Bomb element, show bomb icon with count
                        <div className="relative">
                          <span className="text-red-500 drop-shadow-md text-3xl">
                            💣
                          </span>
                          {cell.bombCount && (
                            <span
                              className="absolute -bottom-1 -right-1 bg-red-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold cursor-pointer hover:bg-red-700 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCountClick(row, col, "bomb");
                              }}
                              title="Click to edit bomb count"
                            >
                              {cell.bombCount}
                            </span>
                          )}
                        </div>
                      ) : cell.element === "Moving" ? (
                        // For Moving element, show directional arrow
                        <div className="relative">
                          <span className="text-purple-400 drop-shadow-md text-2xl">
                            {cell.movingDirection === "up" && "🔄⬆️"}
                            {cell.movingDirection === "down" && "🔄⬇️"}
                            {cell.movingDirection === "left" && "🔄⬅️"}
                            {cell.movingDirection === "right" && "🔄➡️"}
                            {!cell.movingDirection && "🔄"}
                          </span>
                        </div>
                      ) : (
                        // For other elements, show icon
                        <span className="text-3xl text-white ">
                          {getElementIcon(cell.element)}
                        </span>
                      )}
                    </div>
                  )}
                  {cell.type === "empty"
                    ? ""
                    : cell.element === "Pipe"
                    ? "PIPE"
                    : cell.element === "PullPin"
                    ? "PIN"
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
