"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/simple-alert-dialog";
import {
  History,
  Eye,
  Edit3,
  Trash2,
  Copy,
  Download,
  Calendar,
  Grid3X3,
  Palette,
  Zap,
  RefreshCw,
} from "lucide-react";
import {
  useLevelHistory,
  type SavedLevel,
} from "@/lib/hooks/use-level-history";
import { GAME_COLORS } from "@/config/game-constants";
// import { BoardPreview } from "./preview/board-preview";
import type { GeneratedLevel } from "@/config/game-types";
import { getElementIcon, getPipeIcon } from "@/lib/utils/level-utils";

interface LevelHistoryProps {
  onLoadLevel?: (level: GeneratedLevel) => void;
  onEditLevel?: (level: GeneratedLevel) => void;
}

export function LevelHistory({ onLoadLevel, onEditLevel }: LevelHistoryProps) {
  const {
    savedLevels,
    isLoading,
    updateLevel,
    deleteLevel,
    clearHistory,
    duplicateLevel,
    totalCount,
  } = useLevelHistory();

  const [selectedLevel, setSelectedLevel] = useState<SavedLevel | null>(null);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  const handleRename = (level: SavedLevel) => {
    setEditingName(level.id);
    setNewName(level.name);
  };

  const handleSaveRename = (id: string) => {
    if (newName.trim()) {
      updateLevel(id, { name: newName.trim() });
    }
    setEditingName(null);
    setNewName("");
  };

  const handleCancelRename = () => {
    setEditingName(null);
    setNewName("");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getLevelStats = (level: GeneratedLevel) => {
    let blockCount = 0;
    let pipeCount = 0;
    let pullPinCount = 0;
    const colors = new Set<string>();

    level.board.forEach((row) => {
      row.forEach((cell) => {
        if (cell.type === "block") {
          blockCount++;
          if (cell.element === "Pipe") {
            pipeCount++;
            if (cell.pipeContents) {
              cell.pipeContents.forEach((color) => colors.add(color));
            }
          } else if (cell.element === "PullPin") {
            pullPinCount++;
          } else if (cell.color) {
            colors.add(cell.color);
          }
        }
      });
    });

    return {
      blockCount,
      pipeCount,
      pullPinCount,
      colorCount: colors.size,
      dimensions: `${level.config.width}×${level.config.height}`,
    };
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          <span>Đang tải lịch sử...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <History className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-bold">
                  Lịch sử Level
                </CardTitle>
                <p className="text-sm text-blue-600 mt-1">
                  {totalCount} level đã lưu
                </p>
              </div>
            </div>
            {totalCount > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Xóa tất cả
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xóa tất cả lịch sử?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Hành động này sẽ xóa vĩnh viễn tất cả {totalCount} level
                      đã lưu. Bạn không thể hoàn tác sau khi xóa.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={clearHistory}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Xóa tất cả
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Level List */}
      {totalCount === 0 ? (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <History className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Chưa có level nào được lưu
            </h3>
            <p className="text-gray-500 text-center">
              Tạo và lưu level đầu tiên để bắt đầu xây dựng bộ sưu tập của bạn!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {savedLevels.map((savedLevel) => {
            const stats = getLevelStats(savedLevel.level);

            return (
              <Card
                key={savedLevel.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <div className="flex-shrink-0">
                      <div className="w-24 h-24 border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
                        <div
                          className="w-full h-full grid gap-0.5 p-1"
                          style={{
                            gridTemplateColumns: `repeat(${savedLevel.level.config.width}, 1fr)`,
                            gridTemplateRows: `repeat(${savedLevel.level.config.height}, 1fr)`,
                          }}
                        >
                          {savedLevel.level.board.flat().map((cell, index) => (
                            <div
                              key={index}
                              className="rounded-sm border border-gray-100"
                              style={{
                                backgroundColor:
                                  cell.type === "block"
                                    ? cell.color
                                      ? GAME_COLORS[
                                          cell.color as keyof typeof GAME_COLORS
                                        ] || "#f3f4f6"
                                      : "#e5e7eb"
                                    : "#f9fafb",
                                fontSize: "6px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {cell.element === "Pipe" && "🔧"}
                              {cell.element === "PullPin" && "🔱"}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          {editingName === savedLevel.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="h-8"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")
                                    handleSaveRename(savedLevel.id);
                                  if (e.key === "Escape") handleCancelRename();
                                }}
                                autoFocus
                              />
                              <Button
                                size="sm"
                                onClick={() => handleSaveRename(savedLevel.id)}
                              >
                                ✓
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelRename}
                              >
                                ✕
                              </Button>
                            </div>
                          ) : (
                            <h3 className="font-semibold text-lg truncate">
                              {savedLevel.name}
                            </h3>
                          )}
                          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                            <Calendar className="w-4 h-4" />
                            <span>Tạo: {formatDate(savedLevel.createdAt)}</span>
                            {savedLevel.updatedAt !== savedLevel.createdAt && (
                              <span>
                                • Sửa: {formatDate(savedLevel.updatedAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline" className="text-xs">
                          <Grid3X3 className="w-3 h-3 mr-1" />
                          {stats.dimensions}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Palette className="w-3 h-3 mr-1" />
                          {stats.colorCount} màu
                        </Badge>
                        {stats.pipeCount > 0 && (
                          <Badge variant="outline" className="text-xs">
                            🔧 {stats.pipeCount} pipe
                          </Badge>
                        )}
                        {stats.pullPinCount > 0 && (
                          <Badge variant="outline" className="text-xs">
                            🔱 {stats.pullPinCount} pull pin
                          </Badge>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedLevel(savedLevel)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Xem
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>{savedLevel.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="w-full max-w-md mx-auto border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
                                <div
                                  className="w-full aspect-square grid gap-1 p-2"
                                  style={{
                                    gridTemplateColumns: `repeat(${savedLevel.level.config.width}, 1fr)`,
                                    gridTemplateRows: `repeat(${savedLevel.level.config.height}, 1fr)`,
                                  }}
                                >
                                  {savedLevel.level.board
                                    .flat()
                                    .map((cell, index) => (
                                      <div
                                        key={index}
                                        className="rounded text-3xl border border-gray-200 flex items-center justify-center"
                                        style={{
                                          backgroundColor:
                                            cell.type === "block"
                                              ? cell.color
                                                ? GAME_COLORS[
                                                    cell.color as keyof typeof GAME_COLORS
                                                  ] || "#f3f4f6"
                                                : ""
                                              : "#f9fafb",
                                        }}
                                      >
                                        {cell.element === "Pipe" &&
                                          getPipeIcon(
                                            cell.pipeDirection || "up"
                                          )}
                                        {cell.element === "PullPin" &&
                                          getElementIcon(cell.element)}
                                        {cell.element === "Barrel" &&
                                          getElementIcon(cell.element)}
                                        {cell.element === "IceBlock" &&
                                          getElementIcon(cell.element)}
                                        {cell.element === "BlockLock" &&
                                          getElementIcon(cell.element)}
                                        {cell.element === "PullPin" &&
                                          getElementIcon(cell.element)}
                                        {cell.element === "Bomb" &&
                                          getElementIcon(cell.element)}
                                        {cell.element === "Moving" &&
                                          getElementIcon(cell.element)}
                                        {cell.element === "Key" &&
                                          getElementIcon(cell.element)}
                                      </div>
                                    ))}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="font-medium">
                                    Kích thước:
                                  </span>
                                  <div>{stats.dimensions}</div>
                                </div>
                                <div>
                                  <span className="font-medium">Màu sắc:</span>
                                  <div>{stats.colorCount} màu</div>
                                </div>
                                <div>
                                  <span className="font-medium">Pipes:</span>
                                  <div>{stats.pipeCount}</div>
                                </div>
                                <div>
                                  <span className="font-medium">
                                    Pull Pins:
                                  </span>
                                  <div>{stats.pullPinCount}</div>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {onLoadLevel && (
                          <Button
                            size="sm"
                            onClick={() => onLoadLevel(savedLevel.level)}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Tải
                          </Button>
                        )}

                        {onEditLevel && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onEditLevel(savedLevel.level)}
                          >
                            <Edit3 className="w-4 h-4 mr-1" />
                            Sửa
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRename(savedLevel)}
                        >
                          <Edit3 className="w-4 h-4 mr-1" />
                          Đổi tên
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => duplicateLevel(savedLevel.id)}
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Sao chép
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Xóa
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Xóa level này?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Bạn có chắc muốn xóa "{savedLevel.name}"? Hành
                                động này không thể hoàn tác.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteLevel(savedLevel.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Xóa
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
