import type { FC } from "react";
import cn from "classnames";
import Skeleton from "react-loading-skeleton";

import { Card } from "~/components/Cards/Card";
import { formatBytes, formatNumber } from "~/utils";

export type BlobSpaceCardProps = {
  /** The name of the card. The default is "Blob Space Utilization". */
  name?: string;
  /** The blob bytes with data. */
  usedSize?: bigint;
  /** All the blob bytes: the blobs × the size of a blob. */
  totalSize?: bigint;
  totalBlobs?: number;
  className?: string;
};

// The colors and the height of the bar are the same as PercentageBar, which
// shows the blob usage on the details pages.
const USED_COLOR = "bg-primary-700 dark:bg-primary-500";
const UNUSED_COLOR = "bg-primary-200 dark:bg-primary-800";

function formatPercentage(value: number) {
  return `${formatNumber(value, "standard", { maximumFractionDigits: 1 })}%`;
}

/**
 * Shows the blob space of an address: the utilization of the total space,
 * and a bar that divides the space into the used and the unused part. The
 * blob fees are on the Fees section. Without values, it shows a skeleton.
 */
export const BlobSpaceCard: FC<BlobSpaceCardProps> = function ({
  name = "Blob Space Utilization",
  usedSize,
  totalSize,
  totalBlobs,
  className,
}) {
  const isLoading = usedSize === undefined || totalSize === undefined;
  const hasBlobs = !isLoading && totalSize > BigInt(0);
  const unusedSize = !isLoading && hasBlobs ? totalSize - usedSize : BigInt(0);
  // Keep 4 decimal places of the percentage with integer division.
  const usedPercentage =
    !isLoading && hasBlobs
      ? Number((usedSize * BigInt(1_000_000)) / totalSize) / 10_000
      : 0;
  const unusedPercentage = hasBlobs ? 100 - usedPercentage : 0;

  return (
    <Card className={className}>
      <div className="flex flex-col gap-3">
        {/* The name and the value have the sizes of MetricCard. */}
        <div className="text-sm font-semibold dark:text-warmGray-50">
          {name}
        </div>
        {isLoading ? (
          <>
            <Skeleton height={28} width="30%" />
            <Skeleton height={4} />
            <Skeleton height={36} />
          </>
        ) : (
          <>
            {/* With no blobs, "0% used" would look like unused space. */}
            <div className="flex flex-wrap items-baseline gap-x-1.5 text-lg dark:text-warmGray-50 lg:text-2xl">
              {hasBlobs ? formatPercentage(usedPercentage) : "-"}
              {hasBlobs && (
                // The total is the space that the percentage refers to.
                <span className="text-xs text-contentSecondary-light dark:text-contentSecondary-dark">
                  used of {formatBytes(totalSize)}
                  {totalBlobs !== undefined &&
                    ` (${formatNumber(totalBlobs)} ${
                      totalBlobs === 1 ? "blob" : "blobs"
                    })`}
                </span>
              )}
            </div>
            <div
              className="flex h-1 w-full overflow-hidden rounded-md bg-neutral-200 dark:bg-neutral-700"
              role="img"
              aria-label={
                hasBlobs
                  ? `${formatPercentage(
                      usedPercentage
                    )} of the blob space is used`
                  : "No blob space"
              }
            >
              {hasBlobs && (
                <>
                  <div
                    className={cn("h-full", USED_COLOR)}
                    style={{ width: `${usedPercentage}%` }}
                    title={`Used: ${formatBytes(usedSize)} (${formatPercentage(
                      usedPercentage
                    )})`}
                  />
                  <div
                    className={cn("h-full", UNUSED_COLOR)}
                    style={{ width: `${unusedPercentage}%` }}
                    title={`Unused: ${formatBytes(
                      unusedSize
                    )} (${formatPercentage(unusedPercentage)})`}
                  />
                </>
              )}
            </div>
            {/* Each part is under its end of the bar. */}
            <div className="flex justify-between gap-4">
              <SpacePart
                label="Used"
                markerClassName={USED_COLOR}
                size={usedSize}
              />
              <SpacePart
                label="Unused"
                markerClassName={UNUSED_COLOR}
                size={unusedSize}
                alignEnd
              />
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

/** The size of a part of the blob space. */
function SpacePart({
  label,
  markerClassName,
  size,
  alignEnd,
}: {
  label: string;
  /** The color of the bar segment of the part. */
  markerClassName: string;
  size: bigint;
  alignEnd?: boolean;
}) {
  return (
    <div className={cn("flex flex-col gap-1", { "items-end": alignEnd })}>
      <div className="flex items-center gap-1.5 text-xs text-contentSecondary-light dark:text-contentSecondary-dark">
        <span
          aria-hidden="true"
          className={cn("h-2 w-2 rounded-full", markerClassName)}
        />
        {label}
      </div>
      <div className="text-sm dark:text-warmGray-50">{formatBytes(size)}</div>
    </div>
  );
}
