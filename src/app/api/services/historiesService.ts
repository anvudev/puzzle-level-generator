import httpRequest from "@/lib/utils/httpRequest";
import type { GeneratedLevel } from "@/config/game-types";

// API Response Types
export interface HistoryValue {
  id: string;
  name: string;
  level: GeneratedLevel;
  createdAt: string;
  updatedAt: string;
}

export interface HistoryItem {
  _id: string;
  key: string;
  value: HistoryValue;
  updatedAt: string;
}

export interface HistoriesResponse {
  success: boolean;
  timestamp: string;
  message: string;
  data: {
    items: HistoryItem[];
    pagination: {
      skip: number;
      limit: number;
      total: number;
      has_more: boolean;
    };
  };
}

export interface SavedLevel {
  id: string;
  name: string;
  level: GeneratedLevel;
  createdAt: string;
  updatedAt: string;
}

export interface SavedLevelList {
  items: SavedLevel[];
  pagination: {
    skip: number;
    limit: number;
    total: number;
    has_more: boolean;
  };
}

/**
 * Get histories from API
 * @param skip - Number of items to skip (default: 0)
 * @param limit - Number of items to return (default: 10)
 * @param sort_by - Field to sort by (default: "updatedAt")
 * @param sort_order - Sort order "asc" or "desc" (default: "desc")
 * @param search - Search query string (optional)
 * @returns Promise<SavedLevelList>
 * @throws Error if API request fails
 */
export const getHistories = async (
  skip: number = 0,
  limit: number = 10,
  sort_by: string = "updatedAt",
  sort_order: string = "desc",
  search?: string
): Promise<SavedLevelList> => {
  try {
    const url = "/api/histories";

    // Build params object, only include search if provided
    const params: Record<string, any> = { skip, limit, sort_by, sort_order };
    if (search && search.trim()) {
      params.search = search.trim();
    }

    const response = await httpRequest.get<HistoriesResponse>(url, { params });

    // Check if response is successful
    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to fetch histories");
    }

    // Transform API response to match frontend format
    const transformedData: SavedLevelList = {
      items: response.data.data.items.map((item) => ({
        id: item.value.id,
        name: item.value.name,
        level: item.value.level,
        createdAt: item.value.createdAt,
        updatedAt: item.value.updatedAt,
      })),
      pagination: response.data.data.pagination,
    };

    return transformedData;
  } catch (error) {
    console.error("Error fetching histories:", error);
    throw error;
  }
};

/**
 * Update history name
 * @param history_id - History ID to update
 * @param name - New name
 * @returns Promise with success status and message
 * @throws Error if API request fails
 */
export const updateHistoryName = async (
  history_id: string,
  name: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const url = `/api/histories/${history_id}/name`;
    const response = await httpRequest.put(url, { name });

    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to update history name");
    }

    return response.data;
  } catch (error) {
    console.error("Error updating history name:", error);
    throw error;
  }
};

/**
 * Delete history
 * @param history_id - History ID to delete
 * @returns Promise with success status and message
 * @throws Error if API request fails
 */
export const deleteHistory = async (
  history_id: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const url = `/api/histories/${history_id}`;
    const response = await httpRequest.delete(url);

    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to delete history");
    }

    return response.data;
  } catch (error) {
    console.error("Error deleting history:", error);
    throw error;
  }
};

/**
 * Create a new history
 * @param level - The generated level to save
 * @param name - Name for the level
 * @returns Promise with success status and message
 * @throws Error if API request fails
 */
export const createHistory = async (
  level: GeneratedLevel,
  name: string
): Promise<{ success: boolean; message: string; data?: SavedLevel }> => {
  try {
    const url = `/api/histories`;

    // Clean level data - remove auto-generated fields
    const cleanLevel = {
      config: {
        name: name,
        width: level.config.width,
        height: level.config.height,
        blockCount: level.config.blockCount,
        colorCount: level.config.colorCount,
        selectedColors: level.config.selectedColors,
        colorMapping: level.config.colorMapping,
        generationMode: level.config.generationMode,
        elements: level.config.elements,
        difficulty: level.config.difficulty,
        // Optional fields
        ...(level.config.pipeCount !== undefined && {
          pipeCount: level.config.pipeCount,
        }),
        ...(level.config.pipeBlockCounts && {
          pipeBlockCounts: level.config.pipeBlockCounts,
        }),
        ...(level.config.iceCounts && { iceCounts: level.config.iceCounts }),
        ...(level.config.bombCounts && { bombCounts: level.config.bombCounts }),
      },
      board: level.board,
      containers: level.containers,
      difficultyScore: level.difficultyScore,
      solvable: level.solvable,
      pipeInfo: level.pipeInfo,
      lockInfo: level.lockInfo,
    };

    // Prepare payload - only send required fields
    const payload = {
      value: {
        name: name,
        level: cleanLevel,
      },
    };

    const response = await httpRequest.post(url, payload);

    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to create history");
    }

    return response.data;
  } catch (error) {
    console.error("Error creating history:", error);
    throw error;
  }
};

export const updateHistory = async (
  history_id: string,
  level: GeneratedLevel
): Promise<{ success: boolean; message: string }> => {
  try {
    const url = `/api/histories/${history_id}`;
    const response = await httpRequest.put(url, { level });

    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to update history");
    }

    return response.data;
  } catch (error) {
    console.error("Error updating history:", error);
    throw error;
  }
};
