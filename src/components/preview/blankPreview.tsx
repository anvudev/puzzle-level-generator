import { Grid3X3, RefreshCw, Settings, Sparkles } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";

export const BlankPreview = ({
  handleGenerateLevel,
  isGenerating,
  setActiveTab,
}: {
  handleGenerateLevel: () => void;
  isGenerating: boolean;
  setActiveTab: (tab: string) => void;
}) => {
  return (
    <Card className="border-2 border-dashed border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl shadow-xl overflow-hidden">
      <CardContent className="flex flex-col items-center justify-center py-20">
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl flex items-center justify-center shadow-2xl animate-bounce">
            <Grid3X3 className="w-12 h-12 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
            <Sparkles className="w-4 h-4 text-yellow-800" />
          </div>
        </div>
        <h3 className="text-3xl font-black text-gray-800 mb-4 text-center">
          Sẵn sàng tạo level đầu tiên?
        </h3>
        <p className="text-gray-600 text-center mb-8 max-w-lg text-lg leading-relaxed">
          Cấu hình các thông số theo ý muốn và bắt đầu tạo những level puzzle
          thú vị và thách thức!
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={() => setActiveTab("config")}
            variant="outline"
            size="lg"
            className="border-2 border-orange-300 text-orange-700 hover:bg-orange-50 rounded-2xl font-bold px-8"
          >
            <Settings className="w-5 h-5 mr-2" />
            Cấu hình trước
          </Button>
          <Button
            onClick={handleGenerateLevel}
            disabled={isGenerating}
            size="lg"
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 rounded-2xl font-bold px-8"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Đang tạo...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Tạo ngay
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
