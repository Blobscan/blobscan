import type { FC } from "react";

import {
  BLOB_GAS_LIMIT_PER_BLOCK,
  TARGET_BLOB_GAS_PER_BLOCK,
  calculateBlobGasTarget,
  calculatePercentage,
  formatNumber,
} from "~/utils";
import { PercentageBar } from "./PercentageBar";

type BlobGasUsageProps = {
  blobGasUsed: bigint;
};

export const BlobGasUsage: FC<BlobGasUsageProps> = function ({ blobGasUsed }) {
  const blobGasUsedPercentage = calculatePercentage(
    blobGasUsed,
    BigInt(BLOB_GAS_LIMIT_PER_BLOCK)
  );
  const blobGasTarget = calculateBlobGasTarget(blobGasUsed);
  const targetSign = blobGasUsed < TARGET_BLOB_GAS_PER_BLOCK ? "-" : "+";
  const isPositive = targetSign === "+";

  return (
    <div className="flex gap-2">
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
      <div className={`flex items-center gap-1`}>
        <PercentageBar
          className={
            isPositive
              ? "bg-positive-light dark:bg-positive-dark"
              : "bg-negative-light dark:bg-negative-dark"
          }
          percentage={blobGasUsedPercentage / 100}
        />
        <span
          className={
            isPositive
              ? "text-positive-light dark:text-positive-dark"
              : "text-negative-light dark:text-negative-dark"
          }
        >
          {targetSign} {blobGasTarget.toFixed(2)}% Blob Gas Target
        </span>
      </div>
    </div>
  );
};
