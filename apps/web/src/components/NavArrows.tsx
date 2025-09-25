import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

import { IconButton } from "./IconButton";
import type { IconButtonProps } from "./IconButton";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";

export interface NavArrowProps {
  type: "prev" | "next";
  size: IconButtonProps["size"];
  tooltip?: string;
  onClick?(type: "next" | "prev"): void;
  disabled?: boolean;
}

function NavArrow({ type, size, tooltip, onClick, disabled }: NavArrowProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        className={disabled ? "cursor-default" : "cursor-pointer"}
      >
        <IconButton
          size={size}
          variant={disabled ? "disabled" : "default"}
          onClick={() => {
            if (onClick) {
              onClick(type);
            }
          }}
          disabled={disabled}
        >
          {type === "next" ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
        {!disabled && <TooltipContent>{tooltip || "Next"}</TooltipContent>}
      </TooltipTrigger>
    </Tooltip>
  );
}

type NavArrowData = Partial<{
  tooltip: string;
  disabled: boolean;
}>;
export interface NavArrowsProps {
  size?: IconButtonProps["size"];
  arrows?: Partial<{
    next: NavArrowData;
    prev: NavArrowData;
  }>;
  onClick(direction: "next" | "prev"): void;
}
export function NavArrows({
  size = "md",
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onClick = () => {},
  arrows,
}: NavArrowsProps) {
  return (
    <div className="flex items-center justify-center gap-3">
      <NavArrow
        type="prev"
        size={size}
        onClick={() => {
          onClick("prev");
        }}
        {...(arrows?.prev ?? {})}
      />
      <NavArrow
        type="next"
        size={size}
        onClick={onClick}
        {...(arrows?.next ?? {})}
      />
    </div>
  );
}
