import { COLOR_MAPPING } from "@/config/game-constants";
import { getElementIcon, getPipeIcon } from "./level-utils";
import { BoardCell } from "@/config/game-types";

interface StyleDecoratorProps {
  type: BoardCell["type"];
  color?: string | null;
  element?: string | null;
  pipeDirection?: "up" | "down" | "left" | "right";
}

export function styleDecorator({
  type,
  color,
  element,
  pipeDirection,
}: StyleDecoratorProps) {
  return {
    backgroundColor:
      type === "wall"
        ? ""
        : element === "Pipe"
        ? ""
        : element === "PullPin"
        ? ""
        : element === "Moving"
        ? ""
        : color
        ? COLOR_MAPPING[parseInt(color) as keyof typeof COLOR_MAPPING] ||
          "#f3f4f6"
        : "#f3f4f6",
    color:
      element === "Pipe"
        ? "#fff"
        : element === "PullPin"
        ? "#fff"
        : color && ["4", "12"].includes(color) // Yellow, White
        ? "#000"
        : "#fff",
  };
}

export const elementGenerate = ({
  type,
  element,
  color,
  pipeDirection,
}: StyleDecoratorProps) => {
  return (
    <>
      {type == "wall" && <span className="opacity-50">🧱</span>}
      {type == "block" && !element && (
        <span className="text-sm font-medium text-white">
          {color?.replace("color_", "")}
        </span>
      )}
      {element === "Pipe" && getPipeIcon(pipeDirection || "up")}
      {element && element !== "Pipe" && getElementIcon(element || "")}
    </>
  );
};

export const blockStyleDecorator = (block: {
  type: "empty" | "block" | "wall";
  color?: string | null;
  element?: string | null;
}) => {
  return styleDecorator({
    type: block.type,
    color: block.color,
    element: block.element,
  });
};
