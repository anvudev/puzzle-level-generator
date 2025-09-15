"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download,
  RefreshCw,
  Settings,
  Grid3X3,
  Sparkles,
  Gamepad2,
  Zap,
  Palette,
} from "lucide-react";
import { LevelPreview } from "./level-preview";
import { ConfigurationPanel } from "./configuration-panel";
import { ExportPanel } from "./export-panel";
import { DEFAULT_CONFIG } from "@/config/game-constants";
import { useLevelGenerator } from "@/lib/hooks/use-level-generator";
import type { LevelConfig, GeneratedLevel } from "@/config/game-types";

export function PuzzleLevelGenerator() {
  const [config, setConfig] = useState<LevelConfig>(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState("config");

  const { generatedLevel, isGenerating, generateLevel, setGeneratedLevel } =
    useLevelGenerator();

  const handleLevelUpdate = (updatedLevel: GeneratedLevel) => {
    setGeneratedLevel(updatedLevel);
  };

  const handleGenerateLevel = async () => {
    try {
      await generateLevel(config);
      setActiveTab("preview");
    } catch (error) {
      console.error("Failed to generate level:", error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-orange-600 to-red-500 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-black/30 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <Gamepad2 className="w-6 h-6 text-white" />
                  </div>
                  <div className="w-12 h-12 bg-black/30 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="w-12 h-12 bg-black/30 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-black mb-2">
                  Puzzle Level Generator
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-full px-4 py-2">
                  <Palette className="w-4 h-4" />
                  <span className="text-sm font-medium">12 màu sắc</span>
                </div>
                <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-full px-4 py-2">
                  <Grid3X3 className="w-4 h-4" />
                  <span className="text-sm font-medium">7 loại element</span>
                </div>
              </div>
            </div>
            <div className="hidden lg:block">
              <Button
                onClick={handleGenerateLevel}
                disabled={isGenerating}
                size="lg"
                className="bg-white text-orange-600 hover:bg-white/90 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 rounded-2xl font-bold text-lg px-8 py-4 h-auto"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-6 h-6 mr-3 animate-spin" />
                    Đang tạo level...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6 mr-3" />
                    Tạo Level
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
      </div>

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
        <TabsList className="grid w-full grid-cols-3 mb-8 bg-cardrounded-2xl border border-orange-200 shadow-lg">
          <TabsTrigger
            value="config"
            className="flex items-center gap-2 rounded-xl font-bold text-card-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300"
          >
            <Settings className="w-4 h-4" />
            Cấu hình
          </TabsTrigger>
          <TabsTrigger
            value="preview"
            className="flex items-center gap-2 rounded-xl font-bold text-card-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300"
          >
            <Grid3X3 className="w-4 h-4" />
            Xem trước
          </TabsTrigger>
          <TabsTrigger
            value="export"
            className="flex items-center gap-2 rounded-xl font-bold text-card-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300"
          >
            <Download className="w-4 h-4" />
            Xuất file
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          <ConfigurationPanel config={config} setConfig={setConfig} />
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          {generatedLevel ? (
            <LevelPreview
              level={generatedLevel}
              onLevelUpdate={handleLevelUpdate}
              // onRegenerate={generateLevel}
              onSave={(level) => {
                console.log("Saving level:", level);
                // You can implement save functionality here
                // For now, just log the level
              }}
            />
          ) : (
            <Card className="border-2 border-dashed border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl shadow-xl overflow-hidden">
              <CardContent className="flex flex-col items-center justify-center py-20">
                <div className="relative mb-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl flex items-center justify-center shadow-2xl animate-bounce">
                    <Grid3X3 className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                    <Sparkles className="w-4 h-4 text-yellow-800" />
                  </div>
                </div>
                <h3 className="text-3xl font-black text-gray-800 mb-4 text-center">
                  Sẵn sàng tạo level đầu tiên?
                </h3>
                <p className="text-gray-600 text-center mb-8 max-w-lg text-lg leading-relaxed">
                  Cấu hình các thông số theo ý muốn và bắt đầu tạo những level
                  puzzle thú vị và thách thức!
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={() => setActiveTab("config")}
                    variant="outline"
                    size="lg"
                    className="border-2 border-orange-300 text-orange-700 hover:bg-orange-50 rounded-2xl font-bold px-8"
                  >
                    <Settings className="w-5 h-5 mr-2" />
                    Cấu hình trước
                  </Button>
                  <Button
                    onClick={handleGenerateLevel}
                    disabled={isGenerating}
                    size="lg"
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 rounded-2xl font-bold px-8"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                        Đang tạo...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Tạo ngay
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <ExportPanel level={generatedLevel} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
