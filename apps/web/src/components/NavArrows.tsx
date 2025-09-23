import { useRouter } from "next/router";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

import { IconButton } from "./IconButton";
import type { IconButtonProps } from "./IconButton";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";

interface NavData {
  href?: string;
  tooltip?: string;
}

export interface NavArrowProps extends NavData {
  type: "prev" | "next";
  size: IconButtonProps["size"];
}

function NavArrow({ type, size, href, tooltip }: NavArrowProps) {
  const router = useRouter();

  return (
    <Tooltip>
      <TooltipTrigger className={href ? "cursor-pointer" : "cursor-default"}>
        <IconButton
          size={size}
          variant={href ? "default" : "disabled"}
          onClick={
            href
              ? () => {
                  router.push(href);
                }
              : undefined
          }
          disabled={!href}
        >
          {type === "next" ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
        {!!href && <TooltipContent>{tooltip || "Next"}</TooltipContent>}
      </TooltipTrigger>
    </Tooltip>
  );
}

export interface NavArrowsProps {
  size?: IconButtonProps["size"];
  prev: NavData;
  next: NavData;
}
export function NavArrows({ size = "md", next, prev }: NavArrowsProps) {
  return (
    <div className="flex items-center justify-center gap-3">
      <NavArrow type="prev" size={size} {...prev} />
      <NavArrow type="next" size={size} {...next} />
    </div>
  );
}
