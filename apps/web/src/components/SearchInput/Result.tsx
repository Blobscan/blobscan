import type { FC, ReactNode } from "react";
import cn from "classnames";

import dayjs from "@blobscan/dayjs";

import type { Rollup } from "~/types";
import { Badge } from "../Badges/Badge";
import { RollupBadge } from "../Badges/RollupBadge";
import { HighlightedMatch } from "./HighlightedMatch";

export interface ResultProps {
  id: string | number;
  term: string;
  timestamp?: Date;
  reorg?: boolean;
  rollup?: Rollup;
  icon: ReactNode;
  secondaryData?: {
    label: ReactNode;
    value: string | number;
  }[];
}

export const Result: FC<ResultProps> = function ({
  icon,
  term,
  id,
  timestamp,
  reorg,
  secondaryData,
  rollup,
}) {
  const [date, time] = timestamp
    ? dayjs(timestamp).format("YYYY-MM-DD HH:mm:ss").split(" ")
    : [];

  return (
    <div className="flex flex-col">
      <div className="mt-2 flex cursor-pointer items-center justify-between rounded-md py-2 pl-1 pr-3 text-sm text-contentSecondary-light transition-colors hover:bg-primary-100 dark:text-contentSecondary-dark hover:dark:bg-primary-800/20">
        <div
          className={cn("flex w-full items-center gap-2", {
            "justify-between": timestamp,
          })}
        >
          <div className="relative flex items-center">
            {icon}
            {rollup && (
              <div className="relative -bottom-2 right-0.5">
                <RollupBadge rollup={rollup} size="sm" compact />
              </div>
            )}
          </div>
          <div className="flex flex-col items-start justify-start gap-1 truncate">
            <div className="flex w-full items-center justify-between gap-1 text-sm dark:text-content-dark">
              <div className="flex items-center gap-2 truncate">
                <HighlightedMatch value={id} term={term} />
                {reorg && (
                  <Badge variant="primary" size="xs">
                    Reorg
                  </Badge>
                )}
              </div>
            </div>
            {secondaryData && (
              <div className="flex w-full items-center gap-1 text-xs dark:text-contentTertiary-dark">
                {secondaryData.map(({ label, value }) => (
                  <div
                    key={value}
                    style={{
                      maxWidth: `${Math.round(100 / secondaryData.length)}%`,
                    }}
                    className={`flex items-center gap-1`}
                  >
                    <span className="dark:text-contentSecondary-dark">
                      {label}
                    </span>
                    <HighlightedMatch value={value} term={term} />
                  </div>
                ))}
              </div>
            )}
          </div>
          {date && time && (
            <div className="flex flex-col items-center gap-1 text-nowrap text-xs dark:text-contentTertiary-dark">
              <div>{date}</div>
              <div>{time}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
