"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Grid3X3, Ruler, Hash, Shuffle, Target } from "lucide-react";
import { DIFFICULTY_LEVELS } from "@/config/game-constants";
import type { LevelConfig } from "@/config/game-types";

interface BasicConfigSectionProps {
  config: LevelConfig;
  updateConfig: (updates: Partial<LevelConfig>) => void;
}

export function BasicConfigSection({
  config,
  updateConfig,
}: BasicConfigSectionProps) {
  return (
    <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 bg-orange-100 rounded-full">
            <Grid3X3 className="w-5 h-5 text-orange-600" />
          </div>
          <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent font-bold">
            Cấu hình cơ bản
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label
              htmlFor="width"
              className="flex items-center gap-2 text-sm font-semibold text-orange-700"
            >
              <Ruler className="w-4 h-4" />
              Chiều rộng (W)
            </Label>
            <Input
              id="width"
              type="number"
              min="3"
              max="15"
              value={config.width}
              onChange={(e) =>
                updateConfig({ width: Number.parseInt(e.target.value) || 9 })
              }
              className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 bg-white/80 text-lg font-medium"
            />
          </div>
          <div className="space-y-3">
            <Label
              htmlFor="height"
              className="flex items-center gap-2 text-sm font-semibold text-orange-700"
            >
              <Ruler className="w-4 h-4" />
              Chiều cao (H)
            </Label>
            <Input
              id="height"
              type="number"
              min="3"
              max="15"
              value={config.height}
              onChange={(e) =>
                updateConfig({ height: Number.parseInt(e.target.value) || 10 })
              }
              className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 bg-white/80 text-lg font-medium"
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label
            htmlFor="blockCount"
            className="flex items-center gap-2 text-sm font-semibold text-orange-700"
          >
            <Hash className="w-4 h-4" />
            Số lượng block (chia hết cho 3)
          </Label>
          <Input
            id="blockCount"
            type="number"
            min="3"
            step="3"
            value={config.blockCount}
            onChange={(e) => {
              const value = Number.parseInt(e.target.value) || 27;
              const adjusted = Math.ceil(value / 3) * 3;
              updateConfig({ blockCount: adjusted });
            }}
            className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 bg-white/80 text-lg font-medium"
          />
          <p className="text-xs text-orange-600 bg-orange-100 px-3 py-1 rounded-full inline-block">
            Tự động điều chỉnh để chia hết cho 3
          </p>
        </div>

        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-semibold text-orange-700">
            <Shuffle className="w-4 h-4" />
            Chế độ tạo hình
          </Label>
          <Select
            value={config.generationMode}
            onValueChange={(value: "random" | "symmetric") =>
              updateConfig({ generationMode: value })
            }
          >
            <SelectTrigger className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 bg-white/80 text-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="random">Ngẫu nhiên</SelectItem>
              <SelectItem value="symmetric">Đối xứng</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-semibold text-orange-700">
            <Target className="w-4 h-4" />
            Độ khó
          </Label>
          <Select
            value={config.difficulty}
            onValueChange={(value: "Normal" | "Hard" | "Super Hard") =>
              updateConfig({ difficulty: value })
            }
          >
            <SelectTrigger className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 bg-white/80 text-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTY_LEVELS.map((level) => (
                <SelectItem key={level} value={level}>
                  {level === "Normal" && "😊"} {level === "Hard" && "😤"}{" "}
                  {level === "Super Hard" && "🔥"} {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
