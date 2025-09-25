import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";
import { Download } from "lucide-react";

export default function GenerateImage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <div className="container mx-auto px-6 py-8">
        <Card className="bg-gradient-to-br from-orange-50 to-orange-50 border-2 border-orange-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-full">
                  <Upload className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-xl bg-gradient-to-r from-orange-600 to-indigo-600 bg-clip-text text-transparent font-bold">
                    Tạo ảnh
                  </CardTitle>
                  <p className="text-sm text-orange-600 mt-1">
                    Tạo ảnh pixel từ png
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Tải ảnh từ lên
              </Button>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
