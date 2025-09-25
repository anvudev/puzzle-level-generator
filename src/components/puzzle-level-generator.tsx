"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download,
  RefreshCw,
  Settings,
  Grid3X3,
  Sparkles,
  History,
  Upload,
} from "lucide-react";
import { LevelPreview } from "./level-preview";
import { ConfigurationPanel } from "./configuration-panel";
import { ExportPanel } from "./export-panel";
import { LevelHistory } from "./level-history";
import { BatchImport } from "./batch-import";
import { DEFAULT_CONFIG } from "@/config/game-constants";
import { useLevelGenerator } from "@/lib/hooks/use-level-generator";
import { useLevelHistory } from "@/lib/hooks/use-level-history";
import { refillLevel } from "@/lib/utils/level-utils";
import type { LevelConfig, GeneratedLevel } from "@/config/game-types";
import { Header } from "./header/header";
import { BlankPreview } from "./preview/blankPreview";

export function PuzzleLevelGenerator() {
  const [config, setConfig] = useState<LevelConfig>(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState("config");
  const [isEditMode, setIsEditMode] = useState(false);
  const tabContents = [
    {
      icon: <Settings className="w-4 h-4" />,
      title: "Cấu hình",
      value: "config",
    },
    {
      icon: <Grid3X3 className="w-4 h-4" />,
      title: "Xem trước",
      value: "preview",
    },
    {
      icon: <History className="w-4 h-4" />,
      title: "Lịch sử",
      value: "history",
    },
    {
      icon: <Upload className="w-4 h-4" />,
      title: "Import CSV",
      value: "batch-import",
    },
    {
      icon: <Download className="w-4 h-4" />,
      title: "Xuất file",
      value: "export",
    },
  ];
  const { generatedLevel, isGenerating, generateLevel, setGeneratedLevel } =
    useLevelGenerator();

  const { saveLevel } = useLevelHistory();

  const handleLevelUpdate = (updatedLevel: GeneratedLevel) => {
    setGeneratedLevel(updatedLevel);
  };

  const handleRegenerate = () => {
    if (generatedLevel) {
      generateLevel(generatedLevel.config);
    }
  };

  const handleReFill = () => {
    if (generatedLevel) {
      const refilledLevel = refillLevel(generatedLevel);
      setGeneratedLevel(refilledLevel);
    }
  };

  const handleSaveLevel = (level: GeneratedLevel, name?: string) => {
    const savedId = saveLevel(level, name);
    return savedId;
  };

  const handleLoadLevel = (level: GeneratedLevel) => {
    setGeneratedLevel(level);
    setIsEditMode(false); // Load level is not edit mode
    setActiveTab("preview");
  };

  const handleGenerateLevel = async () => {
    try {
      await generateLevel(config);
      setIsEditMode(false); // Reset edit mode for new level
      setActiveTab("preview");
    } catch {
      // Handle error silently
    }
  };

  return (
    <div className="space-y-8">
      <Header
        handleGenerateLevel={handleGenerateLevel}
        isGenerating={isGenerating}
        isShowButton={true}
      />

      <div className="lg:hidden">
        <Button
          onClick={handleGenerateLevel}
          disabled={isGenerating}
          size="lg"
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 rounded-2xl font-bold text-lg py-4 h-auto"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-5 h-5 mr-3 animate-spin" />
              Đang tạo level...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-3" />
              Tạo Level
            </>
          )}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList
          className="grid w-full mb-8 bg-card rounded-2xl border border-orange-200 shadow-lg"
          style={{
            gridTemplateColumns: `repeat(${tabContents.length}, minmax(0, 1fr))`,
          }}
        >
          {tabContents.flatMap((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex items-center gap-2 rounded-xl font-bold text-card-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300"
            >
              {tab.icon}
              {tab.title}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          <ConfigurationPanel config={config} setConfig={setConfig} />
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          {generatedLevel ? (
            <LevelPreview
              level={generatedLevel}
              onLevelUpdate={handleLevelUpdate}
              onRegenerate={handleRegenerate}
              onReFill={handleReFill}
              onSave={handleSaveLevel}
              isEditMode={isEditMode}
              onEditModeChange={setIsEditMode}
            />
          ) : (
            <BlankPreview
              handleGenerateLevel={handleGenerateLevel}
              isGenerating={isGenerating}
              setActiveTab={setActiveTab}
            />
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <LevelHistory
            onLoadLevel={handleLoadLevel}
            onEditLevel={(level) => {
              console.log("level", level);
              setGeneratedLevel(level);
              setIsEditMode(true); // Set edit mode when editing from history
              setActiveTab("preview");
            }}
          />
        </TabsContent>

        <TabsContent value="batch-import" className="space-y-6">
          <BatchImport
            onSaveLevel={handleSaveLevel}
            onEditLevel={(level) => {
              setGeneratedLevel(level);
              setIsEditMode(true); // Set edit mode when editing from batch import
              setActiveTab("preview");
            }}
          />
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <ExportPanel level={generatedLevel} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
