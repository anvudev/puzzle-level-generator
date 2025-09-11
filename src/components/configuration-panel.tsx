"use client";

import { BasicConfigSection } from "./settings/basic-config-section";
import { ColorSelectionSection } from "./settings/color-selection-section";
import { ElementsSection } from "./settings/elements-section";
import type { LevelConfig } from "@/config/game-types";

interface ConfigurationPanelProps {
  config: LevelConfig;
  setConfig: (config: LevelConfig) => void;
}

export function ConfigurationPanel({
  config,
  setConfig,
}: ConfigurationPanelProps) {
  const updateConfig = (updates: Partial<LevelConfig>) => {
    setConfig({ ...config, ...updates });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <BasicConfigSection config={config} updateConfig={updateConfig} />
      <ColorSelectionSection config={config} updateConfig={updateConfig} />
      <ElementsSection config={config} updateConfig={updateConfig} />
    </div>
  );
}
