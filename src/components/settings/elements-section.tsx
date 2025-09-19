"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";
import { ELEMENT_TYPES } from "@/config/game-constants";
import type { LevelConfig } from "@/config/game-types";

interface ElementsSectionProps {
  config: LevelConfig;
  updateConfig: (updates: Partial<LevelConfig>) => void;
}

export function ElementsSection({
  config,
  updateConfig,
}: ElementsSectionProps) {
  const updateElement = (elementType: string, count: number) => {
    const elements = { ...config.elements };
    if (count === 0) {
      delete elements[elementType];
    } else {
      elements[elementType] = count;
    }

    // Special handling for Pipe element
    if (elementType === "Pipe") {
      const newPipeCount = count; // Use the exact count from input

      // Ensure pipeBlockCounts array matches the new pipe count
      const currentBlockCounts = config.pipeBlockCounts || [];
      const newBlockCounts = Array(newPipeCount)
        .fill(0)
        .map((_, index) => currentBlockCounts[index] || 3);

      updateConfig({
        elements,
        pipeCount: newPipeCount,
        pipeBlockCounts: newBlockCounts,
      });
    }
    // Special handling for Bomb element
    else if (elementType === "Bomb") {
      const newBombCount = count;

      // Ensure bombCounts array matches the new bomb count
      const currentBombCounts = config.bombCounts || [];
      const newBombCounts = Array(newBombCount)
        .fill(0)
        .map((_, index) => currentBombCounts[index] || 2);

      updateConfig({
        elements,
        bombCounts: newBombCounts,
      });
    }
    // Special handling for Ice element
    else if (elementType === "IceBlock") {
      const newIceCount = count;

      // Ensure iceCounts array matches the new ice count
      const currentIceCounts = config.iceCounts || [];
      const newIceCounts = Array(newIceCount)
        .fill(0)
        .map((_, index) => currentIceCounts[index] || 2);

      updateConfig({
        elements,
        iceCounts: newIceCounts,
      });
    } else {
      updateConfig({ elements });
    }
  };

  return (
    <Card className="lg:col-span-2 bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 bg-orange-100 rounded-full">
            <Zap className="w-6 h-6 text-orange-600" />
          </div>
          <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent font-bold">
            Element Đặc Biệt
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(ELEMENT_TYPES).map(([elementKey, element]) => (
            <div
              key={elementKey}
              className="group p-5 bg-white/80 backdrop-blur-sm border-2 border-orange-100 rounded-xl hover:border-orange-300 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {elementKey === "barrel" && "📦i"}
                    {elementKey === "ice_block" && "🧊"}
                    {elementKey === "pipe" && "🔧"}
                    {elementKey === "block_lock" && "🔒"}
                    {elementKey === "barrier_lock" && "🚧"}
                    {elementKey === "bomb" && "💣"}
                    {elementKey === "moving" && "🔄"}
                  </span>
                  <div>
                    <h4 className="font-bold text-gray-800 group-hover:text-orange-700 transition-colors">
                      {element.name}
                    </h4>
                    <Badge className="bg-orange-600 text-white font-semibold hover:bg-orange-700">
                      {element.points} điểm
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Input
                    type="number"
                    min="0"
                    max="999"
                    value={config.elements[elementKey] || 0}
                    onChange={(e) =>
                      updateElement(
                        elementKey,
                        Number.parseInt(e.target.value) || 0
                      )
                    }
                    className="w-16 h-12 text-center text-lg font-bold border-2 border-orange-200 focus:border-orange-400 rounded-lg"
                  />
                  <span className="text-xs text-gray-500 font-medium">
                    Số lượng
                  </span>
                </div>
              </div>

              {/* Pipe Configuration */}
              {elementKey === "Pipe" &&
                (config.elements[elementKey] || 0) > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h5 className="text-sm font-semibold text-blue-800 mb-3">
                      Số blocks cho từng pipe:
                    </h5>

                    {/* Individual pipe configurations */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto border border-gray-200 p-2 rounded">
                        {(() => {
                          const pipeCount =
                            config.pipeCount ||
                            config.elements[elementKey] ||
                            0;

                          return Array(pipeCount);
                        })()
                          .fill(0)
                          .map((_, index) => (
                            <div
                              key={index}
                              className="flex flex-col items-center"
                            >
                              <span className="text-xs text-blue-600 font-medium mb-1">
                                Pipe {index + 1}
                              </span>
                              <Input
                                type="number"
                                min="1"
                                max="20"
                                value={
                                  (config.pipeBlockCounts &&
                                    config.pipeBlockCounts[index]) ||
                                  3
                                }
                                onChange={(e) => {
                                  const newBlockCounts = [
                                    ...(config.pipeBlockCounts || []),
                                  ];
                                  newBlockCounts[index] =
                                    Number.parseInt(e.target.value) || 3;
                                  updateConfig({
                                    pipeBlockCounts: newBlockCounts,
                                  });
                                }}
                                className="w-16 h-8 text-center text-sm border-blue-300 focus:border-blue-500"
                              />
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

              {/* Bomb Count Inputs */}
              {elementKey === "Bomb" &&
                config.elements[elementKey] &&
                config.elements[elementKey]! > 0 && (
                  <div className="mt-3">
                    <div className="text-sm font-medium text-red-600 mb-2">
                      Bomb Power Settings:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        const bombCount = config.elements[elementKey] || 0;

                        return Array(bombCount);
                      })()
                        .fill(0)
                        .map((_, index) => (
                          <div
                            key={index}
                            className="flex flex-col items-center"
                          >
                            <span className="text-xs text-red-600 font-medium mb-1">
                              Bomb {index + 1}
                            </span>
                            <Input
                              type="number"
                              min="1"
                              max="20"
                              value={
                                (config.bombCounts &&
                                  config.bombCounts[index]) ||
                                2
                              }
                              onChange={(e) => {
                                const newBombCounts = [
                                  ...(config.bombCounts || []),
                                ];
                                newBombCounts[index] =
                                  Number.parseInt(e.target.value) || 2;
                                updateConfig({
                                  bombCounts: newBombCounts,
                                });
                              }}
                              className="w-16 h-8 text-center text-sm border-red-300 focus:border-red-500"
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                )}

              {/* Ice Count Inputs */}
              {elementKey === "IceBlock" &&
                config.elements[elementKey] &&
                config.elements[elementKey]! > 0 && (
                  <div className="mt-3">
                    <div className="text-sm font-medium text-blue-600 mb-2">
                      Ice Hit Settings:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        const iceCount = config.elements[elementKey] || 0;

                        return Array(iceCount);
                      })()
                        .fill(0)
                        .map((_, index) => (
                          <div
                            key={index}
                            className="flex flex-col items-center"
                          >
                            <span className="text-xs text-blue-600 font-medium mb-1">
                              Ice {index + 1}
                            </span>
                            <Input
                              type="number"
                              min="1"
                              max="8"
                              value={
                                (config.iceCounts && config.iceCounts[index]) ||
                                2
                              }
                              onChange={(e) => {
                                const newIceCounts = [
                                  ...(config.iceCounts || []),
                                ];
                                newIceCounts[index] =
                                  Number.parseInt(e.target.value) || 2;
                                updateConfig({
                                  iceCounts: newIceCounts,
                                });
                              }}
                              className="w-16 h-8 text-center text-sm border-blue-300 focus:border-blue-500"
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                )}

              <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg">
                {element.description}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
