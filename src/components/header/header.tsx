import {
  Sparkles,
  Gamepad2,
  Zap,
  Palette,
  Grid3X3,
  RefreshCw,
} from "lucide-react";
import { Button } from "../ui/button";

export const Header = ({
  handleGenerateLevel,
  isGenerating,
  isShowButton,
}: {
  handleGenerateLevel: () => void;
  isGenerating: boolean;
  isShowButton: boolean;
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-orange-600 to-red-500 p-8 text-white shadow-2xl">
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 bg-black/30 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Gamepad2 className="w-6 h-6 text-white" />
                </div>
                <div className="w-12 h-12 bg-black/30 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="w-12 h-12 bg-black/30 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-black mb-2">
                Puzzle Level Generator
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-full px-4 py-2">
                <Palette className="w-4 h-4" />
                <span className="text-sm font-medium">12 màu sắc</span>
              </div>
              <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-full px-4 py-2">
                <Grid3X3 className="w-4 h-4" />
                <span className="text-sm font-medium">7 loại element</span>
              </div>
            </div>
          </div>
          {isShowButton && (
            <div className="hidden lg:block">
              <Button
                onClick={handleGenerateLevel}
                disabled={isGenerating}
                size="lg"
                className="bg-white text-orange-600 hover:bg-white/90 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 rounded-2xl font-bold text-lg px-8 py-4 h-auto"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-6 h-6 mr-3 animate-spin" />
                    Đang tạo level...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6 mr-3" />
                    Tạo Level
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
