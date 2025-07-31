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
    targetBlobsPerBlock,
    { returnComplement: blobsInBlock < targetBlobsPerBlock }
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
      {formatNumber(blobGasUsed)}
      <div className={`flex items-center gap-2`}>
        <PercentageBar
          color={isPositive ? "green" : isNegative ? "red" : "grey"}
          value={blobGasUsed}
          total={blobGasLimit}
          compact={compact}
        />
        <div
          title={compact ? "Blob Gas Target" : undefined}
          className={cn(
            {
              "text-positive-light dark:text-positive-dark": isPositive,
              "text-negative-light dark:text-negative-dark": isNegative,
              "text-contentTertiary-light dark:text-contentTertiary-dark":
                !isPositive && !isNegative,
            },
            "text-xs"
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
