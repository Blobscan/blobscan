import type { CSSProperties } from "react";

import { ROLLUP_DEFINITIONS } from "@blobscan/rollups";

import type { Rollup } from "~/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "../Tooltip";
import { RollupBadge } from "./RollupBadge";
import styles from "./RollupBadgeGroup.module.css";

export function RollupBadgeGroup({
  amounts,
}: {
  amounts: Partial<Record<Rollup, number>>;
}) {
  const entries = Object.entries(amounts);
  const visibleEntries = entries.slice(0, 4);
  const hiddenEntries = entries.slice(visibleEntries.length);
  const remainingCount = hiddenEntries.length;
  const overflowWidth = Math.max(20, `${remainingCount}`.length * 6 + 14);
  if (!entries.length) {
    return null;
  }

  return (
    <div
      className={`${styles.group} before:bg-surface-light dark:before:bg-surface-dark`}
      style={
        {
          "--visible-count": visibleEntries.length,
          "--overflow-width": remainingCount > 0 ? `${overflowWidth}px` : "0px",
          "--overflow-gap": remainingCount > 0 ? "2px" : "0px",
        } as CSSProperties
      }
      tabIndex={entries.length > 1 ? 0 : undefined}
      role="group"
      aria-label="Rollup transaction counts"
    >
      {visibleEntries.map(([rollup, amount], index) => (
        <div
          key={rollup}
          className={styles.item}
          style={{ zIndex: entries.length - index }}
        >
          <RollupBadge rollup={rollup as Rollup} amount={amount} compact />
        </div>
      ))}
      {remainingCount > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="relative z-10 ml-0.5 flex h-5 shrink-0 items-center justify-center rounded-full bg-slate-200 px-1 text-[10px] font-semibold text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500 dark:bg-slate-700 dark:text-slate-100"
              style={{ width: overflowWidth }}
              aria-label={`Show ${remainingCount} more rollups`}
              onClick={(event) => event.stopPropagation()}
            >
              +{remainingCount}
            </button>
          </TooltipTrigger>
          <TooltipContent className="w-64">
            <ul className="space-y-2">
              {hiddenEntries.map(([rollup, amount]) => (
                <li key={rollup} className="flex items-center gap-2">
                  <RollupBadge rollup={rollup as Rollup} compact />
                  <span className="min-w-0 flex-1">
                    {ROLLUP_DEFINITIONS[rollup as Rollup].name}
                  </span>
                  <span className="font-semibold tabular-nums">{amount}</span>
                </li>
              ))}
            </ul>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
