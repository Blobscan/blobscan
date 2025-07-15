import type { FC } from "react";
import cn from "classnames";

import type { NetworkBlobConfig } from "@blobscan/network-blob-config";

import { calculatePercentage, formatNumber, performDiv } from "~/utils";
import { PercentageBar } from "../PercentageBar";

type BlobGasUsageDisplayProps = {
  networkBlobConfig: NetworkBlobConfig;
  blobGasUsed: bigint;
  compact?: boolean;
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
    targetBlobsPerBlock
  );
}

export const BlobGasUsageDisplay: FC<BlobGasUsageDisplayProps> = function ({
  networkBlobConfig,
  blobGasUsed,
  compact = false,
}) {
  const {
    gasPerBlob,
    blobGasLimit,
    targetBlobsPerBlock,
    targetBlobGasPerBlock,
  } = networkBlobConfig;
  const blobGasUsedPercentage = calculatePercentage(blobGasUsed, blobGasLimit);
  const blobGasTarget = calculateBlobGasTarget(
    blobGasUsed,
    targetBlobsPerBlock,
    gasPerBlob
  );
  const targetSign = getTargetSign(blobGasUsed, targetBlobGasPerBlock);
  const isPositive = targetSign === "+";
  const isNegative = targetSign === "-";

  return (
    <div className="flex items-center gap-2">
      <div className="w-28">
        {formatNumber(blobGasUsed)}
        <span className="ml-1 text-contentTertiary-light dark:text-contentTertiary-dark">
          (
          {formatNumber(blobGasUsedPercentage, "standard", {
            maximumFractionDigits: 2,
          })}
          %)
        </span>
      </div>
      <div className={`flex items-center gap-2`}>
        <PercentageBar
          className={
            isPositive
              ? "bg-positive-light dark:bg-positive-dark"
              : isNegative
              ? "bg-negative-light dark:bg-negative-dark"
              : "bg-contentTertiary-light dark:bg-contentTertiary-dark"
          }
          percentage={blobGasUsedPercentage / 100}
          compact={compact}
        />
        <div
          title={compact ? "Blob Gas Target" : undefined}
          className={cn(
            isPositive
              ? "text-positive-light dark:text-positive-dark"
              : isNegative
              ? "text-negative-light dark:text-negative-dark"
              : "text-contentTertiary-light dark:text-contentTertiary-dark",
            {
              "text-xs": compact,
            }
          )}
        >
          {targetSign}
          {blobGasTarget > 0 ? blobGasTarget.toFixed(2) : blobGasTarget}%{" "}
          {compact ? "" : "Blob Gas Target"}
        </div>
      </div>
    </div>
  );
};
