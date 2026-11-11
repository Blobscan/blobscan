import type { FC, ReactNode } from "react";
import { InformationCircleIcon } from "@heroicons/react/24/solid";

import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/Tooltip";

type HelpIconProps = {
  /** The text that the tooltip shows. */
  description: ReactNode;
};

/** A small info icon. A hover or a focus on it shows the description. */
export const HelpIcon: FC<HelpIconProps> = ({ description }) => (
  <Tooltip>
    <TooltipContent className="z-50 max-w-[240px]">
      {description}
    </TooltipContent>
    <TooltipTrigger
      aria-label="More information"
      className="shrink-0 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      asChild
    >
      <button type="button">
        <InformationCircleIcon
          aria-hidden="true"
          className="h-4 w-4 opacity-80"
        />
      </button>
    </TooltipTrigger>
  </Tooltip>
);
