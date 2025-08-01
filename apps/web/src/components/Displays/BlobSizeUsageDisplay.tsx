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
  variant?: "detailed" | "minimal";
}

export const BlobSizeUsageDisplay: FC<BlobSizeUsageDisplayProps> = function ({
  size,
  sizeUsage,
  byteUnit,
  width,
  variant = "detailed",
}) {
  const isDetailedMode = variant === "detailed";

  return (
    <div
      className={cn("flex flex-col", {
        relative: isDetailedMode,
      })}
    >
      <span>
        <span>
          {formatBytes(sizeUsage, {
            hideUnit: isDetailedMode,
            unit: byteUnit,
          })}
        </span>
        {isDetailedMode && (
          <>
            /
            <span>
              {formatBytes(size, {
                hideUnit: true,
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
      <div
        className={cn({
          "absolute -bottom-2": isDetailedMode,
        })}
      >
        <PercentageBar
          value={sizeUsage}
          total={size}
          width={width ?? 140}
          hidePercentage={isDetailedMode}
          compact={isDetailedMode}
        />
      </div>
    </div>
  );
};
