"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, CheckCircle } from "lucide-react";
import React from "react";
import { LevelInfoCard } from "./preview/level-info-card";
import { BoardPreview } from "./preview/board-preview";
import { LevelValidator } from "./preview/level-validator";
import { LevelActions } from "./preview/level-actions";
import { ColorBarChart } from "@/components/preview/color-bar-chart";
import type { GeneratedLevel } from "@/config/game-types";
import { ELEMENT_TYPES } from "@/config/game-constants";
import { getElementIcon } from "@/lib/utils/level-utils";
import { updateHistory } from "@/app/api/services/historiesService";

interface LevelPreviewProps {
  level: GeneratedLevel;
  onLevelUpdate?: (updatedLevel: GeneratedLevel) => void;
  onRegenerate?: () => void;
  onSave?: (level: GeneratedLevel, name?: string) => string | Promise<string>;
  onReFill?: () => void;
  isEditMode?: boolean; // New prop to indicate if this is editing an existing level
  onEditModeChange?: (isEditMode: boolean) => void; // Callback to reset edit mode
  editingSavedLevelId?: string; // ID of the saved level being edited
}

export function LevelPreview({
  level,
  onLevelUpdate,
  onRegenerate,
  onSave,
  onReFill,
  isEditMode = false,
  onEditModeChange,
  editingSavedLevelId,
}: LevelPreviewProps) {
  const [saveName, setSaveName] = React.useState("");
  const [showSaveInput, setShowSaveInput] = React.useState(false);
  const [isSaved, setIsSaved] = React.useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = React.useState(false);
  console.log("level", level);
  console.log("level.config.name", level.config.name);
  // Track level changes to reset save state
  const levelIdRef = React.useRef<string | null>(null);
  const currentLevelId = React.useMemo(() => {
    // Create a simple hash of the level to detect changes
    return JSON.stringify({
      board: level.board,
      config: level.config,
      timestamp: level.timestamp,
    });
  }, [level]);

  // Reset save state when level changes
  React.useEffect(() => {
    if (levelIdRef.current !== currentLevelId) {
      setIsSaved(false);
      setShowSuccessMessage(false);
      setShowSaveInput(false);
      setSaveName("");
      levelIdRef.current = currentLevelId;
    }
  }, [currentLevelId]);

  const handleSave = async () => {
    if (onSave && !isSaved) {
      const name = saveName.trim() || `Level ${new Date().toLocaleString()}`;

      // Handle both sync and async onSave
      const result = onSave(level, name);
      if (result instanceof Promise) {
        await result;
      }

      // Update save state
      setIsSaved(true);
      setSaveName("");
      setShowSaveInput(false);

      // Show success message
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    }
  };
  return (
    <div className="space-y-6">
      {/* Compact Save Level Section */}
      {onSave && (
        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
          {/* Success Message */}
          {showSuccessMessage && (
            <div className="flex items-center gap-2 text-green-700 font-medium animate-in fade-in-0 slide-in-from-left-2 duration-300">
              <div className="flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full border border-green-300">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">
                  {isEditMode
                    ? "Đã cập nhật thành công!"
                    : "Đã lưu thành công!"}
                </span>
              </div>
            </div>
          )}

          {/* Save Input Mode */}
          {showSaveInput && !isSaved && (
            <div className="flex items-center gap-2 flex-1">
              <Input
                placeholder="Tên level (tùy chọn)"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") setShowSaveInput(false);
                }}
                className="h-8 text-sm"
              />
              <Button onClick={handleSave} size="sm" className="h-8">
                <Save className="w-3 h-3 mr-1" />
                Lưu
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSaveInput(false)}
                size="sm"
                className="h-8"
              >
                Hủy
              </Button>
            </div>
          )}

          {/* Save Button Mode */}
          {!showSaveInput && !showSuccessMessage && (
            <div className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-2 text-green-700">
                <Save className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {isEditMode ? `Cập nhật: ${level.config.name}` : "Lưu Level"}
                </span>
              </div>
              <div className="flex-1"></div>
              <Button
                onClick={() => {
                  if (isEditMode) {
                    // Update existing level with saved level ID context
                    if (editingSavedLevelId) {
                      updateHistory(editingSavedLevelId, level);
                      console.log("editingSavedLevelId", level.config.name);
                    } else {
                      updateHistory(level.id, level);
                      console.log("not editingSavedLevelId", level.config.name);
                    }

                    // Show success feedback
                    setIsSaved(true);
                    setShowSuccessMessage(true);
                    setTimeout(() => {
                      setShowSuccessMessage(false);
                      setIsSaved(false); // Reset after showing message
                      onEditModeChange?.(false); // Reset edit mode after successful update
                    }, 3000);
                  } else {
                    // New level - show save input
                    setShowSaveInput(true);
                  }
                }}
                size="sm"
                className={`h-8 ${
                  isSaved
                    ? "bg-green-100 text-green-700 border-green-300 hover:bg-green-100"
                    : ""
                }`}
                disabled={isSaved}
                variant={isSaved ? "outline" : "default"}
              >
                {isSaved ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Đã lưu
                  </>
                ) : (
                  <>
                    <Save className="w-3 h-3 mr-1" />
                    {isEditMode ? "Cập nhật" : "Lưu"}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      <LevelInfoCard level={level} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <BoardPreview level={level} onLevelUpdate={onLevelUpdate} />

          {/* Color Bar Chart */}
          <ColorBarChart level={level} />

          {/* Pipe Contents */}
          {level.pipeInfo && level.pipeInfo.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Nội dung Pipe ({level.pipeInfo?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {level.pipeInfo && level.pipeInfo.length > 0 && (
                  <div className="space-y-3">
                    {level.pipeInfo.map((pipe) => (
                      <div key={pipe.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {pipe.id.toUpperCase()}
                            </span>
                            <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md">
                              <span className="text-sm font-bold text-blue-600">
                                {pipe.direction === "up" && "⬆️"}
                                {pipe.direction === "down" && "⬇️"}
                                {pipe.direction === "left" && "⬅️"}
                                {pipe.direction === "right" && "➡️"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {pipe.direction === "up" && "UP"}
                                {pipe.direction === "down" && "DOWN"}
                                {pipe.direction === "left" && "LEFT"}
                                {pipe.direction === "right" && "RIGHT"}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            ({pipe.position.x}, {pipe.position.y})
                          </span>
                        </div>
                        <div className="grid grid-cols-8 gap-1">
                          {pipe.contents.map((color, index) => (
                            <div
                              key={index}
                              className="w-4 h-4 rounded border border-border"
                              style={{
                                backgroundColor:
                                  level.config.colorMapping[color] || "#f3f4f6",
                              }}
                              title={`${color} (${index + 1})`}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {/* Moving Contents */}
          {level.movingInfo && level.movingInfo.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Nội dung Moving ({level.pipeInfo?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {level.movingInfo && level.movingInfo.length > 0 && (
                  <div className="space-y-3">
                    {level.movingInfo.map((moving) => (
                      <div key={moving.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {moving.id.toUpperCase()}
                            </span>
                            <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md">
                              <span className="text-sm font-bold text-blue-600">
                                {moving.direction === "up" && "⬆️"}
                                {moving.direction === "down" && "⬇️"}
                                {moving.direction === "left" && "⬅️"}
                                {moving.direction === "right" && "➡️"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {moving.direction === "up" && "UP"}
                                {moving.direction === "down" && "DOWN"}
                                {moving.direction === "left" && "LEFT"}
                                {moving.direction === "right" && "RIGHT"}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            ({moving.position.x}, {moving.position.y})
                          </span>
                        </div>
                        <div className="grid grid-cols-8 gap-1">
                          {moving.contents.map((color, index) => (
                            <div
                              key={index}
                              className="w-4 h-4 rounded border border-border"
                              style={{
                                backgroundColor:
                                  level.config.colorMapping[color] || "#f3f4f6",
                              }}
                              title={`${color} (${index + 1})`}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Level Actions */}
          <LevelActions
            level={level}
            onRegenerate={onRegenerate}
            onReFill={onReFill}
          />

          {/* Level Validator */}
          <LevelValidator level={level} />

          {/* Colors and Elements */}
          {/* Selected Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Màu sử dụng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {level.config.selectedColors.map((colorName) => (
                  <div key={colorName} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded border border-border"
                      style={{
                        backgroundColor:
                          level.config.colorMapping[colorName] || "#f3f4f6",
                      }}
                    />
                    <span className="text-sm">{colorName}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Special Elements */}
          {Object.keys(level.config.elements).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Element đặc biệt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(level.config.elements).map(
                    ([elementType, count]) => {
                      const element =
                        ELEMENT_TYPES[
                          elementType as keyof typeof ELEMENT_TYPES
                        ];
                      return (
                        <div
                          key={elementType}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span>{getElementIcon(elementType)}</span>
                            <span className="text-sm">{element?.name}</span>
                          </div>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      );
                    }
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Containers */}
          <Card>
            <CardHeader>
              <CardTitle>Container ({level.containers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {level.containers.map((container, index) => (
                  <div
                    key={container.id}
                    className="p-2 bg-muted rounded text-center"
                  >
                    <p className="text-sm font-medium">Container {index + 1}</p>
                    <p className="text-xs text-muted-foreground">
                      {container.slots} slots
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
