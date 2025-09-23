"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Palette } from "lucide-react";
import { COLOR_MAPPING } from "@/config/game-constants";
import type { LevelConfig } from "@/config/game-types";

interface ColorSelectionSectionProps {
  config: LevelConfig;
  updateConfig: (updates: Partial<LevelConfig>) => void;
}

export function ColorSelectionSection({
  config,
  updateConfig,
}: ColorSelectionSectionProps) {
  const toggleColor = (colorKey: string) => {
    const selectedColors = config.selectedColors.includes(colorKey)
      ? config.selectedColors.filter((c) => c !== colorKey)
      : [...config.selectedColors, colorKey];

    // Update both selectedColors and colorMapping
    const newColorMapping = { ...config.colorMapping };
    if (selectedColors.includes(colorKey)) {
      newColorMapping[colorKey] =
        COLOR_MAPPING[colorKey as keyof typeof COLOR_MAPPING];
    } else {
      delete newColorMapping[colorKey];
    }

    updateConfig({
      selectedColors,
      colorMapping: newColorMapping,
      colorCount: selectedColors.length,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Chọn màu ({config.selectedColors.length} màu)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(COLOR_MAPPING).map(([colorKey, colorHex]) => (
            <div
              key={colorKey}
              className={`relative p-3 rounded-lg border-2 cursor-pointer transition-all ${
                config.selectedColors.includes(colorKey)
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border hover:border-accent/50 bg-card text-card-foreground"
              }`}
              onClick={() => toggleColor(colorKey)}
            >
              <div
                className="w-full h-8 rounded-md mb-2"
                style={{ backgroundColor: colorHex }}
              />
              <p className="text-xs font-medium text-center">{colorKey}</p>
              <p className="text-xs text-center opacity-80">{colorHex}</p>
              {config.selectedColors.includes(colorKey) && (
                <div className="absolute top-1 right-1 w-4 h-4 bg-accent-foreground rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-accent rounded-full" />
                </div>
              )}
            </div>
          ))}
        </div>
        {config.selectedColors.length < 2 && (
          <p className="text-sm text-destructive mt-2">
            Cần chọn ít nhất 2 màu
          </p>
        )}
      </CardContent>
    </Card>
  );
}
