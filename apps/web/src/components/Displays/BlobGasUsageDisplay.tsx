import type { FC } from "react";
import cn from "classnames";

import type { NetworkBlobConfig } from "@blobscan/network-blob-config";

import { calculatePercentage, formatNumber, performDiv } from "~/utils";
import { PercentageBar } from "../PercentageBar";

type BlobGasUsageDisplayProps = {
  networkBlobConfig: NetworkBlobConfig;
  blobGasUsed: bigint;
  width?: number;
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
    targetBlobsPerBlock,
    { returnComplement: blobsInBlock < targetBlobsPerBlock }
  );
}

export const BlobGasUsageDisplay: FC<BlobGasUsageDisplayProps> = function ({
  networkBlobConfig,
  blobGasUsed,
  width,
  compact = false,
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
  const targetSign = getTargetSign(blobGasUsed, targetBlobGasPerBlock);
  const isPositive = targetSign === "+";
  const isNegative = targetSign === "-";

  return (
    <div className="relative flex flex-col">
      <div className="flex items-center gap-1">
        {formatNumber(blobGasUsed)}{" "}
        <span className="text-xs text-contentTertiary-light dark:text-contentTertiary-dark">
          ({calculatePercentage(blobGasUsed, blobGasLimit)}%)
        </span>
      </div>
      <div
        className={cn("flex items-center gap-1", {
          "absolute top-4": compact,
        })}
      >
        <PercentageBar
          color={isPositive ? "green" : isNegative ? "red" : "grey"}
          value={blobGasUsed}
          total={blobGasLimit}
          compact={compact}
          width={width}
          hidePercentage
        />
        <div
          title={compact ? "Blob Gas Target" : undefined}
          className={cn({
            "text-positive-light dark:text-positive-dark": isPositive,
            "text-negative-light dark:text-negative-dark": isNegative,
            "text-contentTertiary-light dark:text-contentTertiary-dark":
              !isPositive && !isNegative,
            "text-xs": !compact,
            "text-[10px]": compact,
          })}
        >
          {targetSign}
          {blobGasTarget > 0 ? blobGasTarget.toFixed(2) : blobGasTarget}%{" "}
          {compact ? "" : "Blob Gas Target"}
        </div>
      </div>
    </div>
  );
};
