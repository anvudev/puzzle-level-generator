"use client";

import { useState, useRef } from "react";
import type { GeneratedLevel } from "@/config/game-types";

export interface SavedLevel {
  id: string;
  name: string;
  level: GeneratedLevel;
  createdAt: string;
  updatedAt: string;
}

export interface SavedLevelList {
  data: SavedLevel[];
}

// const STORAGE_KEY = "puzzle-level-history";

export function useLevelHistory() {
  const [savedLevels, setSavedLevels] = useState<SavedLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const _hasLoadedRef = useRef(false);

  const clearHistory = () => {
    // kvDelAll(REALM.COLL_HISTORY);
    setSavedLevels([]);
  };

  const getLevelById = (id: string) => {
    return savedLevels.find((saved) => saved.id === id);
  };

  const duplicateLevel = (id: string) => {
    const original = getLevelById(id);
    if (original) {
      const now = new Date().toISOString();
      const duplicated: SavedLevel = {
        id: `level_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 11)}`,
        name: `${original.name} (Copy)`,
        level: { ...original.level },
        createdAt: now,
        updatedAt: now,
      };
      // kvCreate(REALM.COLL_HISTORY, "history", duplicated);
      setSavedLevels((prev) => [duplicated, ...prev]);
      return duplicated.id;
    }
    return null;
  };

  return {
    savedLevels,
    isLoading,
    clearHistory,
    getLevelById,
    duplicateLevel,
  };
}
