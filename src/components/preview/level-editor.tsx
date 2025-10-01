"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import {
  Edit3,
  Plus,
  Trash2,
  Palette,
  RotateCw,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
// Removed GAME_COLORS import - now using colorMapping from level config
import type { GeneratedLevel, BoardCell } from "@/config/game-types";
import { getElementIcon } from "@/lib/utils/level-utils";

import { blockStyleDecorator } from "@/lib/utils/styleDecoration";

interface LevelEditorProps {
  level: GeneratedLevel;
  onLevelUpdate: (updatedLevel: GeneratedLevel) => void;
}

export function LevelEditor({ level, onLevelUpdate }: LevelEditorProps) {
  const [selectedTool, setSelectedTool] = useState<
    "add" | "remove" | "color" | "pipe" | "pullpin" | "wall" | "moving"
  >("add");
  const [selectedColor, setSelectedColor] = useState<string>("1");
  const [selectedPipeDirection, setSelectedPipeDirection] = useState<
    "up" | "down" | "left" | "right"
  >("up");
  const [selectedPullPinDirection, setSelectedPullPinDirection] = useState<
    "up" | "down" | "left" | "right"
  >("up");
  // New pipe configuration states
  const [pipeBlockCount, setPipeBlockCount] = useState<number>(3);
  // Moving configuration states
  const [selectedMovingDirection, setSelectedMovingDirection] = useState<
    "up" | "down" | "left" | "right"
  >("up");
  const [movingDistance, setMovingDistance] = useState<number>(2);
  const [movingBlockCount, setMovingBlockCount] = useState<number>(3);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPipe, setEditingPipe] = useState<{
    row: number;
    col: number;
    contents: string[];
  } | null>(null);
  const [editingMoving, setEditingMoving] = useState<{
    row: number;
    col: number;
    distance: number;
    contents: string[];
  } | null>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEditorOpen) return;

      switch (e.key) {
        case "1":
          setSelectedTool("add");
          break;
        case "2":
          setSelectedTool("remove");
          break;
        case "3":
          setSelectedTool("color");
          break;
        case "4":
          setSelectedTool("pipe");
          break;
        case "5":
          setSelectedTool("pullpin");
          break;
        case "6":
          setSelectedTool("wall");
          break;
        case "Escape":
          setIsEditorOpen(false);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditorOpen]);

  const handleCellClick = (rowIndex: number, colIndex: number) => {
    const newBoard = [...level.board];
    const cell = newBoard[rowIndex][colIndex];

    // Prevent other tools from modifying wall cells
    if (cell.type === "wall" && selectedTool !== "wall") {
      return;
    }

    switch (selectedTool) {
      case "add":
        // Add block
        if (cell.type === "empty") {
          newBoard[rowIndex][colIndex] = {
            type: "block",
            color: selectedColor,
            element: null,
          };
        }
        break;

      case "remove":
        // Remove block (but not walls)
        if (cell.type !== "wall") {
          newBoard[rowIndex][colIndex] = {
            type: "empty",
            color: null,
            element: null,
          };
        }
        break;

      case "color":
        // Change color
        if (cell.type === "block") {
          newBoard[rowIndex][colIndex] = {
            ...cell,
            color: selectedColor,
          };
        }
        break;

      case "pipe":
        // Add/Edit pipe
        if (cell.type === "empty") {
          // Tạo pipe mới với contents theo số lượng đã chọn
          const defaultContents = Array(pipeBlockCount).fill(selectedColor);
          newBoard[rowIndex][colIndex] = {
            type: "block",
            color: null,
            element: "Pipe",
            pipeDirection: selectedPipeDirection,
            pipeSize: pipeBlockCount,
            pipeContents: defaultContents,
          };
        } else if (cell.element === "Pipe") {
          // Chỉ cập nhật hướng, GIỮ NGUYÊN pipeContents và pipeSize hiện có
          newBoard[rowIndex][colIndex] = {
            ...cell,
            pipeDirection: selectedPipeDirection,
            pipeSize:
              cell.pipeSize || cell.pipeContents?.length || pipeBlockCount,
            pipeContents:
              cell.pipeContents && cell.pipeContents.length > 0
                ? cell.pipeContents
                : Array(pipeBlockCount).fill(selectedColor),
          };
        }
        break;

      case "pullpin":
        // Add/Edit Pull Pin
        if (cell.type === "empty") {
          // Tạo Pull Pin mới
          newBoard[rowIndex][colIndex] = {
            type: "block",
            color: null,
            element: "PullPin",
            pullPinDirection: selectedPullPinDirection,
            pullPinGateSize: 2, // Default gate size
          };
        } else if (cell.element === "PullPin") {
          // Chỉ cập nhật hướng, GIỮ NGUYÊN pullPinGateSize hiện có
          newBoard[rowIndex][colIndex] = {
            ...cell,
            pullPinDirection: selectedPullPinDirection,
            pullPinGateSize: cell.pullPinGateSize || 2,
          };
        }
        break;

      case "wall":
        // Toggle between empty and wall
        if (cell.type === "empty") {
          newBoard[rowIndex][colIndex] = {
            type: "wall",
            color: null,
            element: null,
          };
        } else if (cell.type === "wall") {
          newBoard[rowIndex][colIndex] = {
            type: "empty",
            color: null,
            element: null,
          };
        }
        break;

      case "moving":
        // Add/Edit Moving element
        if (cell.type === "empty") {
          // Tạo Moving mới với contents theo số lượng đã chọn
          const defaultContents = Array(movingBlockCount).fill(selectedColor);
          newBoard[rowIndex][colIndex] = {
            type: "block",
            color: null,
            element: "Moving",
            movingDirection: selectedMovingDirection,
            movingDistance: movingDistance,
            movingContents: defaultContents,
            movingSize: movingBlockCount,
          };
        } else if (cell.element === "Moving") {
          // Cập nhật direction và distance, GIỮ NGUYÊN movingContents và movingSize hiện có
          newBoard[rowIndex][colIndex] = {
            ...cell,
            movingDirection: selectedMovingDirection,
            movingDistance: movingDistance,
            movingSize:
              cell.movingSize ||
              cell.movingContents?.length ||
              movingBlockCount,
            movingContents:
              cell.movingContents && cell.movingContents.length > 0
                ? cell.movingContents
                : Array(movingBlockCount).fill(selectedColor),
          };
        }
        break;
    }

    // Update level
    const updatedLevel = {
      ...level,
      board: newBoard,
    };

    // Update pipe info if needed
    if (selectedTool === "pipe" || selectedTool === "remove") {
      updatedLevel.pipeInfo = extractPipeInfo(newBoard);
    }

    // Update moving info if needed
    if (selectedTool === "moving" || selectedTool === "remove") {
      updatedLevel.movingInfo = extractMovingInfo(newBoard);
    }

    onLevelUpdate(updatedLevel);
  };

  const extractPipeInfo = (board: BoardCell[][]) => {
    const pipeInfo: Array<{
      id: string;
      contents: string[];
      direction: "up" | "down" | "left" | "right";
      position: { x: number; y: number };
    }> = [];
    let pipeId = 1;

    board.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (
          cell.element === "Pipe" &&
          cell.pipeContents &&
          cell.pipeDirection
        ) {
          pipeInfo.push({
            id: `pipe${pipeId++}`,
            contents: cell.pipeContents,
            direction: cell.pipeDirection,
            position: { x, y },
          });
        }
      });
    });

    return pipeInfo;
  };

  const extractMovingInfo = (board: BoardCell[][]) => {
    const movingInfo: Array<{
      id: string;
      contents: string[];
      direction: "up" | "down" | "left" | "right";
      distance: number;
      position: { x: number; y: number };
    }> = [];
    let movingId = 1;

    board.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (
          cell.element === "Moving" &&
          cell.movingContents &&
          cell.movingDirection &&
          cell.movingDistance !== undefined
        ) {
          movingInfo.push({
            id: `moving${movingId++}`,
            contents: cell.movingContents,
            direction: cell.movingDirection,
            distance: cell.movingDistance,
            position: { x, y },
          });
        }
      });
    });

    return movingInfo;
  };

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case "up":
        return "⬆️";
      case "down":
        return "⬇️";
      case "left":
        return "⬅️";
      case "right":
        return "➡️";
      default:
        return "⬆️";
    }
  };

  const getMovingDirectionIcon = (direction: string) => {
    switch (direction) {
      case "up":
        return "⏫";
      case "down":
        return "⏬";
      case "left":
        return "⏪";
      case "right":
        return "⏩";
      default:
        return "⏫";
    }
  };

  return (
    <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Edit3 className="w-4 h-4" />
          Chỉnh sửa Level
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa Level</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tools Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Công cụ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Tool Selection */}
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={selectedTool === "add" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTool("add")}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Thêm
                  </Button>
                  <Button
                    variant={selectedTool === "remove" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTool("remove")}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Xóa
                  </Button>
                  <Button
                    variant={selectedTool === "color" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTool("color")}
                    className="flex items-center gap-2"
                  >
                    <Palette className="w-4 h-4" />
                    Màu
                  </Button>
                  <Button
                    variant={selectedTool === "pipe" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTool("pipe")}
                    className="flex items-center gap-2"
                  >
                    ⬆️ Pipe
                  </Button>
                  <Button
                    variant={selectedTool === "pullpin" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTool("pullpin")}
                    className="flex items-center gap-2"
                  >
                    🔱 Pull Pin
                  </Button>
                  <Button
                    variant={selectedTool === "moving" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTool("moving")}
                    className="flex items-center gap-2"
                  >
                    ⏫ Moving
                  </Button>
                  <Button
                    variant={selectedTool === "wall" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTool("wall")}
                    className="flex items-center gap-2"
                  >
                    <img
                      src="assets/images/wall-icon.png"
                      alt="wall"
                      width={18}
                      height={18}
                    />
                    Wall
                  </Button>
                </div>

                {/* Color Selection */}
                {(selectedTool === "add" ||
                  selectedTool === "color" ||
                  selectedTool === "pipe") && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Chọn màu:
                    </label>
                    <Select
                      value={selectedColor}
                      onValueChange={setSelectedColor}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {level.config.selectedColors.map((color) => (
                          <SelectItem key={color} value={color}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded border"
                                style={{
                                  backgroundColor:
                                    level.config.colorMapping[color] ||
                                    "#f3f4f6",
                                }}
                              />
                              {color}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Pipe Configuration */}
                {selectedTool === "pipe" && (
                  <div className="space-y-4">
                    {/* Pipe Block Count */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Số blocks trong pipe:
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="8"
                        value={pipeBlockCount}
                        onChange={(e) =>
                          setPipeBlockCount(parseInt(e.target.value) || 1)
                        }
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Số lượng blocks sẽ được đặt trong pipe (1-8)
                      </p>
                    </div>
                    {/* Pipe Direction Selection */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Hướng pipe:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {(["up", "down", "left", "right"] as const).map(
                          (direction) => (
                            <Button
                              key={direction}
                              variant={
                                selectedPipeDirection === direction
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() =>
                                setSelectedPipeDirection(direction)
                              }
                              className="flex items-center gap-2"
                            >
                              {getDirectionIcon(direction)}
                              {direction.toUpperCase()}
                            </Button>
                          )
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        ⚠️ Pipe giờ phải hướng về phía có block (không phải ô
                        trống)
                      </p>
                    </div>
                  </div>
                )}

                {/* Pull Pin Direction Selection */}
                {selectedTool === "pullpin" && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Hướng Pull Pin:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["up", "down", "left", "right"] as const).map(
                        (direction) => (
                          <Button
                            key={direction}
                            variant={
                              selectedPullPinDirection === direction
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() =>
                              setSelectedPullPinDirection(direction)
                            }
                            className="flex items-center gap-2"
                          >
                            {getDirectionIcon(direction)}
                            {direction.toUpperCase()}
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Moving Configuration */}
                {selectedTool === "moving" && (
                  <div className="space-y-4">
                    {/* Moving Block Count */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Số blocks trong moving:
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="8"
                        value={movingBlockCount}
                        onChange={(e) =>
                          setMovingBlockCount(parseInt(e.target.value) || 1)
                        }
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Số lượng blocks sẽ được đặt trong moving element (1-8)
                      </p>
                    </div>

                    {/* Moving Direction Selection */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Hướng di chuyển:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {(["up", "down", "left", "right"] as const).map(
                          (direction) => (
                            <Button
                              key={direction}
                              variant={
                                selectedMovingDirection === direction
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() =>
                                setSelectedMovingDirection(direction)
                              }
                              className="flex items-center gap-2"
                            >
                              {getDirectionIcon(direction)}
                              {direction.toUpperCase()}
                            </Button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Moving Distance */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Khoảng cách di chuyển:
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="5"
                        value={movingDistance}
                        onChange={(e) =>
                          setMovingDistance(parseInt(e.target.value) || 1)
                        }
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Số ô mà element có thể di chuyển (1-5)
                      </p>
                    </div>
                  </div>
                )}

                {/* Instructions */}
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    <strong>Hướng dẫn:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>
                      <strong>Thêm:</strong> Click vào ô trống để thêm block
                    </li>
                    <li>
                      <strong>Xóa:</strong> Click vào block để xóa
                    </li>
                    <li>
                      <strong>Màu:</strong> Click vào block để đổi màu
                    </li>
                    <li>
                      <strong>Pipe:</strong> Click để thêm/sửa pipe
                    </li>
                    <li>
                      <strong>Pull Pin:</strong> Click để thêm/sửa pull pin (🔱)
                    </li>
                    <li>
                      <strong>Moving:</strong> Click để thêm/sửa moving element
                      (⏫)
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Thông số</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Color Distribution</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {(() => {
                      // Count colors on board (similar to level-validator.tsx)
                      const colorCounts: Record<string, number> = {};

                      level.board.forEach((row) => {
                        row.forEach((cell) => {
                          if (cell.type === "block") {
                            if (cell.element === "Pipe") {
                              // Count pipe contents
                              if (cell.pipeContents) {
                                cell.pipeContents.forEach((color) => {
                                  colorCounts[color] =
                                    (colorCounts[color] || 0) + 1;
                                });
                              }
                            } else if (cell.element === "Moving") {
                              // Count moving contents
                              if (cell.movingContents) {
                                cell.movingContents.forEach((color) => {
                                  colorCounts[color] =
                                    (colorCounts[color] || 0) + 1;
                                });
                              }
                            } else if (cell.color) {
                              colorCounts[cell.color] =
                                (colorCounts[cell.color] || 0) + 1;
                            }
                          }
                        });
                      });

                      return Object.entries(colorCounts).map(
                        ([color, count]) => (
                          <div
                            key={color}
                            className="flex items-center justify-between text-sm"
                          >
                            <span>{color}:</span>
                            <Badge
                              variant={
                                count % 3 === 0 ? "default" : "destructive"
                              }
                            >
                              {count} {count % 3 === 0 ? "✓" : "✗"}
                            </Badge>
                          </div>
                        )
                      );
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Board Editor */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Bảng game - {selectedTool === "add" && "Thêm block"}
                  {selectedTool === "remove" && "Xóa block"}
                  {selectedTool === "color" && "Đổi màu"}
                  {selectedTool === "pipe" && "Sửa pipe"}
                  {selectedTool === "wall" && "Chỉnh sửa tường"}
                  {selectedTool === "moving" && "Chỉnh sửa moving"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg">
                  <div
                    className="grid gap-1 mx-auto"
                    style={{
                      gridTemplateColumns: `repeat(${level.config.width}, 1fr)`,
                      maxWidth: "500px",
                    }}
                  >
                    {level.board.map((row, rowIndex) =>
                      row.map((cell, colIndex) => {
                        return (
                          <div
                            key={`${rowIndex}-${colIndex}`}
                            className="aspect-square rounded border border-border flex items-center justify-center text-xs font-bold cursor-pointer hover:scale-105 transition-transform"
                            style={blockStyleDecorator(cell)}
                            onClick={() => handleCellClick(rowIndex, colIndex)}
                          >
                            {" "}
                            {cell.element === "Pipe" && cell.pipeDirection && (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <div className="flex flex-col items-center w-full h-full justify-center ">
                                    <span
                                      className="text-4xl relative
                                    "
                                    >
                                      {getDirectionIcon(cell.pipeDirection)}
                                    </span>
                                    <span className="text-sm text-white absolute bottom-50% right-50% translate-x-1/2 translate-y-1/2 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center">
                                      {cell.pipeContents?.length || 0}
                                    </span>
                                  </div>
                                </PopoverTrigger>
                                <PopoverContent className="w-80">
                                  <div className="space-y-3">
                                    <h4 className="font-medium">
                                      Pipe Contents
                                    </h4>
                                    <div className="space-y-2">
                                      <div className="flex flex-wrap gap-1">
                                        {cell.pipeContents?.map(
                                          (color, index) => (
                                            <div
                                              key={index}
                                              className="w-6 h-6 rounded border border-border flex items-center justify-center text-xs"
                                              style={{
                                                backgroundColor:
                                                  level.config.colorMapping[
                                                    color
                                                  ] || "#f3f4f6",
                                                color: [
                                                  "color_4", // Yellow
                                                  "color_12", // White
                                                ].includes(color)
                                                  ? "#000"
                                                  : "#fff",
                                              }}
                                            >
                                              {index + 1}
                                            </div>
                                          )
                                        )}
                                      </div>
                                      <Button
                                        size="sm"
                                        onClick={() => {
                                          setEditingPipe({
                                            row: rowIndex,
                                            col: colIndex,
                                            contents: cell.pipeContents || [],
                                          });
                                        }}
                                      >
                                        Edit Contents
                                      </Button>
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                            {cell.element === "Moving" &&
                              cell.movingDirection && (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <div className="flex flex-col items-center w-full h-full justify-center">
                                      <span className="text-4xl relative">
                                        {getMovingDirectionIcon(
                                          cell.movingDirection
                                        )}
                                      </span>
                                      <span className="text-sm text-white absolute bottom-50% right-50% translate-x-1/2 translate-y-1/2 bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center">
                                        {cell.movingContents?.length || 0}
                                      </span>
                                      <span className="text-xs text-white absolute top-0 left-0 bg-purple-500 rounded-full w-4 h-4 flex items-center justify-center">
                                        {cell.movingDistance || 1}
                                      </span>
                                    </div>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-80">
                                    <div className="space-y-3">
                                      <h4 className="font-medium">
                                        Moving Contents
                                      </h4>
                                      <div className="space-y-2">
                                        <div className="text-sm">
                                          <span className="font-medium">
                                            Hướng:{" "}
                                          </span>
                                          {cell.movingDirection?.toUpperCase()}
                                        </div>
                                        <div className="text-sm">
                                          <span className="font-medium">
                                            Khoảng cách:{" "}
                                          </span>
                                          {cell.movingDistance} ô
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                          {cell.movingContents?.map(
                                            (color, index) => (
                                              <div
                                                key={index}
                                                className="w-6 h-6 rounded border border-border flex items-center justify-center text-xs"
                                                style={{
                                                  backgroundColor:
                                                    level.config.colorMapping[
                                                      color
                                                    ] || "#f3f4f6",
                                                  color: [
                                                    "color_4", // Yellow
                                                    "color_12", // White
                                                  ].includes(color)
                                                    ? "#000"
                                                    : "#fff",
                                                }}
                                              >
                                                {index + 1}
                                              </div>
                                            )
                                          )}
                                        </div>
                                        <Button
                                          size="sm"
                                          onClick={() => {
                                            setEditingMoving({
                                              row: rowIndex,
                                              col: colIndex,
                                              contents:
                                                cell.movingContents || [],
                                              distance:
                                                cell.movingDistance || 1,
                                            });
                                          }}
                                        >
                                          Edit Contents
                                        </Button>
                                      </div>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              )}
                            {cell.type === "wall" && (
                              <span className="text-3xl opacity-30">
                                <img
                                  src="assets/images/wall-icon.png"
                                  alt="wall"
                                  width={40}
                                  height={40}
                                />
                              </span>
                            )}
                            {cell.type == "block" && !cell.element && (
                              <span className="text-sm font-medium text-white">
                                {cell.color}
                              </span>
                            )}
                            {cell.element &&
                              cell.element !== "Pipe" &&
                              cell.element !== "Moving" && (
                                <span className="text-3xl">
                                  {getElementIcon(cell.element)}
                                </span>
                              )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>

      {/* Pipe Contents Editor Dialog */}
      {editingPipe && (
        <Dialog open={!!editingPipe} onOpenChange={() => setEditingPipe(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa nội dung Pipe</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Số lượng blocks trong pipe:
                </label>
                <Input
                  type="number"
                  min="1"
                  max="8"
                  value={editingPipe.contents.length}
                  onChange={(e) => {
                    const newLength = parseInt(e.target.value) || 1;
                    const newContents = [...editingPipe.contents];

                    if (newLength > newContents.length) {
                      // Add more blocks with default color
                      while (newContents.length < newLength) {
                        newContents.push(selectedColor);
                      }
                    } else {
                      // Remove excess blocks
                      newContents.splice(newLength);
                    }

                    setEditingPipe({
                      ...editingPipe,
                      contents: newContents,
                    });
                  }}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Màu sắc từng block:
                </label>
                <div className="space-y-2">
                  {editingPipe.contents.map((color, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-sm w-8">#{index + 1}</span>
                      <Select
                        value={color}
                        onValueChange={(newColor) => {
                          const newContents = [...editingPipe.contents];
                          newContents[index] = newColor;
                          setEditingPipe({
                            ...editingPipe,
                            contents: newContents,
                          });
                        }}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {level.config.selectedColors.map((colorOption) => (
                            <SelectItem key={colorOption} value={colorOption}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded border"
                                  style={{
                                    backgroundColor:
                                      level.config.colorMapping[colorOption] ||
                                      "#f3f4f6",
                                  }}
                                />
                                {colorOption}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingPipe(null)}>
                  Hủy
                </Button>
                <Button
                  onClick={() => {
                    if (editingPipe) {
                      const newBoard = [...level.board];
                      const cell = newBoard[editingPipe.row][editingPipe.col];

                      if (cell.element === "Pipe") {
                        newBoard[editingPipe.row][editingPipe.col] = {
                          ...cell,
                          pipeContents: editingPipe.contents,
                          pipeSize: editingPipe.contents.length,
                        };

                        const updatedLevel = {
                          ...level,
                          board: newBoard,
                          pipeInfo: extractPipeInfo(newBoard),
                        };

                        onLevelUpdate(updatedLevel);
                      }
                    }
                    setEditingPipe(null);
                  }}
                >
                  Lưu
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Moving Contents Editor Dialog */}
      {editingMoving && (
        <Dialog
          open={!!editingMoving}
          onOpenChange={() => setEditingMoving(null)}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa nội dung Moving</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Khoảng cách di chuyển:
                </label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={editingMoving.distance}
                  onChange={(e) => {
                    const newDistance = parseInt(e.target.value) || 1;
                    setEditingMoving({
                      ...editingMoving,
                      distance: newDistance,
                    });
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Số ô mà element có thể di chuyển (1-5)
                </p>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Số lượng blocks trong moving:
                </label>
                <Input
                  type="number"
                  min="1"
                  max="8"
                  value={editingMoving.contents.length}
                  onChange={(e) => {
                    const newLength = parseInt(e.target.value) || 1;
                    const newContents = [...editingMoving.contents];

                    if (newLength > newContents.length) {
                      // Add more blocks with default color
                      while (newContents.length < newLength) {
                        newContents.push(selectedColor);
                      }
                    } else {
                      // Remove excess blocks
                      newContents.splice(newLength);
                    }

                    setEditingMoving({
                      ...editingMoving,
                      contents: newContents,
                    });
                  }}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Màu sắc từng block:
                </label>
                <div className="space-y-2">
                  {editingMoving.contents.map((color, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-sm w-8">#{index + 1}</span>
                      <Select
                        value={color}
                        onValueChange={(newColor) => {
                          const newContents = [...editingMoving.contents];
                          newContents[index] = newColor;
                          setEditingMoving({
                            ...editingMoving,
                            contents: newContents,
                          });
                        }}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {level.config.selectedColors.map((colorOption) => (
                            <SelectItem key={colorOption} value={colorOption}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded border"
                                  style={{
                                    backgroundColor:
                                      level.config.colorMapping[colorOption] ||
                                      "#f3f4f6",
                                  }}
                                />
                                {colorOption}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingMoving(null)}
                >
                  Hủy
                </Button>
                <Button
                  onClick={() => {
                    if (editingMoving) {
                      const newBoard = [...level.board];
                      const cell =
                        newBoard[editingMoving.row][editingMoving.col];

                      if (cell.element === "Moving") {
                        newBoard[editingMoving.row][editingMoving.col] = {
                          ...cell,
                          movingContents: editingMoving.contents,
                          movingSize: editingMoving.contents.length,
                          movingDistance: editingMoving.distance,
                        };

                        const updatedLevel = {
                          ...level,
                          board: newBoard,
                          movingInfo: extractMovingInfo(newBoard),
                        };

                        onLevelUpdate(updatedLevel);
                      }
                    }
                    setEditingMoving(null);
                  }}
                >
                  Lưu
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
