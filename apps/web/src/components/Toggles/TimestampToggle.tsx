import type { FC } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/Tooltip";

export type TimestampFormat = "relative" | "absolute";

type TimestampProps = {
  format: TimestampFormat;
  onChange: (timestampFormat: TimestampFormat) => void;
};

export const TimestampToggle: FC<TimestampProps> = ({ format, onChange }) => {
  return (
    <Tooltip>
      <TooltipContent>
        Display {format === "relative" ? "Datetime" : "Age"} Format
      </TooltipContent>
      <TooltipTrigger
        className="text-link-light dark:text-link-dark"
        onClick={() =>
          onChange(format === "relative" ? "absolute" : "relative")
        }
      >
        {format === "relative" ? "Age" : "Date Time"}
      </TooltipTrigger>
    </Tooltip>
  );
};
