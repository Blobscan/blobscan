import type { Dispatch, FC, SetStateAction } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/Tooltip";

export type TimestampFormat = "relative" | "absolute";

type TimestampProps = {
  format: TimestampFormat;
  setFormat: Dispatch<SetStateAction<TimestampFormat>>;
};

export const TimestampToggle: FC<TimestampProps> = ({ format, setFormat }) => {
  return (
    <Tooltip>
      <TooltipContent>
       {`Click to show ${format} timestamp`}
      </TooltipContent>
      <TooltipTrigger
        className="text-contentTertiary-light hover:text-link-light dark:text-contentTertiary-dark dark:hover:text-link-dark"
        onClick={() =>
          setFormat((format) =>
            format === "relative" ? "absolute" : "relative"
          )
        }
      >
        <div className="text-link-light dark:text-link-dark">Timestamp</div>
      </TooltipTrigger>
    </Tooltip>
  );
};
