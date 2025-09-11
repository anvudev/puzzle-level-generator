"use client";

import type {
  LevelConfig,
  BoardCell,
  Container,
  GeneratedLevel,
} from "@/config/game-types";
import { AILevelGenerator } from "./ai-level-generator";
import { FallbackLevelGenerator } from "./fallback-level-generator";

/**
 * Main level generator class that orchestrates different generation methods
 * This is the main entry point for level generation
 */
export class GeminiLevelGenerator {
  private static apiKey = "AIzaSyDtL9apWT9BaPeMkWtW8GLmml3zMnm_yrk";

  static setApiKey(key: string) {
    this.apiKey = key;
    AILevelGenerator.setApiKey(key);
  }

  /**
   * Generate level using AI (with fallback to algorithmic generation)
   */
  static async generateLevelWithGemini(
    config: LevelConfig
  ): Promise<GeneratedLevel> {
    return AILevelGenerator.generateLevelWithGemini(config);
  }

  /**
   * Static methods for backward compatibility
   */
  static generateBoard = FallbackLevelGenerator.generateBoard;
  static generateContainers = FallbackLevelGenerator.generateContainers;
  static checkSolvability = FallbackLevelGenerator.checkSolvability;

  static async generateLevel(config: LevelConfig): Promise<GeneratedLevel> {
    return this.generateLevelWithGemini(config);
  }
}
