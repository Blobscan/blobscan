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
    <TooltipContent className="max-w-[240px]">{description}</TooltipContent>
    <TooltipTrigger className="shrink-0">
      <InformationCircleIcon className="h-4 w-4 opacity-80" />
    </TooltipTrigger>
  </Tooltip>
);
