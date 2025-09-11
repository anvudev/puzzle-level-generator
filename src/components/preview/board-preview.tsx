"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GAME_COLORS } from "@/config/game-constants";
import type { GeneratedLevel } from "@/config/game-types";
import { getElementIcon } from "@/lib/utils/level-utils";

interface BoardPreviewProps {
  level: GeneratedLevel;
}

export function BoardPreview({ level }: BoardPreviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bảng game</CardTitle>
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
            {level.board.flat().map((cell, index) => (
              <div
                key={index}
                className="aspect-square rounded border border-border flex items-center justify-center text-xs font-bold relative"
                style={{
                  backgroundColor: cell.color
                    ? GAME_COLORS[cell.color as keyof typeof GAME_COLORS]
                    : "#f3f4f6",
                  color:
                    cell.color && ["Yellow", "White"].includes(cell.color)
                      ? "#000"
                      : "#fff",
                }}
              >
                {cell.element && (
                  <span className="absolute top-0 right-0 text-xs">
                    {getElementIcon(cell.element)}
                  </span>
                )}
                {cell.type === "empty" ? "" : cell.color?.charAt(0) || ""}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
