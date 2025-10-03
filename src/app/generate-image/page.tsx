"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { IMAGE_SIZE_OPTIONS, REALM } from "@/config/game-constants";
import {
  Upload,
  Download,
  Copy,
  Image as ImageIcon,
  Star,
  Check,
} from "lucide-react";
import { useState, useRef } from "react";
import { kvSaveImage } from "../api/clients";
import toast from "react-hot-toast";
import { convertImage } from "../api/services/imagesService";

export interface PixelData {
  meta: {
    cols: number;
    rows: number;
    palette: Record<string, string>;
    mode: string;
  };
  matrix: number[][];
}

export default function GenerateImage() {
  const [pixelData, setPixelData] = useState<PixelData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [size, setSize] = useState("30x30");

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type - chỉ hỗ trợ PNG, JPEG, WebP
    const supportedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];
    if (!supportedTypes.includes(file.type.toLowerCase())) {
      setError("Chỉ hỗ trợ file PNG, JPEG, WebP. File bạn chọn: " + file.type);
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError("File quá lớn. Vui lòng chọn file nhỏ hơn 10MB");
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsSaved(false);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const data: PixelData = await convertImage(
        formData,
        size.split("x")[0],
        size.split("x")[1]
      );
      setPixelData(data);
    } catch (err: any) {
      console.error("Upload error:", err);

      // Hiển thị lỗi chi tiết từ backend
      let errorMessage = "Có lỗi xảy ra khi xử lý ảnh. Vui lòng thử lại.";

      if (err?.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const downloadMatrix = () => {
    if (!pixelData) return;

    const dataStr = JSON.stringify(pixelData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "pixel-matrix.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyMatrix = async () => {
    if (!pixelData) return;

    try {
      const dataStr = JSON.stringify(pixelData, null, 2);
      await navigator.clipboard.writeText(dataStr);
      // You could add a toast notification here
      alert("Đã copy ma trận vào clipboard!");
    } catch (err) {
      console.error("Copy error:", err);
      alert("Không thể copy. Vui lòng thử lại.");
    }
  };

  const handleSaveImage = async () => {
    if (!pixelData) return;

    try {
      setIsSaved(false);
      await kvSaveImage(REALM.COLL_IMAGE, "image", pixelData);

      // Show success state
      setIsSaved(true);
      toast.success("Image saved successfully");
      // Reset success state after 2 seconds
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save image. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Generate Pixel Art
        </h1>
        <p className="text-muted-foreground">
          Upload an image and convert it to pixel art matrix
        </p>
      </div>
      <Card className="bg-gradient-to-br from-orange-50 to-orange-50 border-2 border-orange-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-full">
                <ImageIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-xl bg-gradient-to-r from-orange-600 to-indigo-600 bg-clip-text text-transparent font-bold">
                  Tạo ảnh pixel
                </CardTitle>
                <p className="text-sm text-orange-600 mt-1">
                  Upload ảnh PNG để tạo ma trận pixel
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <h4>Kích thước ảnh:</h4>
                <select onChange={(e) => setSize(e.target.value)} value={size}>
                  {IMAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUploadClick}
                disabled={isLoading}
              >
                <Upload className="w-4 h-4 mr-2" />
                {isLoading ? "Đang xử lý..." : "Tải ảnh lên"}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleFileUpload}
            className="hidden"
          />

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md text-red-700">
              {error}
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              <span className="ml-2 text-orange-600">Đang xử lý ảnh...</span>
            </div>
          )}

          {!pixelData && !isLoading && (
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-orange-300 rounded-lg p-8 text-center cursor-pointer hover:border-orange-400 transition-colors"
                onClick={handleUploadClick}
              >
                <Upload className="w-12 h-12 text-orange-400 mx-auto mb-4" />
                <p className="text-orange-600 font-medium">Click để chọn ảnh</p>
                <p className="text-orange-500 text-sm mt-1">
                  Hỗ trợ PNG, JPEG, WebP (tối đa 10MB)
                </p>
              </div>
            </div>
          )}

          {pixelData && (
            <div className="space-y-6">
              {/* Action Buttons */}
              <div className="flex gap-3 justify-center flex-wrap">
                <Button onClick={downloadMatrix} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download JSON
                </Button>
                <Button onClick={copyMatrix} variant="outline">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Matrix
                </Button>
                <Button onClick={handleUploadClick} variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload New
                </Button>
              </div>

              {/* Matrix Info */}
              <div className="bg-white rounded-lg p-4 border border-orange-200">
                <h3 className="font-semibold text-orange-800 mb-2">
                  Thông tin ma trận:
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-orange-600">Kích thước:</span>
                    <span className="ml-2 font-medium">
                      {pixelData.meta.cols} × {pixelData.meta.rows}
                    </span>
                  </div>
                  <div>
                    <span className="text-orange-600">Số màu:</span>
                    <span className="ml-2 font-medium">
                      {Object.keys(pixelData.meta.palette).length}
                    </span>
                  </div>
                  <div>
                    <span className="text-orange-600">Pixels:</span>
                    <span className="ml-2 font-medium">
                      {pixelData.meta.cols * pixelData.meta.rows}
                    </span>
                  </div>
                </div>
              </div>

              {/* Color Palette */}
              <div className="bg-white rounded-lg p-4 border border-orange-200">
                <h3 className="font-semibold text-orange-800 mb-3">
                  Bảng màu:
                </h3>
                <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
                  {Object.entries(pixelData.meta.palette).map(
                    ([index, color]) => (
                      <div key={index} className="flex flex-col items-center">
                        <div
                          className="w-8 h-8 rounded border border-gray-300 shadow-sm"
                          style={{ backgroundColor: color }}
                          title={`${index}: ${color}`}
                        />
                        <span className="text-xs text-gray-600 mt-1">
                          {index}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Pixel Matrix Display */}
              <div className="bg-white rounded-lg p-4 border border-orange-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-orange-800 mb-3">
                    Ma trận pixel:
                  </h3>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={handleSaveImage}
                      className={`transition-all duration-300 ${
                        isSaved
                          ? "bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      {isSaved ? (
                        <>
                          <Check className="w-4 h-4 mr-2 text-green-600" />
                          Saved!
                        </>
                      ) : (
                        <>
                          <Star className="w-4 h-4 mr-2" />
                          Save
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <div className="overflow-auto max-h-96 flex justify-center items-center p-4">
                  <div
                    className="border-2 border-gray-800 shadow-lg"
                    // style={{
                    //   width: `${pixelData.meta.cols * 8}px`,
                    //   height: `${pixelData.meta.rows * 8}px`,
                    // }}
                  >
                    <div
                      className="grid gap-0"
                      style={{
                        gridTemplateColumns: `repeat(${pixelData.meta.cols}, 8px)`,
                        gridTemplateRows: `repeat(${pixelData.meta.rows}, 8px)`,
                        width: `${pixelData.meta.cols * 8}px`,
                        height: `${pixelData.meta.rows * 8}px`,
                      }}
                    >
                      {pixelData.matrix.flat().map((colorIndex, index) => {
                        const color =
                          pixelData.meta.palette[colorIndex.toString()];
                        return (
                          <div
                            key={index}
                            className="w-2 h-2"
                            style={{ backgroundColor: color }}
                            title={`Pixel ${index}: Color ${colorIndex} (${color})`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* JSON Preview */}
              <div className="bg-white rounded-lg p-4 border border-orange-200">
                <h3 className="font-semibold text-orange-800 mb-3">
                  JSON Preview:
                </h3>
                <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-40 border">
                  {JSON.stringify(pixelData, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
