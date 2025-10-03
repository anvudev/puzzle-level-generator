import { PixelData } from "@/app/generate-image/page";
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

export const convertImage = async (
  formData: FormData,
  cols: string,
  rows: string
): Promise<PixelData> => {
  const url = `/image/convert?cols=${cols}&rows=${rows}`;

  // Tạo request riêng cho file upload - để axios tự động set Content-Type
  const response = await httpRequest.post(url, formData, {
    headers: {
      "Content-Type": undefined, // Để axios tự động set multipart/form-data với boundary
    },
  });

  return response.data;
};
