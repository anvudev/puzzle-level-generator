"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
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
import { GAME_COLORS } from "@/config/game-constants";
import type { GeneratedLevel, BoardCell } from "@/config/game-types";

interface LevelEditorProps {
  level: GeneratedLevel;
  onLevelUpdate: (updatedLevel: GeneratedLevel) => void;
}

export function LevelEditor({ level, onLevelUpdate }: LevelEditorProps) {
  const [selectedTool, setSelectedTool] = useState<
    "add" | "remove" | "color" | "pipe"
  >("add");
  const [selectedColor, setSelectedColor] = useState<string>("Red");
  const [selectedPipeDirection, setSelectedPipeDirection] = useState<
    "up" | "down" | "left" | "right"
  >("up");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPipe, setEditingPipe] = useState<{
    row: number;
    col: number;
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
        // Remove block
        newBoard[rowIndex][colIndex] = {
          type: "empty",
          color: null,
          element: null,
        };
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
          // Tạo pipe mới với contents mặc định theo màu đang chọn
          newBoard[rowIndex][colIndex] = {
            type: "block",
            color: null,
            element: "Pipe",
            pipeDirection: selectedPipeDirection,
            pipeSize: 3,
            pipeContents: [selectedColor, selectedColor, selectedColor],
          };
        } else if (cell.element === "Pipe") {
          // Chỉ cập nhật hướng, GIỮ NGUYÊN pipeContents và pipeSize hiện có
          newBoard[rowIndex][colIndex] = {
            ...cell,
            pipeDirection: selectedPipeDirection,
            pipeSize: cell.pipeSize || cell.pipeContents?.length || 3,
            pipeContents:
              cell.pipeContents && cell.pipeContents.length > 0
                ? cell.pipeContents
                : [selectedColor, selectedColor, selectedColor],
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

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case "up":
        return <ArrowUp className="w-4 h-4" />;
      case "down":
        return <ArrowDown className="w-4 h-4" />;
      case "left":
        return <ArrowLeft className="w-4 h-4" />;
      case "right":
        return <ArrowRight className="w-4 h-4" />;
      default:
        return <ArrowUp className="w-4 h-4" />;
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
                <div className="grid grid-cols-2 gap-2">
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
                    <RotateCw className="w-4 h-4" />
                    Pipe
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
                                    GAME_COLORS[
                                      color as keyof typeof GAME_COLORS
                                    ],
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

                {/* Pipe Direction Selection */}
                {selectedTool === "pipe" && (
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
                            onClick={() => setSelectedPipeDirection(direction)}
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
                  </ul>
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
                      row.map((cell, colIndex) => (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          className="aspect-square rounded border border-border flex items-center justify-center text-xs font-bold cursor-pointer hover:scale-105 transition-transform"
                          style={{
                            backgroundColor:
                              cell.element === "Pipe"
                                ? "#6b7280"
                                : cell.color
                                ? GAME_COLORS[
                                    cell.color as keyof typeof GAME_COLORS
                                  ]
                                : "#f3f4f6",
                            color:
                              cell.element === "Pipe"
                                ? "#fff"
                                : cell.color &&
                                  ["Yellow", "White"].includes(cell.color)
                                ? "#000"
                                : "#fff",
                          }}
                          onClick={() => handleCellClick(rowIndex, colIndex)}
                        >
                          {cell.element === "Pipe" && cell.pipeDirection && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <div className="flex flex-col items-center w-full h-full justify-center">
                                  {getDirectionIcon(cell.pipeDirection)}
                                  <span className="text-[8px] mt-1">
                                    {cell.pipeContents?.length || 0}
                                  </span>
                                </div>
                              </PopoverTrigger>
                              <PopoverContent className="w-80">
                                <div className="space-y-3">
                                  <h4 className="font-medium">Pipe Contents</h4>
                                  <div className="space-y-2">
                                    <div className="flex flex-wrap gap-1">
                                      {cell.pipeContents?.map(
                                        (color, index) => (
                                          <div
                                            key={index}
                                            className="w-6 h-6 rounded border border-border flex items-center justify-center text-xs"
                                            style={{
                                              backgroundColor:
                                                GAME_COLORS[
                                                  color as keyof typeof GAME_COLORS
                                                ],
                                              color: [
                                                "Yellow",
                                                "White",
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
                          {cell.element && cell.element !== "Pipe" && (
                            <span className="text-[8px]">{cell.element}</span>
                          )}
                        </div>
                      ))
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
                                      GAME_COLORS[
                                        colorOption as keyof typeof GAME_COLORS
                                      ],
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
    </Dialog>
  );
}
