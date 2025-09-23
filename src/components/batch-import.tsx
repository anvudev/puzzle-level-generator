"use client";

import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  RefreshCw,
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
// import { GAME_COLORS } from "@/config/game-constants";
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
import { GenerateBoard, GenerateBoardSmall } from "@/lib/utils/boardGenerate";
import { REALM } from "@/config/game-constants";
import {
  kvSet,
  kvDel,
  kvDelAll,
  kvGetAll,
  kvCreate,
  kvUpdateImportConfig,
} from "@/app/api/clients";

interface BatchImportProps {
  onSaveLevel?: (level: GeneratedLevel, name?: string) => string;
  onEditLevel?: (level: GeneratedLevel) => void;
}

// CSV constants and types are now imported from csv-utils and storage hook

export function BatchImport({ onSaveLevel, onEditLevel }: BatchImportProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [savedLevels, setSavedLevels] = useState<Set<string>>(new Set());
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { generateLevel } = useLevelGenerator();
  const {
    importedConfigs,
    addConfigs,
    updateConfig: updateStoredConfig,
    deleteConfig: deleteStoredConfig,
    clearAll: clearAllStored,
    getStats,
    setImportedConfigs,
  } = useBatchImportStorage();

  // Prevent data loss on unmount
  React.useEffect(() => {
    // Initial sync from remote storage if local is empty
    (async () => {
      if (importedConfigs.length === 0) {
        try {
          const remote = await kvGetAll(REALM.COLL_IMPORT);
          setImportedConfigs(remote);
        } catch {
          // ignore
        }
      }
    })();

    return () => {
      // Cleanup on unmount
    };
  }, [importedConfigs.length, addConfigs]);

  const validateFile = (file: File) => {
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      setUploadError("Vui lòng chọn file CSV hợp lệ");
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      setUploadError("File quá lớn. Vui lòng chọn file nhỏ hơn 5MB");
      return false;
    }
    return true;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);

    const file = event.dataTransfer.files[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const parseCSV = (csvText: string): ImportedLevelConfig[] => {
    const csvConfigs = parseCSVToConfigs(csvText);
    return csvConfigs.map((config, index) => ({
      ...config,
      id: `import-${Date.now()}-${index}`,
      status: "pending" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError(null);
    try {
      const csvText = await selectedFile.text();
      const configs = parseCSV(csvText);
      addConfigs(configs);
      // Persist each imported config remotely
      for (const cfg of configs) {
        kvCreate(REALM.COLL_IMPORT, cfg.id, cfg);
      }

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

    const level = await generateLevel(config);

    const updated = {
      status: "generated",
      generatedLevel: level,
      error: undefined,
    } as const;
    updateStoredConfig(configId, updated);
    kvUpdateImportConfig(REALM.COLL_IMPORT, configId, updated);
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
    if (!config || !onSaveLevel) return;

    onSaveLevel(config.generatedLevel!, config.name);

    // Mark as saved with visual feedback
    setSavedLevels((prev) => new Set(prev).add(configId));

    // Remove saved state after 2 seconds
    setTimeout(() => {
      setSavedLevels((prev) => {
        const newSet = new Set(prev);
        newSet.delete(configId);
        return newSet;
      });
    }, 2000);
  };

  const saveAllLevels = () => {
    const generatedConfigs = importedConfigs.filter(
      (c) => c.status === "generated" && c.generatedLevel
    );

    if (generatedConfigs.length === 0) return;

    setIsSavingAll(true);

    generatedConfigs.forEach((config) => {
      if (config.generatedLevel && onSaveLevel) {
        onSaveLevel(config.generatedLevel, config.name);

        // Mark as saved with visual feedback
        setSavedLevels((prev) => new Set(prev).add(config.id));
      }
    });

    // Remove all saved states after 2 seconds
    setTimeout(() => {
      setSavedLevels(new Set());
      setIsSavingAll(false);
    }, 2000);
  };

  const deleteConfig = (configId: string) => {
    deleteStoredConfig(configId);
    try {
      kvDel(REALM.COLL_IMPORT, configId);
    } catch {}
  };

  const clearAll = async () => {
    clearAllStored();
    try {
      await kvDelAll(REALM.COLL_IMPORT);
    } catch {}
    setUploadError(null);
    setSelectedFile(null);

    setTimeout(() => {
      setSavedLevels(new Set());
      setIsSavingAll(false);
      setIsDragOver(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }, 500);
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
          {/* Enhanced File Upload Area */}
          <div className="space-y-4">
            {/* Drag & Drop Zone */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 ${
                isDragOver
                  ? "border-purple-500 bg-purple-50 scale-[1.02]"
                  : selectedFile
                  ? "border-green-400 bg-green-50"
                  : "border-gray-300 bg-gray-50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleClickUpload}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="space-y-4">
                {/* Icon */}
                <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-indigo-100">
                  {selectedFile ? (
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  ) : (
                    <Upload className="w-8 h-8 text-purple-600" />
                  )}
                </div>

                {/* Text */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedFile ? (
                      <span className="text-green-600">File đã chọn</span>
                    ) : isDragOver ? (
                      "Thả file vào đây"
                    ) : (
                      "Kéo thả file CSV hoặc click để chọn"
                    )}
                  </h3>

                  {selectedFile ? (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-700">
                        📄 {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Kích thước: {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Hỗ trợ file .csv, tối đa 5MB
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-center gap-3">
                  {!selectedFile ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClickUpload}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Chọn file
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpload();
                        }}
                        disabled={isUploading}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {isUploading ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Đang tải...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Tải lên
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          setUploadError(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                          }
                        }}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Hủy
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {uploadError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{uploadError}</span>
            </div>
          )}

          {/* CSV Format Info */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-blue-600" />
              <h4 className="font-medium text-blue-900">
                Hướng dẫn định dạng CSV
              </h4>
            </div>

            <details className="text-sm text-blue-600 mb-3 group">
              <summary className="cursor-pointer hover:text-blue-800 font-medium flex items-center gap-2 p-2 rounded hover:bg-blue-100 transition-colors">
                <span className="transform transition-transform group-open:rotate-90">
                  ▶
                </span>
                Xem chi tiết định dạng CSV
              </summary>
              <div className="mt-2 text-blue-700 animate-in slide-in-from-top-2 duration-200">
                <pre className="whitespace-pre-wrap bg-white p-3 border rounded text-xs shadow-sm">
                  {CSV_FORMAT_DOCUMENTATION}
                </pre>
              </div>
            </details>

            <details className="text-sm text-blue-600 group">
              <summary className="cursor-pointer hover:text-blue-800 font-medium flex items-center gap-2 p-2 rounded hover:bg-blue-100 transition-colors">
                <span className="transform transition-transform group-open:rotate-90">
                  ▶
                </span>
                Xem ví dụ template
              </summary>
              <div className="mt-2 animate-in slide-in-from-top-2 duration-200">
                <pre className="p-3 bg-white border rounded text-xs overflow-x-auto shadow-sm">
                  {CSV_FORMAT_EXAMPLE}
                </pre>
              </div>
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
                <Button
                  onClick={saveAllLevels}
                  size="sm"
                  variant="outline"
                  className={
                    isSavingAll
                      ? "bg-green-600 hover:bg-green-700 text-white border-green-600"
                      : ""
                  }
                >
                  {isSavingAll ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Đã lưu tất cả
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Lưu tất cả
                    </>
                  )}
                </Button>

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
              {importedConfigs.map((config) => {
                return (
                  <Card
                    key={config.generatedLevel?.id || config.id}
                    className="border-2"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Thumbnail */}
                        <div className="flex-shrink-0">
                          <div className="w-24 h-24 border-2 border-gray-200 rounded-lg overflow-hidden bg-white flex items-center justify-center">
                            {config.status === "generated" &&
                            config.generatedLevel ? (
                              <GenerateBoardSmall
                                board={config.generatedLevel.board}
                                width={config.generatedLevel.config.width}
                                height={config.generatedLevel.config.height}
                                colorMapping={
                                  config.generatedLevel.config.colorMapping
                                }
                              />
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
                                {config.name ||
                                  config.generatedLevel?.config?.name}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  <Grid3X3 className="w-3 h-3 mr-1" />
                                  {config.generatedLevel?.config?.width ||
                                    config.width}
                                  x
                                  {config.generatedLevel?.config?.height ||
                                    config.height}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  <Palette className="w-3 h-3 mr-1" />
                                  {config.generatedLevel?.config?.selectedColors
                                    ?.length ||
                                    config.selectedColors?.length ||
                                    0}{" "}
                                  màu
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  🧩{" "}
                                  {config.generatedLevel?.config?.blockCount ||
                                    config.blockCount ||
                                    0}{" "}
                                  block
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {config.generatedLevel?.config?.difficulty ||
                                    config.difficulty ||
                                    "Normal"}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {config.generatedLevel?.config
                                    ?.generationMode === "symmetric"
                                    ? "🔄 Đối xứng"
                                    : "🎲 Ngẫu nhiên"}
                                </Badge>
                                {(config.pipeCount ||
                                  config.generatedLevel?.pipeInfo?.length ||
                                  0) > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    ⬆️{" "}
                                    {config.generatedLevel?.pipeInfo?.length ||
                                      config.pipeCount ||
                                      0}{" "}
                                    pipe
                                  </Badge>
                                )}
                                {(config.elements?.["Barrel"] ||
                                  config.generatedLevel?.config?.elements?.[
                                    "Barrel"
                                  ] ||
                                  0) > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    📦 {config.elements?.["Barrel"]} barrel
                                  </Badge>
                                )}
                                {(config.elements?.["IceBlock"] ||
                                  config.generatedLevel?.config?.elements?.[
                                    "IceBlock"
                                  ] ||
                                  0) > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    🧊 {config.elements?.["IceBlock"]} ice
                                  </Badge>
                                )}
                                {(config.elements?.["BlockLock"] ||
                                  config.generatedLevel?.config?.elements?.[
                                    "BlockLock"
                                  ] ||
                                  config.elements?.["Block Lock"] ||
                                  0) > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    🔒{" "}
                                    {config.elements?.["BlockLock"] ||
                                      config.generatedLevel?.config?.elements?.[
                                        "BlockLock"
                                      ] ||
                                      config.elements?.["Block Lock"]}{" "}
                                    lock
                                  </Badge>
                                )}
                                {(config.elements?.["PullPin"] ||
                                  config.generatedLevel?.config?.elements?.[
                                    "PullPin"
                                  ] ||
                                  0) > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    🔱 {config.elements?.["PullPin"]} pull pin
                                  </Badge>
                                )}
                                {(config.elements?.["Bomb"] ||
                                  config.generatedLevel?.config?.elements?.[
                                    "Bomb"
                                  ] ||
                                  0) > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    💣 {config.elements?.["Bomb"]} bomb
                                  </Badge>
                                )}
                                {(config.elements?.["Moving"] ||
                                  config.generatedLevel?.config?.elements?.[
                                    "Moving"
                                  ] ||
                                  0) > 0 && (
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
                          {/* {config.error && (
                          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                            {config.error}
                          </div>
                        )} */}

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {config.status === "pending" ||
                            config.status === "error" ? (
                              <Button
                                size="sm"
                                onClick={() =>
                                  generateLevelForConfig(config.id)
                                }
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
                                        <GenerateBoard
                                          board={config.generatedLevel.board}
                                          width={
                                            config.generatedLevel.config.width
                                          }
                                          height={
                                            config.generatedLevel.config.height
                                          }
                                          colorMapping={
                                            config.generatedLevel.config
                                              .colorMapping
                                          }
                                        />
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
                                  className={
                                    savedLevels.has(config.id)
                                      ? "bg-green-600 hover:bg-green-700 text-white"
                                      : ""
                                  }
                                >
                                  {savedLevels.has(config.id) ? (
                                    <>
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      Đã lưu
                                    </>
                                  ) : (
                                    <>
                                      <Save className="w-4 h-4 mr-1" />
                                      Lưu
                                    </>
                                  )}
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
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
