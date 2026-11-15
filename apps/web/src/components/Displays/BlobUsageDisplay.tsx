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
  showTotal?: boolean;
}

export const BlobUsageDisplay: FC<BlobUsageDisplayProps> = function ({
  blobSize,
  blobUsage,
  byteUnit,
  width,
  variant = "detailed",
  hideUnit,
  showTotal = false,
}) {
  const isDetailed = variant === "detailed";
  const isMinimal = variant === "minimal";
  const isInline = variant === "inline";

  return (
    <div
      className={cn("flex min-w-0 flex-col", {
        relative: isDetailed,
      })}
    >
      <span className="whitespace-normal">
        <span>
          {formatBytes(blobUsage, {
            hideUnit: hideUnit,
            unit: byteUnit,
            displayAllDecimals: isMinimal,
          })}
        </span>
        {(!isMinimal || showTotal) && (
          <>
            {" / "}
            <span>
              {formatBytes(blobSize, {
                hideUnit,
                unit: byteUnit,
              })}
            </span>
            {!isMinimal && (
              <span className="text-xs dark:text-contentTertiary-dark">
                {" "}
                ({calculatePercentage(blobUsage, blobSize)}%)
              </span>
            )}
          </>
        )}
      </span>
      {!isInline && (
        <div
          className={cn({
            "absolute -bottom-2 w-full": isDetailed,
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
