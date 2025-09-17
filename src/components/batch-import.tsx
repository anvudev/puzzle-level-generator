"use client";

import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Upload,
  FileText,
  Download,
  Trash2,
  Save,
  Eye,
  Edit3,
  AlertCircle,
  CheckCircle,
  X,
  Grid3X3,
  Palette,
  Zap,
} from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { GeneratedLevel } from "@/config/game-types";
import { GAME_COLORS } from "@/config/game-constants";
import { useLevelGenerator } from "@/lib/hooks/use-level-generator";
import {
  parseCSVToConfigs,
  downloadCSVTemplate,
  CSV_FORMAT_EXAMPLE,
  CSV_FORMAT_DOCUMENTATION,
} from "@/lib/utils/csv-utils";
import {
  useBatchImportStorage,
  type ImportedLevelConfig,
} from "@/lib/hooks/use-batch-import-storage";
import { getElementIcon, getPipeIcon } from "@/lib/utils/level-utils";

interface BatchImportProps {
  onSaveLevel?: (level: GeneratedLevel, name?: string) => string;
  onEditLevel?: (level: GeneratedLevel) => void;
}

// CSV constants and types are now imported from csv-utils and storage hook

export function BatchImport({ onSaveLevel, onEditLevel }: BatchImportProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { generateLevel } = useLevelGenerator();
  const {
    importedConfigs,
    addConfigs,
    updateConfig: updateStoredConfig,
    deleteConfig: deleteStoredConfig,
    clearAll: clearAllStored,
    getStats,
  } = useBatchImportStorage();

  // Debug localStorage state
  console.log(
    "🔍 BatchImport render - importedConfigs:",
    importedConfigs.length
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
        setUploadError("Vui lòng chọn file CSV hợp lệ");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        setUploadError("File quá lớn. Vui lòng chọn file nhỏ hơn 5MB");
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  const parseCSV = (csvText: string): ImportedLevelConfig[] => {
    const csvConfigs = parseCSVToConfigs(csvText);
    return csvConfigs.map((config, index) => ({
      ...config,
      id: `import-${Date.now()}-${index}`,
      status: "pending" as const,
    }));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const csvText = await selectedFile.text();
      console.log("📄 CSV text:", csvText.substring(0, 200) + "...");

      const configs = parseCSV(csvText);
      console.log("📋 Parsed configs:", configs);

      addConfigs(configs);
      console.log("💾 Added to storage, total configs:", configs.length);

      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("❌ Upload error:", error);
      setUploadError(
        error instanceof Error ? error.message : "Lỗi không xác định"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const generateLevelForConfig = async (configId: string) => {
    const config = importedConfigs.find((c) => c.id === configId);
    if (!config) return;

    console.log("🔧 Generating level for config:", config);
    updateStoredConfig(configId, { status: "generating" });

    try {
      const level = await generateLevel(config);
      console.log("✅ Generated level:", level);
      console.log(
        "🎨 Board colors sample:",
        level.board
          .flat()
          .slice(0, 10)
          .map((c) => ({ type: c.type, color: c.color }))
      );

      updateStoredConfig(configId, {
        status: "generated",
        generatedLevel: level,
        error: undefined,
      });
    } catch (error) {
      console.error("❌ Error generating level:", error);
      updateStoredConfig(configId, {
        status: "error",
        error: error instanceof Error ? error.message : "Lỗi tạo level",
      });
    }
  };

  const generateAllLevels = async () => {
    const pendingConfigs = importedConfigs.filter(
      (c) => c.status === "pending" || c.status === "error"
    );
    for (const config of pendingConfigs) {
      await generateLevelForConfig(config.id);
      // Add small delay to prevent overwhelming the system
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  };

  const saveLevel = (configId: string) => {
    const config = importedConfigs.find((c) => c.id === configId);
    if (!config?.generatedLevel || !onSaveLevel) return;

    onSaveLevel(config.generatedLevel, config.name);
  };

  const saveAllLevels = () => {
    const generatedConfigs = importedConfigs.filter(
      (c) => c.status === "generated" && c.generatedLevel
    );
    generatedConfigs.forEach((config) => {
      if (config.generatedLevel && onSaveLevel) {
        onSaveLevel(config.generatedLevel, config.name);
      }
    });
  };

  const deleteConfig = (configId: string) => {
    deleteStoredConfig(configId);
  };

  const clearAll = () => {
    console.log("🗑️ Clearing all batch import data");
    clearAllStored();
    setUploadError(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDownloadTemplate = () => {
    downloadCSVTemplate();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <Upload className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-xl bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent font-bold">
                  Nhập hàng loạt
                </CardTitle>
                <p className="text-sm text-purple-600 mt-1">
                  Tải lên file CSV để tạo nhiều level cùng lúc
                </p>
              </div>
            </div>
            <Button
              onClick={handleDownloadTemplate}
              variant="outline"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Tải template CSV
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Tải lên file CSV
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="flex-1"
            />
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="min-w-[100px]"
            >
              {isUploading ? "Đang tải..." : "Tải lên"}
            </Button>
          </div>

          {uploadError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{uploadError}</span>
            </div>
          )}

          {/* CSV Format Info */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Định dạng CSV:</h4>
            <div className="text-sm text-blue-700 mb-2">
              <pre className="whitespace-pre-wrap">
                {CSV_FORMAT_DOCUMENTATION}
              </pre>
            </div>
            <details className="text-sm text-blue-600">
              <summary className="cursor-pointer hover:text-blue-800">
                Xem ví dụ template
              </summary>
              <pre className="mt-2 p-2 bg-white border rounded text-xs overflow-x-auto">
                {CSV_FORMAT_EXAMPLE}
              </pre>
            </details>
          </div>
        </CardContent>
      </Card>

      {/* Imported Levels Preview */}
      {importedConfigs.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Grid3X3 className="w-5 h-5" />
                Levels đã nhập ({getStats().total})
                {getStats().total > 0 && (
                  <div className="flex items-center gap-1 ml-2">
                    <Badge
                      variant="outline"
                      className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300"
                    >
                      {getStats().pending} chờ
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-xs bg-blue-50 text-blue-700 border-blue-300"
                    >
                      {getStats().generating} đang tạo
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-xs bg-green-50 text-green-700 border-green-300"
                    >
                      {getStats().generated} hoàn thành
                    </Badge>
                    {getStats().error > 0 && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-red-50 text-red-700 border-red-300"
                      >
                        {getStats().error} lỗi
                      </Badge>
                    )}
                  </div>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button onClick={generateAllLevels} size="sm">
                  <Zap className="w-4 h-4 mr-2" />
                  Tạo tất cả
                </Button>
                <Button onClick={saveAllLevels} size="sm" variant="outline">
                  <Save className="w-4 h-4 mr-2" />
                  Lưu tất cả
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-orange-600 hover:bg-orange-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear Cache
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Xóa cache localStorage?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Hành động này sẽ xóa tất cả dữ liệu batch import đã lưu
                        trong localStorage. Bạn sẽ mất tất cả levels đã import
                        và generated. Không thể hoàn tác.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={clearAll}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        Xóa Cache
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Xóa tất cả
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Xóa tất cả levels?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Hành động này sẽ xóa tất cả {importedConfigs.length}{" "}
                        level đã nhập. Bạn không thể hoàn tác sau khi xóa.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={clearAll}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Xóa tất cả
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {importedConfigs.map((config) => (
                <Card key={config.id} className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Thumbnail */}
                      <div className="flex-shrink-0">
                        <div className="w-24 h-24 border-2 border-gray-200 rounded-lg overflow-hidden bg-white flex items-center justify-center">
                          {config.status === "generated" &&
                          config.generatedLevel ? (
                            <div
                              className="w-full h-full grid gap-0.5 p-1"
                              style={{
                                gridTemplateColumns: `repeat(${config.generatedLevel.config.width}, 1fr)`,
                                gridTemplateRows: `repeat(${config.generatedLevel.config.height}, 1fr)`,
                              }}
                            >
                              {config.generatedLevel.board
                                .flat()
                                .map((cell, index) => (
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
                                    {cell.element === "Barrel" && "📦"}
                                    {cell.element === "IceBlock" && "🧊"}
                                    {cell.element === "BlockLock" && "🔒"}
                                    {cell.element === "Block Lock" && "🔒"}
                                    {cell.element === "Key" && "🗝️"}
                                    {cell.element === "Bomb" && "💣"}
                                    {cell.element === "Moving" && "🔄"}
                                  </div>
                                ))}
                            </div>
                          ) : config.status === "generating" ? (
                            <div className="text-blue-500 text-xs text-center">
                              <Zap className="w-6 h-6 mx-auto mb-1 animate-pulse" />
                              Đang tạo...
                            </div>
                          ) : config.status === "error" ? (
                            <div className="text-red-500 text-xs text-center">
                              <AlertCircle className="w-6 h-6 mx-auto mb-1" />
                              Lỗi
                            </div>
                          ) : (
                            <div className="text-gray-400 text-xs text-center">
                              <Grid3X3 className="w-6 h-6 mx-auto mb-1" />
                              Chưa tạo
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg truncate">
                              {config.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                <Grid3X3 className="w-3 h-3 mr-1" />
                                {config.width}×{config.height}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                <Palette className="w-3 h-3 mr-1" />
                                {config.selectedColors?.length || 0} màu
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                🧩 {config.blockCount || 0} block
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {config.difficulty || "Normal"}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {config.generationMode === "symmetric"
                                  ? "🔄 Đối xứng"
                                  : "🎲 Ngẫu nhiên"}
                              </Badge>
                              {(config.pipeCount || 0) > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  🔧 {config.pipeCount} pipe
                                </Badge>
                              )}
                              {(config.elements?.["Barrel"] || 0) > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  📦 {config.elements?.["Barrel"]} barrel
                                </Badge>
                              )}
                              {(config.elements?.["IceBlock"] || 0) > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  🧊 {config.elements?.["IceBlock"]} ice
                                </Badge>
                              )}
                              {(config.elements?.["BlockLock"] ||
                                config.elements?.["Block Lock"] ||
                                0) > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  🔒{" "}
                                  {config.elements?.["BlockLock"] ||
                                    config.elements?.["Block Lock"]}{" "}
                                  lock
                                </Badge>
                              )}
                              {(config.elements?.["PullPin"] || 0) > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  🔱 {config.elements?.["PullPin"]} pull pin
                                </Badge>
                              )}
                              {(config.elements?.["Bomb"] || 0) > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  💣 {config.elements?.["Bomb"]} bomb
                                </Badge>
                              )}
                              {(config.elements?.["Moving"] || 0) > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  🔄 {config.elements?.["Moving"]} moving
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {config.status === "pending" && (
                              <Badge
                                variant="outline"
                                className="text-yellow-600 border-yellow-300"
                              >
                                Chờ tạo
                              </Badge>
                            )}
                            {config.status === "generating" && (
                              <Badge
                                variant="outline"
                                className="text-blue-600 border-blue-300"
                              >
                                Đang tạo
                              </Badge>
                            )}
                            {config.status === "generated" && (
                              <Badge
                                variant="outline"
                                className="text-green-600 border-green-300"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Hoàn thành
                              </Badge>
                            )}
                            {config.status === "error" && (
                              <Badge
                                variant="outline"
                                className="text-red-600 border-red-300"
                              >
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Lỗi
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Error Message */}
                        {config.error && (
                          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                            {config.error}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {config.status === "pending" ||
                          config.status === "error" ? (
                            <Button
                              size="sm"
                              onClick={() => generateLevelForConfig(config.id)}
                            >
                              <Zap className="w-4 h-4 mr-1" />
                              Tạo level
                            </Button>
                          ) : config.status === "generated" &&
                            config.generatedLevel ? (
                            <>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    <Eye className="w-4 h-4 mr-1" />
                                    Xem
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>{config.name}</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="w-full max-w-md mx-auto border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
                                      <div
                                        className="w-full aspect-square grid gap-1 p-2"
                                        style={{
                                          gridTemplateColumns: `repeat(${config.generatedLevel.config.width}, 1fr)`,
                                          gridTemplateRows: `repeat(${config.generatedLevel.config.height}, 1fr)`,
                                        }}
                                      >
                                        {config.generatedLevel.board
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
                                  </div>
                                </DialogContent>
                              </Dialog>

                              {onEditLevel && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    onEditLevel(config.generatedLevel!)
                                  }
                                >
                                  <Edit3 className="w-4 h-4 mr-1" />
                                  Sửa
                                </Button>
                              )}

                              <Button
                                size="sm"
                                onClick={() => saveLevel(config.id)}
                              >
                                <Save className="w-4 h-4 mr-1" />
                                Lưu
                              </Button>
                            </>
                          ) : null}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteConfig(config.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Xóa
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
