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
    updateConfig({ elements });
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
                    {elementKey === "block" && "🧱"}
                    {elementKey === "barrel" && "🛢️"}
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
