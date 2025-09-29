"use client";
import { ImagePreview } from "@/components/image/image-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useImageGenerator } from "@/lib/hooks/use-image-generator";
import { Palette, Filter, X, Search, Grid3X3, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { COLOR_MAPPING, IMAGE_SIZE_OPTIONS } from "@/config/game-constants";
import { orderBy } from "lodash-es";
interface ImageData {
  _id: string;
  createdAt?: string;
  updatedAt?: string;
  value: {
    meta: {
      cols: number;
      rows: number;
      palette: Record<string, string>;
    };
    matrix: number[][];
  };
}

interface FilterState {
  colorCount: number | null;
  selectedColors: string[];
  searchTerm: string;
  sortBy: "asc" | "desc";
}

export default function Favorite() {
  const { getImages } = useImageGenerator();
  const [images, setImages] = useState<ImageData[]>([]);
  const [allImages, setAllImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    colorCount: null,
    selectedColors: [],
    searchTerm: "",
    sortBy: "desc",
  });

  // Apply all filters
  const applyFilters = () => {
    let filtered = [...allImages];

    // Filter by color count
    if (filters.colorCount !== null && filters.colorCount > 0) {
      filtered = filtered.filter((image) => {
        const paletteColorCount = Object.keys(
          image.value?.meta?.palette || {}
        ).length;
        return paletteColorCount === filters.colorCount;
      });
    }

    // Filter by selected colors
    if (filters.selectedColors.length > 0) {
      filtered = filtered.filter((image) => {
        const imagePalette = Object.values(image.value?.meta?.palette || {});
        return filters.selectedColors.every((selectedColor) =>
          imagePalette.includes(
            COLOR_MAPPING[parseInt(selectedColor) as keyof typeof COLOR_MAPPING]
          )
        );
      });
    }

    // Apply sorting
    filtered = orderBy(
      filtered,
      [(item) => item.updatedAt || item.createdAt || item._id],
      [filters.sortBy]
    );

    setImages(filtered);
  };

  const filterBySize = (size: string) => {
    setLoading(true);
    setImages(
      allImages.filter(
        (image) =>
          image.value?.meta?.cols === parseInt(size.split("x")[0]) &&
          image.value?.meta?.rows === parseInt(size.split("x")[1])
      )
    );
    setLoading(false);
  };

  // Update filter functions
  const updateColorCountFilter = (count: number | null) => {
    setFilters((prev) => ({ ...prev, colorCount: count }));
  };

  const toggleColorFilter = (colorKey: string) => {
    setFilters((prev) => ({
      ...prev,
      selectedColors: prev.selectedColors.includes(colorKey)
        ? prev.selectedColors.filter((c) => c !== colorKey)
        : [...prev.selectedColors, colorKey],
    }));
  };

  const updateSortBy = (sortBy: "asc" | "desc") => {
    setFilters((prev) => ({ ...prev, sortBy }));
  };

  const clearAllFilters = () => {
    setFilters({
      colorCount: null,
      selectedColors: [],
      searchTerm: "",
      sortBy: "desc",
    });
  };

  // Apply filters whenever filters change
  useEffect(() => {
    applyFilters();
  }, [filters, allImages]);

  const loadImages = async () => {
    try {
      setLoading(true);
      setError(null);
      const images = await getImages();
      console.log("Images:", images);
      console.log("Loaded images:", images);
      setAllImages(images || []); // Store original data
      setImages(images || []); // Display data
    } catch (err) {
      console.error("Error loading images:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);
  // Debug: Xem cấu trúc data

  if (loading) {
    return <div className="p-4">Loading images...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Filter Panel */}
      <Card className="shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="w-5 h-5 text-blue-600" />
            Image Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter Controls Row */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Color Count Filter */}
            <div className="flex items-center gap-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Grid3X3 className="w-4 h-4 text-blue-600" />
                Color Count:
              </Label>
              <Input
                type="number"
                min={1}
                max={12}
                placeholder="All"
                value={filters.colorCount || ""}
                onChange={(e) =>
                  updateColorCountFilter(
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                className="w-20 h-8"
              />
            </div>

            {/* Clear Filters Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Clear All
            </Button>

            {/* Results Count */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Search className="w-4 h-4" />
              {images.length} /{allImages.length}
            </div>
            <div className="flex text-blue-500 font-bold items-center gap-2 text-sm text-gray-600">
              <h4>Image Size:</h4>
              <select
                onChange={(e) => filterBySize(e.target.value)}
                className="w-20 h-8 bg-orange-200 rounded-md"
              >
                {IMAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Sort by:</Label>
              <select
                value={filters.sortBy}
                onChange={(e) => updateSortBy(e.target.value as "asc" | "desc")}
                className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Palette className="w-4 h-4 text-purple-600" />
              Filter by Colors:
            </Label>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
              {Object.keys(COLOR_MAPPING).map((colorKey) => {
                const hexColor =
                  COLOR_MAPPING[
                    parseInt(colorKey) as keyof typeof COLOR_MAPPING
                  ];
                const isSelected = filters.selectedColors.includes(colorKey);

                return (
                  <button
                    key={colorKey}
                    onClick={() => toggleColorFilter(colorKey)}
                    className={`
                      relative group flex flex-col items-center p-2 rounded-lg border-2 transition-all duration-200
                      ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 shadow-md"
                          : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                      }
                    `}
                  >
                    <div
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: hexColor }}
                    />
                    <Badge
                      variant={isSelected ? "default" : "secondary"}
                      className="text-xs mt-1"
                    >
                      {colorKey}
                    </Badge>
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <X className="w-2 h-2 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Filters Display */}
          {(filters.colorCount !== null ||
            filters.selectedColors.length > 0) && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
              <span className="text-sm font-medium text-gray-600">
                Active filters:
              </span>
              {filters.colorCount !== null && (
                <Badge variant="outline" className="flex items-center gap-1">
                  {filters.colorCount} colors
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-red-500"
                    onClick={() => updateColorCountFilter(null)}
                  />
                </Badge>
              )}
              {filters.selectedColors.map((colorKey) => (
                <Badge
                  key={colorKey}
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  <div
                    className="w-3 h-3 rounded-full border"
                    style={{
                      backgroundColor:
                        COLOR_MAPPING[
                          parseInt(colorKey) as keyof typeof COLOR_MAPPING
                        ],
                    }}
                  />
                  Color {colorKey}
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-red-500"
                    onClick={() => toggleColorFilter(colorKey)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {images.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No images found</h3>
            <p className="text-sm">
              Try adjusting your filters to see more results.
            </p>
          </div>
        </Card>
      ) : (
        <ImagePreview images={images} />
      )}
    </div>
  );
}
