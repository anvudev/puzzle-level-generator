// Simple store using module-level variables (no external dependencies)

// Interface for simplified bar data
interface BarData {
  barIndex: number;
  color: string;
}

// Module-level state
let customBarOrder: BarData[] | null = null;
let levelId: string | null = null;

// Simple store functions
export const colorBarStore = {
  setCustomBarOrder: (bars: BarData[], id: string) => {
    customBarOrder = [...bars]; // Create a copy
    levelId = id;
  },

  clearCustomBarOrder: () => {
    customBarOrder = null;
    levelId = null;
  },

  getBarOrder: (defaultBars: BarData[], id: string): BarData[] => {
    // If level ID changed, clear old custom order
    if (levelId && levelId !== id) {
      customBarOrder = null;
      levelId = null;
    }

    // If we have custom order for this specific level, use it
    if (customBarOrder && levelId === id) {
      return customBarOrder;
    }

    // Otherwise use default order
    return defaultBars;
  },
};

// Hook-like interface for React components
export const useColorBarStore = () => {
  return {
    setCustomBarOrder: colorBarStore.setCustomBarOrder,
    clearCustomBarOrder: colorBarStore.clearCustomBarOrder,
    getBarOrder: colorBarStore.getBarOrder,
  };
};
