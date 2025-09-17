import { BoardCell } from "@/config/game-types";
import { getElementIcon, getPipeIcon } from "./level-utils";
import { GAME_COLORS } from "@/config/game-constants";

interface GenerateBoardProps {
  board: BoardCell[][];
  width: number;
  height: number;
}

export const GenerateBoard = ({ board, width, height }: GenerateBoardProps) => {
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
          style={{
            backgroundColor:
              cell.type === "block"
                ? cell.color
                  ? GAME_COLORS[cell.color as keyof typeof GAME_COLORS] ||
                    "#f3f4f6"
                  : ""
                : "#f9fafb",
          }}
        >
          {cell.element === "Pipe" && getPipeIcon(cell.pipeDirection || "up")}
          {cell.element &&
            cell.element !== "Pipe" &&
            getElementIcon(cell.element)}
        </div>
      ))}
    </div>
  );
};

export const GenerateBoardSmall = ({
  board,
  width,
  height,
}: GenerateBoardProps) => {
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
                  ? GAME_COLORS[cell.color as keyof typeof GAME_COLORS] ||
                    "#f3f4f6"
                  : "#e5e7eb"
                : "#f9fafb",
            fontSize: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {cell.element === "Pipe" && getPipeIcon(cell.pipeDirection || "up")}
          {cell.element &&
            cell.element !== "Pipe" &&
            getElementIcon(cell.element)}
        </div>
      ))}
    </div>
  );
};
