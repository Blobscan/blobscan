import type { FC, ReactNode } from "react";
import { InformationCircleIcon } from "@heroicons/react/24/solid";

import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/Tooltip";

type InfoFieldProps = {
  children: ReactNode;
  description: ReactNode;
};

export const InfoField: FC<InfoFieldProps> = ({ children, description }) => {
  return (
    <div className="flex flex-row items-center gap-2">
      <Tooltip>
        <TooltipContent className="max-w-[240px]">{description}</TooltipContent>
        <TooltipTrigger>
          <InformationCircleIcon className="h-4 w-4 opacity-80" />
        </TooltipTrigger>
      </Tooltip>
      {children}
    </div>
  );
};
