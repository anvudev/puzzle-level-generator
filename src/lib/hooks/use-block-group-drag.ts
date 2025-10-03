import { useState, useCallback, useMemo, useRef } from "react";
import type { GeneratedLevel } from "@/config/game-types";
import {
  getConnectedBlocks,
  moveBlockGroup,
  findClosestValidPosition,
  indexToPosition,
  type Position,
} from "@/lib/utils/block-group-utils";

export interface GroupDragState {
  isGroupMode: boolean;
  selectedGroup: Position[] | null;
  hoveredGroup: Position[] | null;
  isDragging: boolean;
  dragPreview: Position[] | null;
}

export interface UseBlockGroupDragReturn {
  // State
  groupDragState: GroupDragState;

  // Actions
  toggleGroupMode: () => void;
  handleCellHover: (index: number) => void;
  handleCellLeave: () => void;
  handleGroupDragStart: (index: number) => void;
  handleGroupDragOver: (index: number) => void;
  handleGroupDrop: (index: number) => void;
  handleGroupDragEnd: () => void;
  clearSelection: () => void;

  // Utilities
  isInSelectedGroup: (index: number) => boolean;
  isInHoveredGroup: (index: number) => boolean;
  isInDragPreview: (index: number) => boolean;
  canDropAtPosition: (index: number) => boolean;
}

export function useBlockGroupDrag(
  level: GeneratedLevel,
  onLevelUpdate?: (updatedLevel: GeneratedLevel) => void
): UseBlockGroupDragReturn {
  const [groupDragState, setGroupDragState] = useState<GroupDragState>({
    isGroupMode: false,
    selectedGroup: null,
    hoveredGroup: null,
    isDragging: false,
    dragPreview: null,
  });

  const board = level.board;
  const width = level.config.width;
  const _height = level.config.height;

  // Cache for connected blocks to avoid recalculation
  const connectedBlocksCache = useRef<Map<string, Position[]>>(new Map());

  // Toggle between single block and group drag mode
  const toggleGroupMode = useCallback(() => {
    setGroupDragState((prev) => ({
      ...prev,
      isGroupMode: !prev.isGroupMode,
      selectedGroup: null,
      hoveredGroup: null,
      isDragging: false,
      dragPreview: null,
    }));
  }, []);

  // Memoized function to get connected blocks with caching
  const getConnectedBlocksCached = useCallback(
    (x: number, y: number): Position[] => {
      const cacheKey = `${x},${y}`;

      if (connectedBlocksCache.current.has(cacheKey)) {
        return connectedBlocksCache.current.get(cacheKey)!;
      }

      const connectedBlocks = getConnectedBlocks(board, x, y);
      connectedBlocksCache.current.set(cacheKey, connectedBlocks);
      return connectedBlocks;
    },
    [board]
  );

  // Clear cache when board changes
  useMemo(() => {
    connectedBlocksCache.current.clear();
  }, []);

  // Handle cell hover to show connected group
  const handleCellHover = useCallback(
    (index: number) => {
      if (!groupDragState.isGroupMode || groupDragState.isDragging) return;

      const position = indexToPosition(index, width);
      const cell = board[position.y][position.x];

      if (cell.type === "block") {
        const connectedBlocks = getConnectedBlocksCached(
          position.x,
          position.y
        );
        setGroupDragState((prev) => ({
          ...prev,
          hoveredGroup: connectedBlocks,
        }));
      } else {
        setGroupDragState((prev) => ({
          ...prev,
          hoveredGroup: null,
        }));
      }
    },
    [
      board,
      width,
      groupDragState.isGroupMode,
      groupDragState.isDragging,
      getConnectedBlocksCached,
    ]
  );

  // Handle cell leave
  const handleCellLeave = useCallback(() => {
    if (!groupDragState.isDragging) {
      setGroupDragState((prev) => ({
        ...prev,
        hoveredGroup: null,
      }));
    }
  }, [groupDragState.isDragging]);

  // Start dragging a group
  const handleGroupDragStart = useCallback(
    (index: number) => {
      if (!groupDragState.isGroupMode) return;

      const position = indexToPosition(index, width);
      const cell = board[position.y][position.x];

      if (cell.type === "block") {
        const connectedBlocks = getConnectedBlocksCached(
          position.x,
          position.y
        );
        setGroupDragState((prev) => ({
          ...prev,
          selectedGroup: connectedBlocks,
          isDragging: true,
          dragPreview: connectedBlocks,
          hoveredGroup: null,
        }));
      }
    },
    [board, width, groupDragState.isGroupMode, getConnectedBlocksCached]
  );

  // Handle drag over
  const handleGroupDragOver = useCallback(
    (index: number) => {
      if (!groupDragState.isDragging || !groupDragState.selectedGroup) return;

      const targetPosition = indexToPosition(index, width);
      const validPosition = findClosestValidPosition(
        board,
        groupDragState.selectedGroup,
        targetPosition.x,
        targetPosition.y
      );

      if (validPosition) {
        const previewBlocks = groupDragState.selectedGroup.map((pos) => ({
          x: pos.x + validPosition.deltaX,
          y: pos.y + validPosition.deltaY,
        }));

        setGroupDragState((prev) => ({
          ...prev,
          dragPreview: previewBlocks,
        }));
      }
    },
    [board, width, groupDragState.isDragging, groupDragState.selectedGroup]
  );

  // Handle drop
  const handleGroupDrop = useCallback(
    (index: number) => {
      if (
        !groupDragState.isDragging ||
        !groupDragState.selectedGroup ||
        !onLevelUpdate
      )
        return;

      const targetPosition = indexToPosition(index, width);
      const validPosition = findClosestValidPosition(
        board,
        groupDragState.selectedGroup,
        targetPosition.x,
        targetPosition.y
      );

      if (validPosition) {
        const newBoard = moveBlockGroup(
          board,
          groupDragState.selectedGroup,
          validPosition.deltaX,
          validPosition.deltaY
        );

        const updatedLevel: GeneratedLevel = {
          ...level,
          board: newBoard,
        };

        onLevelUpdate(updatedLevel);
      }

      setGroupDragState((prev) => ({
        ...prev,
        selectedGroup: null,
        isDragging: false,
        dragPreview: null,
      }));
    },
    [
      board,
      width,
      level,
      onLevelUpdate,
      groupDragState.isDragging,
      groupDragState.selectedGroup,
    ]
  );

  // Handle drag end
  const handleGroupDragEnd = useCallback(() => {
    setGroupDragState((prev) => ({
      ...prev,
      selectedGroup: null,
      isDragging: false,
      dragPreview: null,
    }));
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setGroupDragState((prev) => ({
      ...prev,
      selectedGroup: null,
      hoveredGroup: null,
      isDragging: false,
      dragPreview: null,
    }));
  }, []);

  // Utility functions
  const isInSelectedGroup = useCallback(
    (index: number) => {
      if (!groupDragState.selectedGroup) return false;
      const position = indexToPosition(index, width);
      return groupDragState.selectedGroup.some(
        (pos) => pos.x === position.x && pos.y === position.y
      );
    },
    [groupDragState.selectedGroup, width]
  );

  const isInHoveredGroup = useCallback(
    (index: number) => {
      if (!groupDragState.hoveredGroup) return false;
      const position = indexToPosition(index, width);
      return groupDragState.hoveredGroup.some(
        (pos) => pos.x === position.x && pos.y === position.y
      );
    },
    [groupDragState.hoveredGroup, width]
  );

  const isInDragPreview = useCallback(
    (index: number) => {
      if (!groupDragState.dragPreview) return false;
      const position = indexToPosition(index, width);
      return groupDragState.dragPreview.some(
        (pos) => pos.x === position.x && pos.y === position.y
      );
    },
    [groupDragState.dragPreview, width]
  );

  const canDropAtPosition = useCallback(
    (index: number) => {
      if (!groupDragState.selectedGroup) return false;
      const targetPosition = indexToPosition(index, width);
      const validPosition = findClosestValidPosition(
        board,
        groupDragState.selectedGroup,
        targetPosition.x,
        targetPosition.y
      );
      return validPosition !== null;
    },
    [board, width, groupDragState.selectedGroup]
  );

  return {
    groupDragState,
    toggleGroupMode,
    handleCellHover,
    handleCellLeave,
    handleGroupDragStart,
    handleGroupDragOver,
    handleGroupDrop,
    handleGroupDragEnd,
    clearSelection,
    isInSelectedGroup,
    isInHoveredGroup,
    isInDragPreview,
    canDropAtPosition,
  };
}
