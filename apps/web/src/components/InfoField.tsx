import type { FC, ReactNode } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/Tooltip";
import Info from "~/icons/info.svg";

type InfoFieldProps = {
  children: ReactNode;
  description: string;
};

export const InfoField: FC<InfoFieldProps> = ({ children, description }) => {
  return (
    <div className="flex flex-row items-center gap-2">
      <Tooltip>
        <TooltipContent className="max-w-[240px]">{description}</TooltipContent>
        <TooltipTrigger>
          <Info className="h-4 w-4 opacity-80" />
        </TooltipTrigger>
      </Tooltip>
      {children}
    </div>
  );
};
