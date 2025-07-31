import type { FC } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";

export type BlobView = "size" | "usage";

interface BlobViewToggleProps {
  view: BlobView;
  onChange(type: BlobView): void;
}

export const BlobViewToggle: FC<BlobViewToggleProps> = function ({
  view,
  onChange,
}) {
  const otherView = view === "size" ? "usage" : "size";
  return (
    <Tooltip>
      <TooltipContent>Click to show blob {otherView} </TooltipContent>
      <TooltipTrigger
        className="text-left text-link-light dark:text-link-dark"
        onClick={() => onChange(otherView)}
      >
        {view === "usage" ? "Blob Usage (KiB)" : "Blob Size (KiB)"}
      </TooltipTrigger>
    </Tooltip>
  );
};
