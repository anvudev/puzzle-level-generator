import httpRequest from "@/lib/utils/httpRequest";

/**
 * Image data structure from API
 */
export interface ImageData {
  _id: string;
  key: string;
  value: {
    meta: {
      cols: number;
      rows: number;
      palette: Record<string, string>;
      mode: string;
    };
    matrix: number[][];
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * API response structure for images
 */
export interface ImagesResponse {
  success: boolean;
  timestamp: string;
  message: string;
  data: {
    items: ImageData[];
  };
}

/**
 * Get favorite images from API
 * @returns Promise<ImagesResponse>
 */
export const getFavoriteImages = async (): Promise<ImagesResponse> => {
  const response = await httpRequest.get<ImagesResponse>("/api/images");
  return response.data;
};
