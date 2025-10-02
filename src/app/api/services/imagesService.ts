import httpRequest from "@/lib/utils/httpRequest";

export const getImages = async () => {
  const response = await httpRequest.get("/api/images");
  return response.data;
};
