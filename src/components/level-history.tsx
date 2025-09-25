"use client";

import React, { useState, useMemo } from "react";
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
  History,
  Eye,
  Edit3,
  Copy,
  Download,
  Calendar,
  Grid3X3,
  Palette,
  RefreshCw,
  Search,
  Trash2,
  CheckSquare,
  Square,
} from "lucide-react";
import {
  useLevelHistory,
  type SavedLevel,
} from "@/lib/hooks/use-level-history";
// Removed GAME_COLORS import - now using colorMapping from level config
import type { GeneratedLevel } from "@/config/game-types";
import {
  getElementIcon,
  getPipeIcon,
  generateCSVMatrix,
  getDifficultyColor,
} from "@/lib/utils/level-utils";
import { AlertDialogUI } from "./alert/alert";
import { elementGenerate } from "@/lib/utils/styleDecoration";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LevelHistoryProps {
  onLoadLevel?: (level: GeneratedLevel) => void;
  onEditLevel?: (level: GeneratedLevel) => void;
}

interface SortOption {
  value: "name-asc" | "name-desc" | "newest" | "oldest";
  label: string;
  icon: string;
}

export function LevelHistory({ onLoadLevel, onEditLevel }: LevelHistoryProps) {
  const {
    savedLevels,
    isLoading,
    updateLevelName,
    deleteLevel,
    duplicateLevel,
    totalCount,
  } = useLevelHistory();

  const [editingName, setEditingName] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption["value"]>("name-asc");
  const [selectedLevels, setSelectedLevels] = useState<Set<string>>(new Set());
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [filterElements, setFilterElements] = useState<string>("all");
  const [downloadFormat, setDownloadFormat] = useState<"csv" | "json">("csv");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);

  // Filtered and sorted levels
  const filteredAndSortedLevels = useMemo(() => {
    let filtered = savedLevels.filter((savedLevel) => {
      // Search filter
      const matchesSearch = savedLevel.name
        .toLowerCase()
        .includes(search.toLowerCase());

      // Difficulty filter
      const matchesDifficulty =
        filterDifficulty === "all" ||
        savedLevel.level.config.difficulty === filterDifficulty;

      // Elements filter
      const hasElements =
        Object.keys(savedLevel.level.config.elements).length > 0;
      const matchesElements =
        filterElements === "all" ||
        (filterElements === "with-elements" && hasElements) ||
        (filterElements === "no-elements" && !hasElements);

      return matchesSearch && matchesDifficulty && matchesElements;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          // Convert to numbers if possible, fallback to string comparison
          const aNum = parseFloat(a.name) || 0;
          const bNum = parseFloat(b.name) || 0;
          if (!isNaN(aNum) && !isNaN(bNum)) {
            return aNum - bNum;
          }
          return a.name.localeCompare(b.name);
        case "name-desc":
          // Convert to numbers if possible, fallback to string comparison
          const aNumDesc = parseFloat(a.name) || 0;
          const bNumDesc = parseFloat(b.name) || 0;
          if (!isNaN(aNumDesc) && !isNaN(bNumDesc)) {
            return bNumDesc - aNumDesc;
          }
          return b.name.localeCompare(a.name);
        case "oldest":
          return a.createdAt.localeCompare(b.createdAt);
        case "newest":
        default:
          return b.createdAt.localeCompare(a.createdAt);
      }
    });

    return filtered;
  }, [savedLevels, search, filterDifficulty, filterElements, sortBy]);

  const handleRename = (level: SavedLevel) => {
    setEditingName(level.id);
    setNewName(level.name);
  };

  const handleSaveRename = (id: string) => {
    if (newName.trim()) {
      updateLevelName(id, { name: newName.trim() });
    }
    setEditingName(null);
    setNewName("");
  };

  const handleCancelRename = () => {
    setEditingName(null);
    setNewName("");
  };

  // Multi-select functions
  const toggleSelectLevel = (levelId: string) => {
    const newSelected = new Set(selectedLevels);
    if (newSelected.has(levelId)) {
      newSelected.delete(levelId);
    } else {
      newSelected.add(levelId);
    }
    setSelectedLevels(newSelected);
  };

  const selectAllLevels = () => {
    setSelectedLevels(
      new Set(filteredAndSortedLevels.map((level) => level.id))
    );
  };

  const clearSelection = () => {
    setSelectedLevels(new Set());
  };

  const handleDownloadClick = () => {
    if (selectedLevels.size > 5) {
      setShowDownloadDialog(true);
    } else {
      downloadSelectedLevels();
    }
  };

  const confirmDownload = () => {
    setShowDownloadDialog(false);
    downloadSelectedLevels();
  };

  const deleteSelectedLevels = () => {
    selectedLevels.forEach((levelId) => deleteLevel(levelId));
    setSelectedLevels(new Set());
  };

  // Enhanced bulk download function with progress tracking
  const downloadSelectedLevels = async () => {
    const selectedLevelData = filteredAndSortedLevels.filter((level) =>
      selectedLevels.has(level.id)
    );

    if (selectedLevelData.length === 0) return;

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      // Download each level as separate file
      for (let i = 0; i < selectedLevelData.length; i++) {
        const savedLevel = selectedLevelData[i];
        const level = savedLevel.level;
        const customBars: any[] = []; // You might want to get this from store

        let content: string;
        let mimeType: string;
        let extension: string;

        if (downloadFormat === "csv") {
          content = generateCSVMatrix(level, customBars);
          mimeType = "text/csv";
          extension = "csv";
        } else {
          const { formatLevelForExport } = await import(
            "@/lib/utils/level-utils"
          );
          const data = formatLevelForExport(level, customBars);
          content = JSON.stringify(data, null, 2);
          mimeType = "application/json";
          extension = "json";
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `WoolSoft_level_${savedLevel.name.replace(
          /[^a-zA-Z0-9]/g,
          "_"
        )}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Update progress
        setDownloadProgress(((i + 1) / selectedLevelData.length) * 100);

        // Add delay to prevent browser blocking
        if (i < selectedLevelData.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
      }
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
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
    const colors = new Set<string>();

    level.board.forEach((row) => {
      row.forEach((cell) => {
        if (cell.type === "block") {
          blockCount++;
          if (cell.element === "Pipe") {
            if (cell.pipeContents) {
              cell.pipeContents.forEach((color) => colors.add(color));
            }
          } else if (cell.color) {
            colors.add(cell.color);
          }
        }
      });
    });

    return {
      blockCount,
      elements: level.config.elements,
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
      <div className="p-3 space-y-4">
        <div className="flex gap-3 justify-center">
          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 shadow-sm mb-4">
            <CardContent className="p-4 flex">
              <div className="flex items-center gap-3 mr-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-700">
                  <Search className="w-4 h-4" />
                  <span>Tìm kiếm:</span>
                </div>
                <div className="relative flex-1">
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Nhập tên level để tìm kiếm..."
                    className="pl-10 pr-20 bg-white border-amber-300 focus-visible:ring-amber-500 focus-visible:ring-2 border-2 shadow-sm transition-all duration-200 focus:shadow-md"
                  />
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" />
                  {search && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-100"
                      onClick={() => setSearch("")}
                    >
                      <span className="mr-1">✕</span>
                      Xóa
                    </Button>
                  )}
                </div>
                {search && (
                  <Badge
                    variant="secondary"
                    className="bg-amber-100 text-amber-700"
                  >
                    {filteredAndSortedLevels.length} kết quả
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={selectAllLevels}
                    disabled={filteredAndSortedLevels.length === 0}
                    className="bg-white hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors"
                  >
                    <CheckSquare className="w-4 h-4 mr-1" />(
                    {filteredAndSortedLevels.length})
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearSelection}
                    disabled={selectedLevels.size === 0}
                    className="bg-white hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors"
                  >
                    <Square className="w-4 h-4 mr-1" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleDownloadClick}
                    disabled={isDownloading}
                    className="bg-green-600 hover:bg-green-700 text-white shadow-md"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    {isDownloading
                      ? "Đang tải..."
                      : `Tải ${downloadFormat.toUpperCase()}`}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={deleteSelectedLevels}
                    disabled={isDownloading}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Xóa
                  </Button>
                  <div className="flex items-center gap-2">
                    <Select
                      value={sortBy}
                      onValueChange={(value: any) => setSortBy(value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Sắp xếp" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Mới nhất</SelectItem>
                        <SelectItem value="oldest">Cũ nhất</SelectItem>
                        <SelectItem value="name-asc">ASC</SelectItem>
                        <SelectItem value="name-desc">DESC</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={filterDifficulty}
                      onValueChange={setFilterDifficulty}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="Độ khó" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="Normal">🟢 Normal</SelectItem>
                        <SelectItem value="Hard">🟡 Hard</SelectItem>
                        <SelectItem value="Super Hard">
                          🔴 Super Hard
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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
          <Card>
            <CardContent>
              {filteredAndSortedLevels.map((savedLevel) => {
                const stats = getLevelStats(savedLevel.level);
                return (
                  <Card
                    key={savedLevel.id}
                    className="hover:shadow-lg transition-shadow mt-4 border-2 border-indigo-200"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Checkbox */}
                        <div className="flex-shrink-0 pt-1">
                          <input
                            type="checkbox"
                            checked={selectedLevels.has(savedLevel.id)}
                            onChange={() => toggleSelectLevel(savedLevel.id)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                        </div>

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
                              {savedLevel.level.board
                                .flat()
                                .map((cell, index) => (
                                  <div
                                    key={index}
                                    className="rounded-sm border border-gray-100"
                                    style={{
                                      backgroundColor:
                                        cell.type === "block"
                                          ? cell.color
                                            ? savedLevel.level.config
                                                .colorMapping[cell.color] ||
                                              "#f3f4f6"
                                            : "#e5e7eb"
                                          : "#f9fafb",
                                      fontSize: "6px",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    {cell.element === "Pipe" &&
                                      getPipeIcon(cell.pipeDirection || "up")}
                                    {cell.element &&
                                      cell.element !== "Pipe" &&
                                      getElementIcon(cell.element)}
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
                                      if (e.key === "Escape")
                                        handleCancelRename();
                                    }}
                                    autoFocus
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleSaveRename(savedLevel.id)
                                    }
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
                                <span>
                                  Tạo: {formatDate(savedLevel.createdAt)}
                                </span>
                                {savedLevel.updatedAt !==
                                  savedLevel.createdAt && (
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
                            <Badge
                              variant="outline"
                              className={`text-xs text-white ${getDifficultyColor(
                                savedLevel.level.config.difficulty
                              )}`}
                            >
                              {savedLevel.level.config.difficulty}
                            </Badge>
                            {Object.entries(stats.elements).map(
                              ([elementType, count]) => {
                                return (
                                  <Badge
                                    key={elementType}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {getElementIcon(elementType)} {count}{" "}
                                    {elementType}
                                  </Badge>
                                );
                              }
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
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
                                        .map((cell, index) => {
                                          return (
                                            <div
                                              key={index}
                                              className="rounded text-3xl border border-gray-200 flex items-center justify-center"
                                              style={{
                                                backgroundColor:
                                                  cell.type === "block"
                                                    ? cell.color
                                                      ? savedLevel.level.config
                                                          .colorMapping[
                                                          cell.color
                                                        ] || "#f3f4f6"
                                                      : ""
                                                    : "#f9fafb",
                                              }}
                                            >
                                              {elementGenerate(cell)}
                                            </div>
                                          );
                                        })}
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
                                      <span className="font-medium">
                                        Màu sắc:
                                      </span>
                                      <div>{stats.colorCount} màu</div>
                                    </div>
                                    {Object.entries(stats.elements).map(
                                      ([elementType, count]) => (
                                        <div key={elementType}>
                                          <span className="font-medium">
                                            {elementType}:
                                          </span>
                                          <div>{count}</div>
                                        </div>
                                      )
                                    )}
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
                                onClick={() => {
                                  console.log("savedLevel", savedLevel);
                                  return onEditLevel(savedLevel.level);
                                }}
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

                            <AlertDialogUI
                              title="Xóa level này?"
                              description={savedLevel.name}
                              onConfirm={() => deleteLevel(savedLevel.id)}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Download Confirmation Dialog */}
      <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-blue-600" />
              Xác nhận tải file
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Bạn đang chuẩn bị tải{" "}
              <span className="font-semibold text-blue-600">
                {selectedLevels.size} file {downloadFormat.toUpperCase()}
              </span>
              . Quá trình này có thể mất vài giây.
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <span className="text-amber-600">⚠️</span>
                <div className="text-sm text-amber-700">
                  <div className="font-medium">Lưu ý:</div>
                  <ul className="mt-1 space-y-1 text-xs">
                    <li>• Mỗi level sẽ được tải thành file riêng biệt</li>
                    <li>• Trình duyệt có thể hỏi xác nhận tải nhiều file</li>
                    <li>• Vui lòng không đóng trang trong quá trình tải</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDownloadDialog(false)}
              >
                Hủy
              </Button>
              <Button
                onClick={confirmDownload}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="w-4 h-4 mr-1" />
                Tải ngay
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
