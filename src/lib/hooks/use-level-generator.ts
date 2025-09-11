"use client";

import { useState, useCallback } from "react";
import type { LevelConfig, GeneratedLevel } from "@/config/game-types";
import { GeminiLevelGenerator } from "../generators/gemini-level-generator";

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
        if (apiKey) {
          GeminiLevelGenerator.setApiKey(apiKey);
        }
        const level = await GeminiLevelGenerator.generateLevel(config);
        setGeneratedLevel(level);
        return level;
      } catch (error) {
        console.error("[v0] Level generation failed:", error);
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
    isGenerating,
    generateLevel,
    clearLevel,
    apiKey,
    setApiKey: updateApiKey,
  };
}
