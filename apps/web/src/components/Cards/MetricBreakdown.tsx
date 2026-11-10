import type { FC } from "react";
import { animated } from "@react-spring/web";
import cn from "classnames";
import Skeleton from "react-loading-skeleton";

import { useAnimatedPercentage } from "~/hooks/useAnimatedPercentage";
import { formatNumber } from "~/utils";

export type MetricBreakdownPart = {
  label: string;
  /** The size of the part. The bar segment has its share of the sum. */
  value: number;
  /** The value as text, for example "4.73 MiB". */
  displayValue: string;
  /** The Tailwind background classes of the bar segment and its marker. */
  colorClassName: string;
};

export type MetricBreakdownProps = {
  parts: MetricBreakdownPart[];
  /** The text that a screen reader reads for the bar. */
  ariaLabel: string;
};

function formatShare(share: number) {
  return `${formatNumber(share * 100, "standard", {
    maximumFractionDigits: 1,
  })}%`;
}

const BreakdownSegment: FC<{
  part: MetricBreakdownPart;
  total: number;
}> = function ({ part, total }) {
  const percentage = useAnimatedPercentage(part.value, total);

  return (
    <animated.div
      className={cn("h-full", part.colorClassName)}
      style={{ width: percentage.value.to((value) => `${value * 100}%`) }}
      title={`${part.label}: ${part.displayValue} (${formatShare(
        part.value / total
      )})`}
    />
  );
};

/**
 * A bar that divides a total into parts, with the label and the value of
 * each part under the bar. The first part is at the left and the last part
 * is at the right. When the sum is 0, the bar is empty.
 */
export const MetricBreakdown: FC<MetricBreakdownProps> = function ({
  parts,
  ariaLabel,
}) {
  const sum = parts.reduce((total, part) => total + part.value, 0);

  return (
    <div className="flex flex-col gap-3">
      {/* The height and the colors are the same as PercentageBar. */}
      <div
        className="flex h-1 w-full overflow-hidden rounded-md bg-neutral-200 dark:bg-neutral-700"
        role="img"
        aria-label={ariaLabel}
      >
        {sum > 0 &&
          parts.map((part) => (
            <BreakdownSegment key={part.label} part={part} total={sum} />
          ))}
      </div>
      <div className="flex justify-between gap-4">
        {parts.map((part, i) => (
          <div
            key={part.label}
            className={cn("flex flex-col gap-1", {
              "items-end": i > 0 && i === parts.length - 1,
            })}
          >
            <div className="flex items-center gap-1.5 text-xs text-contentSecondary-light dark:text-contentSecondary-dark">
              <span
                aria-hidden="true"
                className={cn("h-2 w-2 rounded-full", part.colorClassName)}
              />
              {part.label}
            </div>
            <div className="text-sm dark:text-warmGray-50">
              {part.displayValue}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/** The skeleton of a breakdown while the data loads. */
export function MetricBreakdownSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton height={4} />
      <Skeleton height={36} />
    </div>
  );
}
