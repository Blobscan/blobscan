import { useRouter } from "next/router";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

import { IconButton } from "./IconButton";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";

export function NavArrows({
  next,
  prev,
}: {
  next: {
    href?: string;
    tooltip?: string;
  };
  prev: {
    href?: string;
    tooltip?: string;
  };
}) {
  return (
    <div className="flex items-center justify-center gap-1">
      <Tooltip>
        <TooltipTrigger>
          <NavArrow type="prev" href={prev.href} />
        </TooltipTrigger>
        <TooltipContent>{prev.tooltip || "Previous"}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger>
          <NavArrow type="next" href={next.href} />
        </TooltipTrigger>
        <TooltipContent>{next.tooltip || "Next"}</TooltipContent>
      </Tooltip>
    </div>
  );
}

function NavArrow({ type, href }: { type: "next" | "prev"; href?: string }) {
  const router = useRouter();

  return (
    <IconButton
      size="sm"
      onClick={() => {
        if (href) {
          router.push(href);
        }
      }}
      className={`
          dark:bg-neutral-850
          bg-border-border-dark
          rounded-md
          border
          border-border-light
          bg-white
          p-[3px]
          dark:border-border-dark
          dark:bg-border-dark
          ${href ? "" : "cursor-default opacity-50"}
      `}
      disabled={!href}
    >
      {type === "next" ? <ChevronRightIcon /> : <ChevronLeftIcon />}
    </IconButton>
  );
}
