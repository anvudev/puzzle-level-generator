import { BoardCell } from "@/config/game-types";
import { getElementIcon, getPipeIcon } from "./level-utils";
import { COLOR_MAPPING } from "@/config/game-constants";
import { elementGenerate, styleDecorator } from "./styleDecoration";

interface GenerateBoardProps {
  board: BoardCell[][];
  width: number;
  height: number;
  colorMapping?: Record<string, string>; // Optional color mapping
}

export const GenerateBoard = ({
  board,
  width,
  height,
  colorMapping,
}: GenerateBoardProps) => {
  // Use provided colorMapping or fallback to COLOR_MAPPING
  const colors = colorMapping || COLOR_MAPPING;

  return (
    <div
      className="w-full aspect-square grid gap-1 p-2"
      style={{
        gridTemplateColumns: `repeat(${width}, 1fr)`,
        gridTemplateRows: `repeat(${height}, 1fr)`,
      }}
    >
      {board.flat().map((cell, index) => (
        <div
          key={index}
          className="rounded text-3xl border border-gray-200 flex items-center justify-center"
          style={styleDecorator(cell)}
        >
          {elementGenerate(cell)}
        </div>
      ))}
    </div>
  );
};

export const GenerateBoardSmall = ({
  board,
  width,
  height,
  colorMapping,
}: GenerateBoardProps) => {
  // Use provided colorMapping or fallback to COLOR_MAPPING
  const colors = colorMapping || COLOR_MAPPING;

  return (
    <div
      className="w-full h-full grid gap-0.5 p-1"
      style={{
        gridTemplateColumns: `repeat(${width}, 1fr)`,
        gridTemplateRows: `repeat(${height}, 1fr)`,
      }}
    >
      {board.flat().map((cell, index) => (
        <div
          key={index}
          className="rounded-sm border border-gray-100"
          style={{
            backgroundColor:
              cell.type === "block"
                ? cell.color
                  ? (colors as Record<string, string>)[cell.color] || "#f3f4f6"
                  : "#e5e7eb"
                : "#f9fafb",
            fontSize: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* {cell.element === "Pipe" && getPipeIcon(cell.pipeDirection || "up")}
          {cell.element &&
            cell.element !== "Pipe" &&
            getElementIcon(cell.element)} */}
        </div>
      ))}
    </div>
  );
};
