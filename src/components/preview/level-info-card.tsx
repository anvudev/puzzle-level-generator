"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GeneratedLevel } from "@/config/game-types";
import { getDifficultyColor } from "@/lib/utils/level-utils";

interface LevelInfoCardProps {
  level: GeneratedLevel;
}

export function LevelInfoCard({ level }: LevelInfoCardProps) {
  // Calculate actual blocks on board (excluding pipe contents)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Thông tin Level</CardTitle>
          <div className="flex items-center gap-2">
            {/*   */}
            <Badge variant="outline">ID: {level.id}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              {level.config.width}x{level.config.height}
            </p>
            <p className="text-sm text-muted-foreground">Kích thước</p>
          </div>
          <div className="text-center">
            <div className="space-y-1">
              <p className="text-2xl font-bold text-primary">
                {level.config.blockCount}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">Block</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              {level.config.colorCount}
            </p>
            <p className="text-sm text-muted-foreground">Số màu</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              {level.difficultyScore}
            </p>
            <p className="text-sm text-muted-foreground">Điểm khó</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Độ khó:</span>
            <Badge className={getDifficultyColor(level.config.difficulty)}>
              {level.config.difficulty}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
