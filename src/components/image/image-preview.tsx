"use client";

import { Download, Copy, Palette, Check, Trash2 } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { useEffect, useState } from "react";
import { REALM } from "@/config/game-constants";
import { kvDeleteImage } from "@/app/api/clients";
import { toast } from "react-hot-toast";

interface ImageData {
  _id: string;
  value: {
    meta: {
      cols: number;
      rows: number;
      palette: Record<string, string>;
    };
    matrix: number[][];
  };
}

interface ImagePreviewProps {
  images: ImageData[];
}

export function ImagePreview({ images: initialImages }: ImagePreviewProps) {
  const [copiedColors, setCopiedColors] = useState<Set<string>>(new Set());
  const [images, setImages] = useState<ImageData[]>([]);
  useEffect(() => {
    setImages(initialImages);
  }, [initialImages]);
  const copyToClipboard = async (text: string, colorKey: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedColors((prev) => new Set(prev).add(colorKey));
      setTimeout(() => {
        setCopiedColors((prev) => {
          const newSet = new Set(prev);
          newSet.delete(colorKey);
          return newSet;
        });
      }, 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const handleDeleteImage = async (id: string) => {
    // Confirmation dialog
    if (
      !confirm(
        "Are you sure you want to delete this image? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      console.log("Deleting image with ID:", id);
      const result = await kvDeleteImage(REALM.COLL_IMAGE, id);
      console.log("Delete result:", result);

      // Update local state immediately
      setImages(images.filter((image) => image._id !== id));

      toast.success("Image deleted successfully");
    } catch (err) {
      console.error("Failed to delete image: ", err);
      toast.error("Failed to delete image. Please try again.");
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
      {images.map((image, imageIndex) => (
        <Card
          key={imageIndex}
          className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
        >
          <CardContent className="space-y-4 px-4 pb-4">
            {/* Pixel Grid */}
            <div className="flex justify-center">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div
                  className="grid gap-0 mx-auto border border-gray-300 rounded"
                  style={{
                    gridTemplateColumns: `repeat(${image.value.meta.cols}, 6px)`,
                    gridTemplateRows: `repeat(${image.value.meta.rows}, 6px)`,
                    width: `${image.value.meta.cols * 6}px`,
                    height: `${image.value.meta.rows * 6}px`,
                  }}
                >
                  {image.value.matrix
                    .flat()
                    .map((colorIndex: number, index: number) => {
                      const color =
                        image.value.meta.palette[colorIndex.toString()];
                      return (
                        <div
                          key={index}
                          className="hover:scale-125 transition-transform cursor-pointer"
                          style={{
                            backgroundColor: color,
                            width: "6px",
                            height: "6px",
                          }}
                          title={`Pixel ${index}: Color ${colorIndex} (${color})`}
                        />
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Dimensions */}
            <div className="bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-lg text-center font-bold text-blue-900">
                {image.value.meta.cols} × {image.value.meta.rows}
              </p>
            </div>

            {/* Color Palette */}
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
              <h3 className="font-medium text-purple-800 mb-2 flex items-center gap-1 text-sm">
                <Palette className="w-3 h-3" />
                Colors ({Object.keys(image.value.meta.palette).length})
              </h3>
              <div className="grid grid-cols-3 gap-1">
                {Object.keys(image.value.meta.palette).map((colorKey) => {
                  const hexColor =
                    image.value.meta.palette[colorKey] || "#000000";
                  const isCopied = copiedColors.has(
                    `${imageIndex}-${colorKey}`
                  );

                  return (
                    <div
                      key={colorKey}
                      className="group relative bg-white rounded border border-gray-200 p-1 hover:shadow-sm transition-all duration-200 cursor-pointer"
                      onClick={() =>
                        copyToClipboard(hexColor, `${imageIndex}-${colorKey}`)
                      }
                    >
                      <div className="flex items-center gap-1">
                        <div
                          className="w-4 h-4 rounded border border-gray-300 flex-shrink-0"
                          style={{ backgroundColor: hexColor }}
                        />
                        <div className="flex-1 min-w-0">
                          <Badge
                            variant="secondary"
                            className="text-xs font-mono px-1 py-0"
                          >
                            {colorKey}
                          </Badge>
                        </div>
                      </div>

                      {/* Copy feedback */}
                      <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {isCopied ? (
                          <Check className="w-3 h-3 text-green-600" />
                        ) : (
                          <Copy className="w-3 h-3 text-gray-600" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 hover:bg-blue-50 hover:border-blue-300 transition-colors text-xs"
              >
                <Download className="w-3 h-3 mr-1" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-red-500 text-white hover:bg-red-600 hover:border-red-300 transition-colors text-xs"
                onClick={() => handleDeleteImage(image._id)}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
