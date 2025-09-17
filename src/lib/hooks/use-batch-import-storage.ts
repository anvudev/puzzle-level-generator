import { useState, useEffect, useCallback, useRef } from "react";
import type { CSVLevelConfig } from "@/lib/utils/csv-utils";
import type { GeneratedLevel } from "@/config/game-types";

export interface ImportedLevelConfig extends CSVLevelConfig {
  id: string;
  status: "pending" | "generating" | "generated" | "error";
  generatedLevel?: GeneratedLevel;
  error?: string;
}

const STORAGE_KEY = "puzzle-batch-import-data";
const SESSION_STORAGE_KEY = "puzzle-batch-import-session";

// Global cache to prevent data loss between component mounts
let globalCache: ImportedLevelConfig[] | null = null;

// Utility function to safely parse JSON
const safeJsonParse = (str: string | null): unknown => {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
};

// Utility function to load data from multiple sources
const loadDataFromSources = (): ImportedLevelConfig[] => {
  // Priority: globalCache > localStorage > sessionStorage
  if (globalCache !== null && globalCache.length > 0) {
    console.log("🔄 Loading from global cache:", globalCache.length, "items");
    return globalCache;
  }

  // Try localStorage first
  const localData = safeJsonParse(localStorage.getItem(STORAGE_KEY));
  if (localData && Array.isArray(localData) && localData.length > 0) {
    console.log("💾 Loading from localStorage:", localData.length, "items");
    return localData;
  }

  // Fallback to sessionStorage
  const sessionData = safeJsonParse(
    sessionStorage.getItem(SESSION_STORAGE_KEY)
  );
  if (sessionData && Array.isArray(sessionData) && sessionData.length > 0) {
    console.log("📄 Loading from sessionStorage:", sessionData.length, "items");
    return sessionData;
  }

  console.log("📭 No data found in any storage");
  return [];
};

export function useBatchImportStorage() {
  const [importedConfigs, setImportedConfigs] = useState<ImportedLevelConfig[]>(
    () => {
      try {
        const rawData = loadDataFromSources();

        if (rawData.length === 0) {
          return [];
        }

        // Deserialize configs with proper handling of Date objects
        const deserializedConfigs = rawData
          .filter(
            (c): c is ImportedLevelConfig =>
              typeof c === "object" &&
              c !== null &&
              typeof (c as ImportedLevelConfig).id === "string" &&
              typeof (c as ImportedLevelConfig).status === "string"
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

        console.log(
          "✅ Successfully loaded:",
          deserializedConfigs.length,
          "configs"
        );
        globalCache = deserializedConfigs; // Update global cache
        return deserializedConfigs;
      } catch (error) {
        console.error("❌ Failed to load batch import data:", error);
        return [];
      }
    }
  );

  const isInitialMount = useRef(true);

  // Update global cache whenever state changes
  useEffect(() => {
    globalCache = importedConfigs;
    console.log("🔄 Updated global cache:", importedConfigs.length, "items");
  }, [importedConfigs]);

  // Load from localStorage on mount (only if global cache is empty)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // This effect should only run if we need to refresh from localStorage
    // when global cache is somehow out of sync
    console.log("🔍 Checking storage sync on mount");
  }, []);

  // Save to localStorage whenever data changes (debounced for performance)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for debounced save
    saveTimeoutRef.current = setTimeout(() => {
      try {
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
        // Also save to sessionStorage as backup
        sessionStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify(serializedConfigs)
        );
        console.log(
          "💾 Saved to localStorage & sessionStorage:",
          importedConfigs.length,
          "items"
        );
      } catch (error) {
        console.error(
          "❌ Failed to save batch import data to localStorage:",
          error
        );
      }
    }, 100); // 100ms debounce

    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [importedConfigs]);

  const addConfigs = useCallback((configs: ImportedLevelConfig[]) => {
    console.log("➕ Adding configs:", configs.length);
    setImportedConfigs((prev) => {
      const newConfigs = [...prev, ...configs];
      console.log("📊 Total configs after add:", newConfigs.length);
      return newConfigs;
    });
  }, []);

  const updateConfig = useCallback(
    (id: string, updates: Partial<ImportedLevelConfig>) => {
      console.log("🔄 Updating config:", id, updates);
      setImportedConfigs((prev) =>
        prev.map((config) =>
          config.id === id ? { ...config, ...updates } : config
        )
      );
    },
    []
  );

  const deleteConfig = useCallback((id: string) => {
    console.log("🗑️ Deleting config:", id);
    setImportedConfigs((prev) => prev.filter((config) => config.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    console.log("🗑️ Clearing all batch import data");
    setImportedConfigs([]);
    globalCache = []; // Clear global cache too
    try {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      console.log("💾 Cleared localStorage & sessionStorage");
    } catch (error) {
      console.error(
        "❌ Failed to clear batch import data from storage:",
        error
      );
    }
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
    const generating = importedConfigs.filter(
      (c) => c.status === "generating"
    ).length;
    const generated = importedConfigs.filter(
      (c) => c.status === "generated"
    ).length;
    const error = importedConfigs.filter((c) => c.status === "error").length;

    return { total, pending, generating, generated, error };
  }, [importedConfigs]);

  // Debug function to check storage state
  const debugStorage = useCallback(() => {
    console.log("🔍 Debug Storage State:");
    console.log("- importedConfigs.length:", importedConfigs.length);
    console.log("- globalCache.length:", globalCache?.length || 0);
    console.log(
      "- localStorage item:",
      localStorage.getItem(STORAGE_KEY)?.length || 0,
      "chars"
    );
    console.log(
      "- sessionStorage item:",
      sessionStorage.getItem(SESSION_STORAGE_KEY)?.length || 0,
      "chars"
    );
  }, [importedConfigs]);

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
