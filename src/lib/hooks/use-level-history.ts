"use client";

import { useState, useEffect, useRef } from "react";
import type { GeneratedLevel } from "@/config/game-types";
import {
  kvCreate,
  kvDel,
  kvDelAll,
  kvGetAll,
  kvSet,
  kvUpdate,
} from "@/app/api/clients";
import { REALM } from "@/config/game-constants";

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
  const hasLoadedRef = useRef(false);

  // Load saved levels from Realm (kv store) on mount
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    const load = async () => {
      try {
        const stored = await kvGetAll(REALM.COLL_HISTORY);
        setSavedLevels(stored);
      } catch {
        setSavedLevels([]);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const saveLevel = (level: GeneratedLevel, name?: string) => {
    const now = new Date().toISOString();
    const defaultName = `Level ${new Date().toLocaleDateString(
      "vi-VN"
    )} ${new Date().toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;

    const savedLevel: SavedLevel = {
      id: `level_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      name: name || defaultName,
      level: {
        ...level,
        config: { ...level.config, name: name || defaultName },
      },
      createdAt: now,
      updatedAt: now,
    };
    setSavedLevels([savedLevel, ...savedLevels]);
    kvCreate(REALM.COLL_HISTORY, "history", savedLevel);
    return savedLevel.id;
  };

  const updateLevel = (level: GeneratedLevel, savedLevelId?: string) => {
    // Find the original saved level to preserve the name and ID
    let originalLevel: SavedLevel | undefined;

    if (savedLevelId) {
      // If savedLevelId is provided, find by saved level ID
      originalLevel = savedLevels.find((saved) => saved.id === savedLevelId);
    } else {
      // Fallback: find by level ID (old behavior)
      originalLevel = savedLevels.find((saved) => saved.level.id === level.id);
    }

    if (!originalLevel) {
      console.error(
        "Original level not found for update. Level ID:",
        level.id,
        "Saved Level ID:",
        savedLevelId
      );
      return;
    }

    const originalName = originalLevel.name || level.config.name;

    // Preserve the original level ID to maintain database consistency
    const updatedLevel = {
      ...level,
      id: originalLevel.level.id, // Keep the original level ID
    };

    const updates = { name: originalName, level: updatedLevel };

    // Update local state
    setSavedLevels((prev) =>
      prev.map((saved) =>
        saved.id === originalLevel!.id
          ? {
              ...saved,
              name: originalName,
              level: updatedLevel,
              updatedAt: new Date().toISOString(),
            }
          : saved
      )
    );
    kvUpdate(REALM.COLL_HISTORY, originalLevel.level.id, updates);
  };

  const updateLevelName = (
    id: string,
    updates: Partial<Pick<SavedLevel, "name" | "level">>
  ) => {
    kvSet(REALM.COLL_HISTORY, id, updates);
    setSavedLevels((prev) =>
      prev.map((saved) =>
        saved.id === id
          ? { ...saved, ...updates, updatedAt: new Date().toISOString() }
          : saved
      )
    );
  };

  const deleteLevel = (id: string) => {
    kvDel(REALM.COLL_HISTORY, id);
    setSavedLevels((prev) => prev.filter((saved) => saved.id !== id));
  };

  const clearHistory = () => {
    kvDelAll(REALM.COLL_HISTORY);
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
      kvCreate(REALM.COLL_HISTORY, "history", duplicated);
      setSavedLevels((prev) => [duplicated, ...prev]);
      return duplicated.id;
    }
    return null;
  };

  return {
    savedLevels,
    isLoading,
    saveLevel,
    updateLevel,
    deleteLevel,
    clearHistory,
    updateLevelName,
    getLevelById,
    duplicateLevel,
    totalCount: savedLevels.length,
  };
}
