import type { FC } from "react";
import cn from "classnames";

import { calculatePercentage, formatBytes } from "~/utils";
import type { ByteUnit } from "~/utils";
import { PercentageBar } from "../PercentageBar";

export interface BlobUsageDisplayProps {
  blobSize: number;
  blobUsage: number;
  byteUnit?: ByteUnit;
  width?: number;
  variant?: "minimal" | "inline" | "detailed";
  hideUnit?: boolean;
}

export const BlobUsageDisplay: FC<BlobUsageDisplayProps> = function ({
  blobSize,
  blobUsage,
  byteUnit,
  width,
  variant = "detailed",
  hideUnit,
}) {
  const isDetailed = variant === "detailed";
  const isMinimal = variant === "minimal";
  const isInline = variant === "inline";

  return (
    <div
      className={cn("flex flex-col", {
        relative: isDetailed,
      })}
    >
      <span>
        <span>
          {formatBytes(blobUsage, {
            hideUnit: hideUnit,
            unit: byteUnit,
            displayAllDecimals: true,
          })}
        </span>
        {!isMinimal && (
          <>
            /
            <span>
              {formatBytes(blobSize, {
                hideUnit,
                unit: byteUnit,
              })}
            </span>
            <span className="text-xs dark:text-contentTertiary-dark">
              {" "}
              ({calculatePercentage(blobUsage, blobSize)}%)
            </span>
          </>
        )}
      </span>
      {!isInline && (
        <div
          className={cn({
            "absolute -bottom-2": isDetailed,
          })}
        >
          <PercentageBar
            value={blobUsage}
            total={blobSize}
            width={width ?? 140}
            hidePercentage={isDetailed}
            compact={isDetailed}
          />
        </div>
      )}
    </div>
  );
};
