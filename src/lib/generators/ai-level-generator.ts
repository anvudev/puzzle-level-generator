import type { LevelConfig, GeneratedLevel } from "@/config/game-types";
import { createLevelPrompt } from "../promp/promp";
import { AI_GENERATION_CONFIG } from "@/config/game-constants";
import { LevelGeneratorUtils } from "./level-generator-utils";
import { FallbackLevelGenerator } from "./fallback-level-generator";

/**
 * AI-powered level generator using Google Gemini API
 * Currently not actively used, but kept for future AI integration
 */
export class AILevelGenerator {
  private static apiKey = "AIzaSyDtL9apWT9BaPeMkWtW8GLmml3zMnm_yrk";

  static setApiKey(key: string) {
    this.apiKey = key;
  }

  /**
   * Generate level using Gemini AI with fallback to algorithmic generation
   */
  static async generateLevelWithGemini(
    config: LevelConfig
  ): Promise<GeneratedLevel> {
    // Check if AI generation is enabled
    if (
      !AI_GENERATION_CONFIG.ENABLE_AI_GENERATION ||
      AI_GENERATION_CONFIG.FORCE_USE_FALLBACK
    ) {
      return FallbackLevelGenerator.generateLevel(config);
    }

    if (!this.apiKey) {
      return FallbackLevelGenerator.generateLevel(config);
    }

    const prompt = createLevelPrompt(config);

    try {
      // Add timeout for AI request
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        AI_GENERATION_CONFIG.AI_TIMEOUT
      );

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-goog-api-key": this.apiKey,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
          }),
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API Response Error:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        throw new Error(
          `Gemini API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data = await response.json();

      if (!data.candidates || data.candidates.length === 0) {
        console.error("No candidates in Gemini response:", data);
        throw new Error("Không có candidates trong response từ Gemini API");
      }

      const candidate = data.candidates[0];

      if (candidate.finishReason === "MAX_TOKENS") {
        console.warn(
          "Gemini response was truncated due to MAX_TOKENS, using fallback"
        );
        return FallbackLevelGenerator.generateLevel(config);
      }

      if (
        !candidate.content ||
        !candidate.content.parts ||
        candidate.content.parts.length === 0
      ) {
        console.error("Invalid candidate structure:", candidate);
        throw new Error("Cấu trúc candidate không hợp lệ từ Gemini API");
      }

      const generatedText = candidate.content.parts[0].text;

      if (!generatedText) {
        throw new Error("Không nhận được text từ Gemini API");
      }

      let jsonMatch = generatedText.match(/```json\s*([\s\S]*?)\s*```/);
      if (!jsonMatch) {
        jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      }

      if (!jsonMatch) {
        console.error("No JSON found in response:", generatedText);
        throw new Error("Không tìm thấy JSON trong response từ Gemini");
      }

      let levelData;
      try {
        levelData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } catch (parseError) {
        console.error(
          "JSON parse error:",
          parseError,
          "Raw JSON:",
          jsonMatch[0]
        );
        throw new Error("Lỗi parse JSON từ Gemini response");
      }

      // Extract pipe and lock info if using fallback board
      let pipeInfo = undefined;
      let lockInfo = undefined;
      if (!levelData.board) {
        // Using fallback board, need to extract pipe and lock info
        const fallbackBoard = FallbackLevelGenerator.generateBoard(config);
        pipeInfo = LevelGeneratorUtils.extractPipeInfo(fallbackBoard, config);
        lockInfo = LevelGeneratorUtils.extractLockInfo(fallbackBoard, config);
      }

      const level: GeneratedLevel = {
        id: `ai_level_${Date.now()}`,
        config: { ...config },
        board: levelData.board || FallbackLevelGenerator.generateBoard(config),
        containers:
          levelData.containers ||
          FallbackLevelGenerator.generateContainers(config),
        difficultyScore: LevelGeneratorUtils.calculateDifficultyScore(config),
        solvable: levelData.solvable || false,
        timestamp: new Date(),
        pipeInfo: pipeInfo,
        lockInfo: lockInfo,
      };

      if (this.validateLevel(level)) {
        return level;
      } else {
        console.warn("Level từ Gemini không hợp lệ, sử dụng fallback");
        return FallbackLevelGenerator.generateLevel(config);
      }
    } catch (error) {
      console.error("Lỗi khi gọi Gemini API:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Check if it's a timeout error
      if (error instanceof Error && error.name === "AbortError") {
        console.warn(
          `AI request timeout after ${AI_GENERATION_CONFIG.AI_TIMEOUT}ms, using fallback`
        );
      }

      return FallbackLevelGenerator.generateLevel(config);
    }
  }

  /**
   * Validate generated level structure
   */
  private static validateLevel(level: GeneratedLevel): boolean {
    if (!level.board || level.board.length !== level.config.height) {
      return false;
    }

    if (!level.board.every((row) => row.length === level.config.width)) {
      return false;
    }

    if (!level.containers || level.containers.length === 0) {
      return false;
    }

    if (level.containers.some((c) => c.contents.length === 0)) {
      return false;
    }

    return true;
  }
}
