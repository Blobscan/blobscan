import type { FC } from "react";

import {
  BLOB_GAS_LIMIT_PER_BLOCK,
  TARGET_BLOB_GAS_PER_BLOCK,
  calculateBlobGasTarget,
  calculatePercentage,
  formatNumber,
} from "~/utils";
import { PercentageBar } from "../PercentageBar";

type BlobGasUsageDisplayProps = {
  blobGasUsed: bigint;
};

function getTargetSign(blobGasUsed: bigint): "+" | "-" | undefined {
  if (blobGasUsed < TARGET_BLOB_GAS_PER_BLOCK) {
    return "-";
  } else if (blobGasUsed > TARGET_BLOB_GAS_PER_BLOCK) {
    return "+";
  } else {
    return;
  }
}

export const BlobGasUsageDisplay: FC<BlobGasUsageDisplayProps> = function ({
  blobGasUsed,
}) {
  const blobGasUsedPercentage = calculatePercentage(
    blobGasUsed,
    BigInt(BLOB_GAS_LIMIT_PER_BLOCK)
  );
  const blobGasTarget = calculateBlobGasTarget(blobGasUsed);
  const targetSign = getTargetSign(blobGasUsed);
  const isPositive = targetSign === "+";
  const isNegative = targetSign === "-";

  return (
    <div className="flex flex-col gap-2 md:flex-row">
      <div>
        {formatNumber(blobGasUsed)}
        <span className="ml-1 text-contentTertiary-light dark:text-contentTertiary-dark">
          (
          {formatNumber(blobGasUsedPercentage, "standard", {
            maximumFractionDigits: 2,
          })}
          %)
        </span>
      </div>
      <div className={`flex flex-col gap-2 md:flex-row md:items-center`}>
        <PercentageBar
          className={
            isPositive
              ? "bg-positive-light dark:bg-positive-dark"
              : isNegative
              ? "bg-negative-light dark:bg-negative-dark"
              : "bg-contentTertiary-light dark:bg-contentTertiary-dark"
          }
          percentage={blobGasUsedPercentage / 100}
        />
        <div
          className={
            isPositive
              ? "text-positive-light dark:text-positive-dark"
              : isNegative
              ? "text-negative-light dark:text-negative-dark"
              : "text-contentTertiary-light dark:text-contentTertiary-dark"
          }
        >
          {targetSign}
          {blobGasTarget > 0 ? blobGasTarget.toFixed(2) : blobGasTarget}% Blob
          Gas Target
        </div>
      </div>
    </div>
  );
};
