"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GeneratedLevel } from "@/config/game-types";
import { GAME_COLORS, ELEMENT_TYPES } from "@/config/game-constants";
import { getElementIcon } from "@/lib/utils/level-utils";
import { LevelInfoCard } from "./preview/level-info-card";
import { BoardPreview } from "./preview/board-preview";

interface LevelPreviewProps {
  level: GeneratedLevel;
}

export function LevelPreview({ level }: LevelPreviewProps) {
  return (
    <div className="space-y-6">
      <LevelInfoCard level={level} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BoardPreview level={level} />

        {/* Colors and Elements */}
        <div className="space-y-4">
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
