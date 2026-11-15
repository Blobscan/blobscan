import type { FC } from "react";
import cn from "classnames";

import type { ChainBlobParams } from "@blobscan/chains";

import {
  calculatePercentage,
  formatNumber,
  performDiv,
  pluralize,
} from "~/utils";
import { PercentageBar } from "../PercentageBar";

type BlobGasUsageDisplayProps = {
  blobParams: ChainBlobParams;
  blobGasUsed: bigint;
  width?: number | "full";
  showTotal?: boolean;
  variant?: "detailed" | "minimal";
};

function getTargetSign(
  blobGasUsed: bigint,
  targetBlobGasPerBlock: bigint
): "+" | "-" | undefined {
  if (blobGasUsed < targetBlobGasPerBlock) {
    return "-";
  }

  if (blobGasUsed > targetBlobGasPerBlock) {
    return "+";
  }
}

function calculateBlobGasTarget(
  blobGasUsed: bigint,
  targetBlobsPerBlock: number,
  gasPerBlob: bigint
) {
  const blobsInBlock = performDiv(blobGasUsed, gasPerBlob);

  return calculatePercentage(
    blobsInBlock < targetBlobsPerBlock
      ? blobsInBlock
      : blobsInBlock - targetBlobsPerBlock,
    targetBlobsPerBlock,
    { returnComplement: blobsInBlock < targetBlobsPerBlock }
  );
}

export const BlobGasUsageDisplay: FC<BlobGasUsageDisplayProps> = function ({
  blobParams,
  blobGasUsed,
  width,
  showTotal = false,
  variant = "detailed",
}) {
  const {
    gasPerBlob,
    blobGasLimit,
    maxBlobsPerBlock,
    targetBlobsPerBlock,
    targetBlobGasPerBlock,
  } = blobParams;
  const blobGasTarget = calculateBlobGasTarget(
    blobGasUsed,
    targetBlobsPerBlock,
    gasPerBlob
  );
  const isDetailedMode = variant === "detailed";
  const targetSign = getTargetSign(blobGasUsed, targetBlobGasPerBlock);
  const isPositive = targetSign === "+";
  const isNegative = targetSign === "-";
  const isZero = !isPositive && !isNegative;

  return (
    <div className="relative flex flex-col">
      <div className="flex flex-wrap items-center gap-1">
        {formatNumber(blobGasUsed)}{" "}
        {showTotal && (
          <>
            <span>/ {formatNumber(blobGasLimit)}</span>
            <span className="text-contentTertiary-light dark:text-contentTertiary-dark">
              ({formatNumber(maxBlobsPerBlock)}{" "}
              {pluralize("blob", maxBlobsPerBlock)} per block)
            </span>
          </>
        )}
        {!isDetailedMode && (
          <span className="text-xs text-contentTertiary-light dark:text-contentTertiary-dark">
            ({calculatePercentage(blobGasUsed, blobGasLimit)}%)
          </span>
        )}
      </div>
      <div
        className={cn("flex gap-1", {
          "mt-2": showTotal,
          "w-full items-start gap-3": width === "full",
          "items-center": width !== "full",
          "absolute top-4": !isDetailedMode && !showTotal,
          "gap-1": !isZero && width !== "full",
          "gap-3": isZero,
        })}
      >
        <PercentageBar
          color={isPositive ? "green" : isNegative ? "red" : "grey"}
          value={blobGasUsed}
          total={blobGasLimit}
          compact={!isDetailedMode}
          width={width ?? 140}
          hidePercentage={!isDetailedMode}
        />
        <div
          title={isDetailedMode ? "Blob Gas Target" : undefined}
          className={cn({
            "relative shrink-0 -translate-y-1/2 whitespace-nowrap leading-none":
              width === "full",
            "top-0.5": width === "full" && isDetailedMode,
            "top-px": width === "full" && !isDetailedMode,
            "text-positive-light dark:text-positive-dark": isPositive,
            "text-negative-light dark:text-negative-dark": isNegative,
            "text-contentTertiary-light dark:text-contentTertiary-dark": isZero,
            "text-sm": isDetailedMode,
            "text-[10px]": !isDetailedMode,
          })}
        >
          {targetSign}
          {blobGasTarget > 0 ? Number(blobGasTarget.toFixed(2)) : blobGasTarget}
          % {isDetailedMode ? "Blob Gas Target" : ""}
        </div>
      </div>
    </div>
  );
};
