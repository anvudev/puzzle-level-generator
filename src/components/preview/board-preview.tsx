"use client";

import type React from "react";
// removed unused import 'ring'
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// Removed GAME_COLORS import - now using colorMapping from level config
import type { GeneratedLevel, BoardCell } from "@/config/game-types";
import { getElementIcon } from "@/lib/utils/level-utils";
import {
  RotateCcw,
  Move,
  Users,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { LevelEditor } from "./level-editor";
import { LevelHelp } from "./level-help";
import { blockStyleDecorator } from "@/lib/utils/styleDecoration";
import { useBlockGroupDrag } from "@/lib/hooks/use-block-group-drag";
import { getConnectedBlocks } from "@/lib/utils/block-group-utils";

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
  const [selectedBlockGroup, setSelectedBlockGroup] = useState<
    { x: number; y: number }[] | null
  >(null);

  // Group drag functionality
  const {
    groupDragState,
    toggleGroupMode,
    handleCellHover,
    handleCellLeave,
    handleGroupDragStart,
    handleGroupDragOver,
    handleGroupDrop,
    handleGroupDragEnd,
    clearSelection,
    isInSelectedGroup,
    isInHoveredGroup,
    isInDragPreview,
    canDropAtPosition,
  } = useBlockGroupDrag(level, onLevelUpdate);

  // Block group movement functions
  const handleBlockClick = (row: number, col: number) => {
    if (!isDragMode) return;

    const cell = level.board[row][col];
    if (cell.type !== "block") return;

    const connectedBlocks = getConnectedBlocks(level.board, col, row);
    setSelectedBlockGroup(connectedBlocks);
  };

  // Helper function to check if a position is in selected group
  const isInSelectedBlockGroup = (x: number, y: number): boolean => {
    return (
      selectedBlockGroup?.some((pos) => pos.x === x && pos.y === y) || false
    );
  };

  const moveBlockGroup = (direction: "up" | "down" | "left" | "right") => {
    if (!selectedBlockGroup || !onLevelUpdate) return;

    console.log(`🚀 Moving block group ${direction}`, selectedBlockGroup);

    const newBoard = level.board.map((row) => [...row]);
    const width = level.config.width;
    const height = level.config.height;

    // Calculate movement delta
    const deltaX = direction === "left" ? -1 : direction === "right" ? 1 : 0;
    const deltaY = direction === "up" ? -1 : direction === "down" ? 1 : 0;

    console.log(`📐 Delta: x=${deltaX}, y=${deltaY}`);

    // Check if movement is valid
    const canMove = selectedBlockGroup.every((pos) => {
      const newX = pos.x + deltaX;
      const newY = pos.y + deltaY;

      // Check bounds
      if (newX < 0 || newX >= width || newY < 0 || newY >= height) {
        console.log(`❌ Out of bounds: (${newX}, ${newY})`);
        return false;
      }

      // Check if target position is empty, wall, or part of the same group
      const targetCell = newBoard[newY][newX];
      const isValidTarget =
        targetCell.type === "empty" ||
        targetCell.type === "wall" ||
        selectedBlockGroup.some(
          (groupPos) => groupPos.x === newX && groupPos.y === newY
        );

      if (!isValidTarget) {
        console.log(
          `❌ Target occupied: (${newX}, ${newY}) = ${targetCell.type}`
        );
      } else if (targetCell.type === "wall") {
        console.log(
          `🧱 Moving over wall: (${newX}, ${newY}) - wall will be replaced`
        );
      }

      return isValidTarget;
    });

    console.log(`✅ Can move: ${canMove}`);

    if (!canMove) return;

    // Store the blocks to move
    const blocksToMove = selectedBlockGroup.map((pos) => ({
      ...pos,
      cell: newBoard[pos.y][pos.x],
    }));

    // Clear original positions (set to empty)
    selectedBlockGroup.forEach((pos) => {
      newBoard[pos.y][pos.x] = {
        type: "empty",
        color: null,
        element: null,
      };
    });

    // Place blocks in new positions
    blocksToMove.forEach((block) => {
      const newX = block.x + deltaX;
      const newY = block.y + deltaY;
      newBoard[newY][newX] = block.cell;
    });

    // Fill empty spaces with walls
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (newBoard[y][x].type === "empty") {
          newBoard[y][x] = {
            type: "wall",
            color: null,
            element: null,
          };
        }
      }
    }

    // Update selected group positions
    const newSelectedGroup = selectedBlockGroup.map((pos) => ({
      x: pos.x + deltaX,
      y: pos.y + deltaY,
    }));
    setSelectedBlockGroup(newSelectedGroup);

    // Update level
    const updatedLevel = {
      ...level,
      board: newBoard,
    };
    onLevelUpdate(updatedLevel);
  };

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

  const handlePipeClick = (index: number) => {
    if (!onLevelUpdate) return;

    const row = Math.floor(index / level.config.width);
    const col = index % level.config.width;
    const cell = level.board[row][col];

    if (cell.element === "Pipe") {
      // Cycle through directions: up -> right -> down -> left -> up
      const directions: Array<"up" | "down" | "left" | "right"> = [
        "up",
        "right",
        "down",
        "left",
      ];
      const currentIndex = directions.indexOf(cell.pipeDirection || "up");
      const nextDirection = directions[(currentIndex + 1) % directions.length];

      // Update the board with new direction
      const newBoard = level.board.map((boardRow, rowIndex) =>
        boardRow.map((boardCell, colIndex) => {
          if (rowIndex === row && colIndex === col) {
            return {
              ...boardCell,
              pipeDirection: nextDirection,
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

  const handleMovingClick = (index: number) => {
    if (!onLevelUpdate) return;

    const row = Math.floor(index / level.config.width);
    const col = index % level.config.width;
    const cell = level.board[row][col];

    if (cell.element === "Moving") {
      // Cycle through directions: up -> right -> down -> left -> up
      const directions: Array<"up" | "down" | "left" | "right"> = [
        "up",
        "right",
        "down",
        "left",
      ];
      const currentIndex = directions.indexOf(cell.movingDirection || "up");
      const nextDirection = directions[(currentIndex + 1) % directions.length];

      // Update the board with new direction
      const newBoard = level.board.map((boardRow, rowIndex) =>
        boardRow.map((boardCell, colIndex) => {
          if (rowIndex === row && colIndex === col) {
            return {
              ...boardCell,
              movingDirection: nextDirection,
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
              <>
                <Button
                  variant={groupDragState.isGroupMode ? "default" : "outline"}
                  size="sm"
                  onClick={toggleGroupMode}
                  className="flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  {groupDragState.isGroupMode ? "Kéo khối" : "Kéo đơn"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetBoard}
                  className="flex items-center gap-2 bg-transparent"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </Button>
              </>
            )}
          </div>
        </div>
        {isDragMode && (
          <>
            <p className="text-sm text-muted-foreground">
              {groupDragState.isGroupMode
                ? "Click vào block để chọn khối, sau đó dùng nút mũi tên để di chuyển cả khối."
                : "Kéo thả từng block để sắp xếp lại vị trí. Chỉ có thể di chuyển các block có màu."}
            </p>
            {selectedBlockGroup && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm font-medium">
                  Di chuyển khối ({selectedBlockGroup.length} blocks):
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => moveBlockGroup("up")}
                    className="p-2"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => moveBlockGroup("down")}
                    className="p-2"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => moveBlockGroup("left")}
                    className="p-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => moveBlockGroup("right")}
                    className="p-2"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedBlockGroup(null)}
                    className="ml-2"
                  >
                    Bỏ chọn
                  </Button>
                </div>
              </div>
            )}
          </>
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
              const canDrag =
                isDragMode && cell.type !== "empty" && cell.type !== "wall";
              const row = Math.floor(index / level.config.width);
              const col = index % level.config.width;

              // Group drag states
              const isInSelected = isInSelectedGroup(index);
              const isInHovered = isInHoveredGroup(index);
              const isInPreview = isInDragPreview(index);
              const canDropHere = canDropAtPosition(index);

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
                    (cell.element === "PullPin" ||
                      cell.element === "Pipe" ||
                      cell.element === "Moving") &&
                    !isDragMode
                      ? "cursor-pointer hover:ring-2 hover:ring-blue-400"
                      : ""
                  } ${
                    groupDragState.isGroupMode && isInSelected
                      ? "ring-2 ring-blue-500 ring-offset-1"
                      : ""
                  } ${
                    groupDragState.isGroupMode &&
                    isInHovered &&
                    !groupDragState.isDragging
                      ? "ring-2 ring-green-400 ring-offset-1"
                      : ""
                  } ${
                    groupDragState.isGroupMode &&
                    isInPreview &&
                    groupDragState.isDragging
                      ? "ring-2 ring-yellow-400 ring-offset-1 opacity-70"
                      : ""
                  } ${
                    groupDragState.isGroupMode &&
                    canDropHere &&
                    groupDragState.isDragging
                      ? "bg-green-100 dark:bg-green-900"
                      : ""
                  } ${
                    selectedBlockGroup && isInSelectedBlockGroup(col, row)
                      ? "ring-2 ring-purple-500 ring-offset-1 bg-purple-100 dark:bg-purple-900"
                      : ""
                  }`}
                  style={blockStyleDecorator(cell)}
                  draggable={canDrag}
                  onDragStart={(e) => {
                    if (groupDragState.isGroupMode) {
                      handleGroupDragStart(index);
                    } else {
                      handleDragStart(e, cell, index);
                    }
                  }}
                  onDragOver={(e) => {
                    if (groupDragState.isGroupMode) {
                      e.preventDefault();
                      handleGroupDragOver(index);
                    } else {
                      handleDragOver(e, index);
                    }
                  }}
                  onDragLeave={() => {
                    if (!groupDragState.isGroupMode) {
                      handleDragLeave();
                    }
                  }}
                  onDrop={(e) => {
                    if (groupDragState.isGroupMode) {
                      e.preventDefault();
                      handleGroupDrop(index);
                    } else {
                      handleDrop(e, index);
                    }
                  }}
                  onDragEnd={() => {
                    if (groupDragState.isGroupMode) {
                      handleGroupDragEnd();
                    } else {
                      handleDragEnd();
                    }
                  }}
                  onMouseEnter={() => {
                    if (groupDragState.isGroupMode) {
                      handleCellHover(index);
                    }
                  }}
                  onMouseLeave={() => {
                    if (groupDragState.isGroupMode) {
                      handleCellLeave();
                    }
                  }}
                  onClick={() => {
                    if (!isDragMode) {
                      if (cell.element === "PullPin") {
                        handlePullPinClick(index);
                      } else if (cell.element === "Pipe") {
                        handlePipeClick(index);
                      } else if (cell.element === "Moving") {
                        handleMovingClick(index);
                      }
                    } else if (
                      isDragMode &&
                      groupDragState.isGroupMode &&
                      cell.type === "block"
                    ) {
                      // Handle block selection for group movement
                      handleBlockClick(row, col);
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
                              className=" -bottom-1 -right-1 bg-red-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold cursor-pointer hover:bg-red-700 transition-colors"
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
                        <div className="">
                          <span className="text-purple-400 drop-shadow-md text-4xl">
                            {cell.movingDirection === "up" && "⏫"}
                            {cell.movingDirection === "down" && "⏬"}
                            {cell.movingDirection === "left" && "⏪"}
                            {cell.movingDirection === "right" && "⏩"}
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
                  {cell.type === "wall" ? (
                    <span className="text-3xl text-white opacity-30">🧱</span>
                  ) : (
                    <span className="text-white">{cell.color}</span>
                  )}
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
