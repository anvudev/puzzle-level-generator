"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Sparkles, Calendar, Package, Gift } from "lucide-react";
import type { ChangelogData, ChangelogType } from "@/types/changelog.types";

export function ChangelogDialog() {
  const [changelog, setChangelog] = useState<ChangelogData | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewUpdate, setHasNewUpdate] = useState(false);

  useEffect(() => {
    // Fetch changelog
    fetch("/changelog.json")
      .then((res) => res.json())
      .then((data: ChangelogData) => {
        setChangelog(data);

        // Check if there's a new update
        const lastSeenVersion = localStorage.getItem("lastSeenVersion");
        if (!lastSeenVersion || lastSeenVersion !== data.version) {
          setHasNewUpdate(true);
        }
      })
      .catch((error) => console.error("Error loading changelog:", error));
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    if (changelog) {
      localStorage.setItem("lastSeenVersion", changelog.version);
      setHasNewUpdate(false);
    }
  };

  const getTypeColor = (type: ChangelogType) => {
    switch (type) {
      case "feature":
        return "bg-gradient-to-r from-blue-400 to-blue-500";
      case "bugfix":
        return "bg-gradient-to-r from-rose-400 to-rose-500";
      case "release":
        return "bg-gradient-to-r from-purple-400 to-purple-500";
      case "improvement":
        return "bg-gradient-to-r from-emerald-400 to-emerald-500";
      default:
        return "bg-gradient-to-r from-slate-400 to-slate-500";
    }
  };

  const getTypeBorderColor = (type: ChangelogType) => {
    switch (type) {
      case "feature":
        return "border-blue-300";
      case "bugfix":
        return "border-rose-300";
      case "release":
        return "border-purple-300";
      case "improvement":
        return "border-emerald-300";
      default:
        return "border-slate-300";
    }
  };

  const getTypeLabel = (type: ChangelogType) => {
    switch (type) {
      case "feature":
        return "✨ Tính năng mới";
      case "bugfix":
        return "🔧 Sửa lỗi";
      case "release":
        return "🚀 Phát hành";
      case "improvement":
        return "💡 Cải thiện";
      default:
        return type;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 hover:from-blue-100 hover:to-purple-100 transition-all duration-300 shadow-sm hover:shadow-md rounded-full px-4"
          onClick={handleOpen}
        >
          <Bell className="w-4 h-4 text-blue-600 mr-2" />
          <span className="text-blue-700 font-medium">Có gì mới?</span>
          {hasNewUpdate && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] rounded-2xl border-2">
        <DialogHeader className="space-y-3 pb-4">
          <DialogTitle className="flex items-center gap-3 text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl">
              <Gift className="w-7 h-7 text-blue-600" />
            </div>
            Nhật ký cập nhật
          </DialogTitle>
          {changelog && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-slate-50 rounded-lg px-3 py-2 w-fit">
              <Package className="w-4 h-4 text-slate-600" />
              <span className="text-slate-600">Phiên bản hiện tại:</span>
              <Badge
                variant="outline"
                className="bg-white font-semibold text-slate-700 border-slate-300"
              >
                {changelog.version}
              </Badge>
            </div>
          )}
        </DialogHeader>

        <div className="h-[450px] overflow-y-auto pr-2 space-y-4">
          {changelog?.updates.map((update, index) => (
            <div
              key={update.version}
              className={`border-l-4 ${getTypeBorderColor(
                update.type
              )} pl-5 pb-4 bg-gradient-to-r from-slate-50/50 to-transparent rounded-r-xl pr-4 py-3 hover:from-slate-100/50 transition-colors duration-200`}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    className={`${getTypeColor(
                      update.type
                    )} text-white border-0 shadow-sm px-3 py-1 text-xs font-medium`}
                  >
                    {getTypeLabel(update.type)}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-white font-semibold border-slate-300"
                  >
                    v{update.version}
                  </Badge>
                  {index === 0 && (
                    <Badge className="bg-gradient-to-r from-emerald-400 to-emerald-500 text-white border-0 shadow-sm animate-pulse">
                      🎉 Mới nhất
                    </Badge>
                  )}
                </div>

                <h3 className="text-lg font-bold text-slate-800 leading-relaxed">
                  {update.title}
                </h3>

                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">
                    {new Date(update.date).toLocaleDateString("vi-VN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>

                <ul className="space-y-2.5 mt-3">
                  {update.items.map((item, itemIndex) => (
                    <li
                      key={itemIndex}
                      className="text-sm leading-relaxed text-slate-700 flex items-start gap-2"
                    >
                      <span className="text-blue-500 mt-1 flex-shrink-0">
                        •
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t-2 border-slate-100 mt-2">
          <p className="text-sm text-slate-600 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Cảm ơn bạn đã sử dụng Puzzle Level Generator!</span>
          </p>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="rounded-full px-6 hover:bg-slate-100 transition-colors"
          >
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
