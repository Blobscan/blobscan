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
      <TooltipContent>Click to show {format} timestamp</TooltipContent>
      <TooltipTrigger
        className="text-link-light dark:text-link-dark"
        onClick={() =>
          onChange(format === "relative" ? "absolute" : "relative")
        }
      >
        Timestamp
      </TooltipTrigger>
    </Tooltip>
  );
};
