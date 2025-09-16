"use client";

import { useState, useEffect } from "react";
import type { GeneratedLevel } from "@/config/game-types";

export interface SavedLevel {
  id: string;
  name: string;
  level: GeneratedLevel;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "puzzle-level-history";

export function useLevelHistory() {
  const [savedLevels, setSavedLevels] = useState<SavedLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved levels from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSavedLevels(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error("Failed to load saved levels:", error);
      setSavedLevels([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save levels to localStorage whenever savedLevels changes
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedLevels));
      } catch (error) {
        console.error("Failed to save levels to localStorage:", error);
      }
    }
  }, [savedLevels, isLoading]);

  const saveLevel = (level: GeneratedLevel, name?: string) => {
    const now = new Date().toISOString();
    const defaultName = `Level ${new Date().toLocaleDateString("vi-VN")} ${new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
    
    const savedLevel: SavedLevel = {
      id: `level_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name || defaultName,
      level,
      createdAt: now,
      updatedAt: now,
    };

    setSavedLevels(prev => [savedLevel, ...prev]);
    return savedLevel.id;
  };

  const updateLevel = (id: string, updates: Partial<Pick<SavedLevel, "name" | "level">>) => {
    setSavedLevels(prev => 
      prev.map(saved => 
        saved.id === id 
          ? { ...saved, ...updates, updatedAt: new Date().toISOString() }
          : saved
      )
    );
  };

  const deleteLevel = (id: string) => {
    setSavedLevels(prev => prev.filter(saved => saved.id !== id));
  };

  const clearHistory = () => {
    setSavedLevels([]);
  };

  const getLevelById = (id: string) => {
    return savedLevels.find(saved => saved.id === id);
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
      setSavedLevels(prev => [duplicated, ...prev]);
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
