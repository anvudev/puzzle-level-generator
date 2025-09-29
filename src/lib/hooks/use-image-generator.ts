import { kvGetAllImages } from "@/app/api/clients";
import { IMAGE_GEN_BASE_URL, REALM } from "@/config/game-constants";

export function useImageGenerator() {
  const generateImage = async (image: Record<string, unknown>) => {
    await fetch(`${IMAGE_GEN_BASE_URL}/generate`, {
      method: "POST",
      body: JSON.stringify(image),
    });
  };

  const getImages = async () => {
    const images = await kvGetAllImages(REALM.COLL_IMAGE);
    return images;
  };

  return { generateImage, getImages };
}
