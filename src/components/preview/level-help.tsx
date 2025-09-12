"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle, Keyboard, Lightbulb, Zap } from "lucide-react";

export function LevelHelp() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4" />
          Help & Tips
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Level Editor Help & Tips</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Editor Tools */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Editor Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Add</Badge>
                  <span className="text-sm">Click empty cells to add blocks</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Remove</Badge>
                  <span className="text-sm">Click blocks to remove them</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Color</Badge>
                  <span className="text-sm">Click blocks to change color</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Pipe</Badge>
                  <span className="text-sm">Add/edit pipes with direction</span>
                </div>
              </div>

              <div className="pt-2 border-t">
                <h4 className="font-medium mb-2">Pipe Editing</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Click pipe to see contents</li>
                  <li>• Use "Edit Contents" to modify pipe blocks</li>
                  <li>• Change direction with arrow buttons</li>
                  <li>• Each pipe can hold 1-8 blocks</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Validation Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Validation Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div>
                  <Badge variant="destructive" className="mb-1">Critical</Badge>
                  <p className="text-sm">Each color must be divisible by 3</p>
                </div>
                <div>
                  <Badge variant="destructive" className="mb-1">Critical</Badge>
                  <p className="text-sm">Total blocks must match config</p>
                </div>
                <div>
                  <Badge variant="secondary" className="mb-1">Warning</Badge>
                  <p className="text-sm">All selected colors should be used</p>
                </div>
                <div>
                  <Badge variant="secondary" className="mb-1">Warning</Badge>
                  <p className="text-sm">All blocks should be connected</p>
                </div>
              </div>

              <div className="pt-2 border-t">
                <h4 className="font-medium mb-2">Color Balance</h4>
                <p className="text-sm text-muted-foreground">
                  The game requires each color to have a number of blocks 
                  divisible by 3. This includes both board blocks and pipe contents.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Keyboard Shortcuts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Keyboard className="w-5 h-5" />
                Keyboard Shortcuts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Switch to Add tool</span>
                  <Badge variant="outline">1</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Switch to Remove tool</span>
                  <Badge variant="outline">2</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Switch to Color tool</span>
                  <Badge variant="outline">3</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Switch to Pipe tool</span>
                  <Badge variant="outline">4</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Copy level data</span>
                  <Badge variant="outline">Ctrl+C</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Download level</span>
                  <Badge variant="outline">Ctrl+S</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Best Practices */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-sm">Color Distribution</h4>
                  <p className="text-xs text-muted-foreground">
                    Distribute colors evenly across the board for better gameplay balance.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm">Pipe Placement</h4>
                  <p className="text-xs text-muted-foreground">
                    Place pipes strategically to create interesting puzzle mechanics.
                    Ensure pipe directions don't lead off the board.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm">Board Connectivity</h4>
                  <p className="text-xs text-muted-foreground">
                    Keep all blocks connected to ensure the level is solvable.
                    Isolated blocks can make the puzzle impossible.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm">Testing</h4>
                  <p className="text-xs text-muted-foreground">
                    Always check the validation panel before finalizing your level.
                    Fix any critical errors before exporting.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h3 className="font-medium mb-2">Quick Start Guide</h3>
          <ol className="text-sm space-y-1 text-muted-foreground">
            <li>1. Generate a level using the configuration panel</li>
            <li>2. Click "Chỉnh sửa Level" to open the editor</li>
            <li>3. Select a tool (Add, Remove, Color, Pipe)</li>
            <li>4. Click on board cells to make changes</li>
            <li>5. Check the validation panel for any issues</li>
            <li>6. Export your level when satisfied</li>
          </ol>
        </div>
      </DialogContent>
    </Dialog>
  );
}
