"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LevelInfoCard } from "./preview/level-info-card";
import { BoardPreview } from "./preview/board-preview";
import { LevelValidator } from "./preview/level-validator";
// import { LevelActions } from "./preview/level-actions";
import type { GeneratedLevel } from "@/config/game-types";
import { GAME_COLORS, ELEMENT_TYPES } from "@/config/game-constants";
import { getElementIcon } from "@/lib/utils/level-utils";

interface LevelPreviewProps {
  level: GeneratedLevel;
  onLevelUpdate?: (updatedLevel: GeneratedLevel) => void;
  onRegenerate?: () => void;
  onSave?: (level: GeneratedLevel) => void;
}

export function LevelPreview({ level, onLevelUpdate }: LevelPreviewProps) {
  // Debug pipe info
  console.log("[DEBUG UI] level.pipeInfo:", level.pipeInfo);
  console.log("[DEBUG UI] pipeInfo exists:", !!level.pipeInfo);
  console.log("[DEBUG UI] pipeInfo length:", level.pipeInfo?.length || 0);

  return (
    <div className="space-y-6">
      <LevelInfoCard level={level} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BoardPreview level={level} onLevelUpdate={onLevelUpdate} />

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Level Actions */}
          {/* <LevelActions
            level={level}
            onRegenerate={onRegenerate}
            onSave={onSave}
          /> */}

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
                          GAME_COLORS[colorName as keyof typeof GAME_COLORS],
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

          {/* Pipe Contents - Always show for debugging */}
          <Card>
            <CardHeader>
              <CardTitle>
                Nội dung Pipe ({level.pipeInfo?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {level.pipeInfo && level.pipeInfo.length > 0 ? (
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
                              {pipe.direction === "up" && "↑"}
                              {pipe.direction === "down" && "↓"}
                              {pipe.direction === "left" && "←"}
                              {pipe.direction === "right" && "→"}
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
                                GAME_COLORS[color as keyof typeof GAME_COLORS],
                            }}
                            title={`${color} (${index + 1})`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground"></div>
              )}
            </CardContent>
          </Card>

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
