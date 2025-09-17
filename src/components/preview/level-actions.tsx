"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Download, Copy, RefreshCw, CheckCircle } from "lucide-react";
import type { GeneratedLevel } from "@/config/game-types";

interface LevelActionsProps {
  level: GeneratedLevel;
  onRegenerate?: () => void;
}

export function LevelActions({ level, onRegenerate }: LevelActionsProps) {
  const [copied, setCopied] = useState(false);

  const getExportData = () => {
    return JSON.stringify(level, null, 2);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getExportData());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDownload = () => {
    const data = getExportData();
    const filename = `level-${level.id}.json`;
    const blob = new Blob([data], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Quick Actions */}
        {onRegenerate && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRegenerate}
            className="flex items-center gap-2 w-full"
          >
            <RefreshCw className="w-4 h-4" />
            Regenerate
          </Button>
        )}

        {/* Export Options */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex items-center gap-2 flex-1"
          >
            {copied ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            {copied ? "Copied!" : "Copy JSON"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="flex items-center gap-2 flex-1"
          >
            <Download className="w-4 h-4" />
            Download JSON
          </Button>
        </div>

        {/* Preview Export */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full">
              Preview JSON
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>JSON Preview</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">JSON Format</Badge>
                <Badge variant="outline">Level ID: {level.id}</Badge>
              </div>
              <Textarea
                value={getExportData()}
                readOnly
                className="min-h-[400px] font-mono text-sm"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCopy}>
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy to Clipboard
                    </>
                  )}
                </Button>
                <Button onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download File
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
