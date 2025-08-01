import type { FC } from "react";
import cn from "classnames";

import { calculatePercentage, formatBytes } from "~/utils";
import type { ByteUnit } from "~/utils";
import { PercentageBar } from "../PercentageBar";

export interface BlobSizeUsageDisplayProps {
  size: number;
  sizeUsage: number;
  byteUnit?: ByteUnit;
  width?: number;
  variant?: "minimal" | "inline" | "detailed";
  hideUnit?: boolean;
}

export const BlobSizeUsageDisplay: FC<BlobSizeUsageDisplayProps> = function ({
  size,
  sizeUsage,
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
          {formatBytes(sizeUsage, {
            hideUnit: hideUnit,
            unit: byteUnit,
          })}
        </span>
        {!isMinimal && (
          <>
            /
            <span>
              {formatBytes(size, {
                hideUnit,
                unit: byteUnit,
              })}
            </span>
            <span className="text-xs dark:text-contentTertiary-dark">
              {" "}
              ({calculatePercentage(sizeUsage, size)}%)
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
            value={sizeUsage}
            total={size}
            width={width ?? 140}
            hidePercentage={isDetailed}
            compact={isDetailed}
          />
        </div>
      )}
    </div>
  );
};
