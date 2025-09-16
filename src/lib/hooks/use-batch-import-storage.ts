import { useState, useEffect } from "react";
import type { CSVLevelConfig } from "@/lib/utils/csv-utils";
import type { GeneratedLevel } from "@/config/game-types";

export interface ImportedLevelConfig extends CSVLevelConfig {
  id: string;
  status: "pending" | "generating" | "generated" | "error";
  generatedLevel?: GeneratedLevel;
  error?: string;
}

const STORAGE_KEY = "puzzle-batch-import-data";

export function useBatchImportStorage() {
  const [importedConfigs, setImportedConfigs] = useState<ImportedLevelConfig[]>(
    []
  );

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      console.log(
        "🔍 Loading from localStorage:",
        stored ? "Found data" : "No data"
      );
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          console.log("📥 Loaded configs from storage:", parsed.length);

          // Deserialize configs with proper handling of Date objects
          const deserializedConfigs = parsed
            .filter(
              (c): c is Record<string, unknown> =>
                typeof c === "object" && c !== null
            )
            .map((configObj) => {
              const base = configObj as Partial<ImportedLevelConfig>;
              const generated = base.generatedLevel
                ? {
                    ...base.generatedLevel,
                    timestamp: new Date(
                      typeof base.generatedLevel.timestamp === "string"
                        ? base.generatedLevel.timestamp
                        : String(base.generatedLevel.timestamp)
                    ),
                  }
                : undefined;
              return {
                ...base,
                generatedLevel: generated,
              } as ImportedLevelConfig;
            });

          setImportedConfigs(deserializedConfigs);
          console.log("✅ Successfully loaded from localStorage");
        }
      }
    } catch (error) {
      console.error(
        "Failed to load batch import data from localStorage:",
        error
      );
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    try {
      console.log(
        "💾 Saving to localStorage:",
        importedConfigs.length,
        "configs"
      );

      // Serialize configs with proper handling of Date objects
      const serializedConfigs = importedConfigs.map((config) => ({
        ...config,
        generatedLevel: config.generatedLevel
          ? {
              ...config.generatedLevel,
              timestamp: config.generatedLevel.timestamp.toISOString(),
            }
          : undefined,
      }));

      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializedConfigs));
      console.log("✅ Successfully saved to localStorage");
    } catch (error) {
      console.error(
        "❌ Failed to save batch import data to localStorage:",
        error
      );
    }
  }, [importedConfigs]);

  const addConfigs = (configs: ImportedLevelConfig[]) => {
    console.log("🔧 Adding configs to storage:", configs.length);
    setImportedConfigs((prev) => {
      const newConfigs = [...prev, ...configs];
      console.log("📦 New total configs:", newConfigs.length);
      return newConfigs;
    });
  };

  const updateConfig = (id: string, updates: Partial<ImportedLevelConfig>) => {
    setImportedConfigs((prev) =>
      prev.map((config) =>
        config.id === id ? { ...config, ...updates } : config
      )
    );
  };

  const deleteConfig = (id: string) => {
    setImportedConfigs((prev) => prev.filter((config) => config.id !== id));
  };

  const clearAll = () => {
    setImportedConfigs([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error(
        "Failed to clear batch import data from localStorage:",
        error
      );
    }
  };

  const getConfig = (id: string) => {
    return importedConfigs.find((config) => config.id === id);
  };

  const getStats = () => {
    const total = importedConfigs.length;
    const pending = importedConfigs.filter(
      (c) => c.status === "pending"
    ).length;
    const generating = importedConfigs.filter(
      (c) => c.status === "generating"
    ).length;
    const generated = importedConfigs.filter(
      (c) => c.status === "generated"
    ).length;
    const error = importedConfigs.filter((c) => c.status === "error").length;

    return { total, pending, generating, generated, error };
  };

  return {
    importedConfigs,
    addConfigs,
    updateConfig,
    deleteConfig,
    clearAll,
    getConfig,
    getStats,
    setImportedConfigs,
  };
}
