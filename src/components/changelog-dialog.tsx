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
import { Bell, Sparkles, Calendar, Package } from "lucide-react";
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
        return "bg-blue-500";
      case "bugfix":
        return "bg-red-500";
      case "release":
        return "bg-purple-500";
      case "improvement":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getTypeLabel = (type: ChangelogType) => {
    switch (type) {
      case "feature":
        return "Tính năng mới";
      case "bugfix":
        return "Sửa lỗi";
      case "release":
        return "Phát hành";
      case "improvement":
        return "Cải thiện";
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
          className="relative bg-orange-300 border-orange-500"
          onClick={handleOpen}
        >
          <Bell className="w-4 h-4 text-orange-500" />
          <span className="text-orange-100 font-bold">Thông báo</span>
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="w-6 h-6 text-orange-500" />
            Nhật ký cập nhật
          </DialogTitle>
          {changelog && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="w-4 h-4" />
              Phiên bản hiện tại:{" "}
              <Badge variant="outline">{changelog.version}</Badge>
            </div>
          )}
        </DialogHeader>

        <div className="h-[500px] overflow-y-auto pr-4">
          <div className="space-y-6">
            {changelog?.updates.map((update, index) => (
              <div
                key={update.version}
                className="border-l-4 border-orange-500 pl-4 pb-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Badge
                      className={`${getTypeColor(update.type)} text-white`}
                    >
                      {getTypeLabel(update.type)}
                    </Badge>
                    <Badge variant="outline">v{update.version}</Badge>
                    {index === 0 && (
                      <Badge className="bg-green-500 text-white">
                        Mới nhất
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-xl font-bold">{update.title}</h3>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {new Date(update.date).toLocaleDateString("vi-VN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>

                  <ul className="space-y-2 mt-3">
                    {update.items.map((item, itemIndex) => (
                      <li
                        key={itemIndex}
                        className="text-sm leading-relaxed pl-4"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Cảm ơn bạn đã sử dụng Puzzle Level Generator! 🎉
          </p>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
