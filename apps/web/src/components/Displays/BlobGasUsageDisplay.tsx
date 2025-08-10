import type { FC } from "react";
import cn from "classnames";

import type { NetworkBlobConfig } from "@blobscan/network-blob-config";

import { calculatePercentage, formatNumber, performDiv } from "~/utils";
import { PercentageBar } from "../PercentageBar";

type BlobGasUsageDisplayProps = {
  networkBlobConfig: NetworkBlobConfig;
  blobGasUsed: bigint;
  width?: number;
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
  networkBlobConfig,
  blobGasUsed,
  width,
  variant = "detailed",
}) {
  const {
    gasPerBlob,
    blobGasLimit,
    targetBlobsPerBlock,
    targetBlobGasPerBlock,
  } = networkBlobConfig;
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
      <div className="flex items-center gap-1">
        {formatNumber(blobGasUsed)}{" "}
        {!isDetailedMode && (
          <span className="text-xs text-contentTertiary-light dark:text-contentTertiary-dark">
            ({calculatePercentage(blobGasUsed, blobGasLimit)}%)
          </span>
        )}
      </div>
      <div
        className={cn("flex items-center gap-1", {
          "absolute top-4": !isDetailedMode,
          "gap-1": !isZero,
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
