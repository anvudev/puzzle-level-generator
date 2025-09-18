"use client";

import { useState, useEffect, useRef } from "react";
import type { GeneratedLevel } from "@/config/game-types";
import {
  kvCreate,
  kvDel,
  kvDelAll,
  kvGet,
  kvGetAll,
  kvSet,
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

const STORAGE_KEY = "puzzle-level-history";

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
      id: `level_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name || defaultName,
      level,
      createdAt: now,
      updatedAt: now,
    };
    setSavedLevels([savedLevel, ...savedLevels]);
    kvCreate(REALM.COLL_HISTORY, "history", savedLevel);
    return savedLevel.id;
  };

  const updateLevel = (
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
        id: `level_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
    getLevelById,
    duplicateLevel,
    totalCount: savedLevels.length,
  };
}
