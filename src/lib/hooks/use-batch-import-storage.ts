import { useState, useCallback } from "react";
import type { CSVLevelConfig } from "@/lib/utils/csv-utils";
import type { GeneratedLevel } from "@/config/game-types";

export interface ImportedLevelConfig extends CSVLevelConfig {
  id: string;
  status: "pending" | "generated" | "error";
  generatedLevel?: GeneratedLevel;
  error?: string;
}

export function useBatchImportStorage() {
  const [importedConfigs, setImportedConfigs] = useState<ImportedLevelConfig[]>(
    []
  );

  const addConfigs = useCallback((configs: ImportedLevelConfig[]) => {
    setImportedConfigs((prev) => {
      const newConfigs = [...prev, ...configs];
      return newConfigs;
    });
  }, []);

  const updateConfig = useCallback(
    (id: string, updates: Partial<ImportedLevelConfig>) => {
      setImportedConfigs((prev) =>
        prev.map((config) =>
          config.id === id ? { ...config, ...updates } : config
        )
      );
    },
    []
  );

  const deleteConfig = useCallback((id: string) => {
    setImportedConfigs((prev) => prev.filter((config) => config.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setImportedConfigs([]);
  }, []);

  const getConfig = useCallback(
    (id: string) => {
      return importedConfigs.find((config) => config.id === id);
    },
    [importedConfigs]
  );

  const getStats = useCallback(() => {
    const total = importedConfigs.length;
    const pending = importedConfigs.filter(
      (c) => c.status === "pending"
    ).length;
    const generated = importedConfigs.filter(
      (c) => c.status === "generated"
    ).length;
    const error = importedConfigs.filter((c) => c.status === "error").length;

    return { total, pending, generated, error };
  }, [importedConfigs]);

  // Debug function to check storage state
  const debugStorage = useCallback(() => {
    // Debug storage state (logs removed for production)
  }, []);

  return {
    importedConfigs,
    addConfigs,
    updateConfig,
    deleteConfig,
    clearAll,
    getConfig,
    getStats,
    debugStorage,
    setImportedConfigs,
  };
}
