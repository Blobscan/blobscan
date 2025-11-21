import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

import { IconButton } from "./IconButton";
import type { IconButtonProps } from "./IconButton";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";

export interface NavArrowProps {
  type: "prev" | "next";
  size: IconButtonProps["size"];
  tooltip?: string;
  onClick(type: "next" | "prev"): void;
  disabled?: boolean;
}

export function NavArrow({
  type,
  size,
  tooltip,
  onClick,
  disabled,
}: NavArrowProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        className={disabled ? "cursor-default" : "cursor-pointer"}
      >
        <IconButton
          size={size}
          variant={disabled ? "disabled" : "default"}
          onClick={() => onClick(type)}
          disabled={disabled}
        >
          {type === "next" ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
        {!disabled && <TooltipContent>{tooltip || "Next"}</TooltipContent>}
      </TooltipTrigger>
    </Tooltip>
  );
}
