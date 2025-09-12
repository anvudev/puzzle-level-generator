"use client";

import { useState, useCallback } from "react";
import type { LevelConfig, GeneratedLevel } from "@/config/game-types";
import { GeminiLevelGenerator } from "@/lib/generators/gemini-level-generator";
import { MigrationAdapter } from "@/lib/generators/migration-adapter";

export function useLevelGenerator() {
  const [generatedLevel, setGeneratedLevel] = useState<GeneratedLevel | null>(
    null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiKey, setApiKey] = useState<string>("");

  const generateLevel = useCallback(
    async (config: LevelConfig) => {
      setIsGenerating(true);

      // Simulate level generation delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      try {
        console.log(
          "🚀 [HOOK] Starting level generation with Migration Adapter"
        );

        // Try V3 generator first via Migration Adapter
        try {
          const level = MigrationAdapter.generateLevel(config);
          console.log("✅ [HOOK] V3 generation successful:", level);
          setGeneratedLevel(level);
          return level;
        } catch (v3Error) {
          console.warn(
            "⚠️ [HOOK] V3 generation failed, trying Gemini:",
            v3Error
          );

          // Fallback to Gemini if V3 fails
          if (apiKey) {
            GeminiLevelGenerator.setApiKey(apiKey);
          }
          const level = await GeminiLevelGenerator.generateLevel(config);
          console.log("✅ [HOOK] Gemini generation successful:", level);
          setGeneratedLevel(level);
          return level;
        }
      } catch (error) {
        console.error("❌ [HOOK] All level generation methods failed:", error);
        throw error;
      } finally {
        setIsGenerating(false);
      }
    },
    [apiKey]
  );

  const clearLevel = useCallback(() => {
    setGeneratedLevel(null);
  }, []);

  const updateApiKey = useCallback((key: string) => {
    setApiKey(key);
  }, []);

  return {
    generatedLevel,
    setGeneratedLevel,
    isGenerating,
    generateLevel,
    clearLevel,
    apiKey,
    setApiKey: updateApiKey,
  };
}
