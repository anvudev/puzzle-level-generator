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
  const pipeCount = level.config.elements.Pipe || 0;
  const blockLockCount =
    level.config.elements["BlockLock"] ||
    level.config.elements["Block Lock"] ||
    0;

  const pipeBlocks = pipeCount * 8; // Each pipe contains 8 blocks
  const lockBlocks = blockLockCount * 2; // Each Block Lock requires 2 blocks (1 Lock + 1 Key)
  const boardBlocks = level.config.blockCount - pipeBlocks - lockBlocks;

  console.log(
    `[DEBUG UI] Pipe count: ${pipeCount}, Pipe blocks: ${pipeBlocks}, Board blocks: ${boardBlocks}`
  );

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
              <p className="text-2xl font-bold text-primary">{boardBlocks}</p>
              {(pipeBlocks > 0 || lockBlocks > 0) && (
                <div className="space-y-0.5">
                  {pipeBlocks > 0 && (
                    <p className="text-xs text-blue-600">
                      +{pipeBlocks} trong pipe
                    </p>
                  )}
                  {lockBlocks > 0 && (
                    <p className="text-xs text-yellow-600">
                      +{lockBlocks} trong lock
                    </p>
                  )}
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">Block trên board</p>
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
            <span className="text-sm font-medium">Tổng blocks:</span>
            <Badge variant="outline">{level.config.blockCount}</Badge>
          </div>
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
