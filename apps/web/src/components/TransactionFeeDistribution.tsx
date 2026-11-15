import { useState } from "react";
import { formatEther } from "viem";

import { DistributionBar } from "./DistributionBar";

export function TransactionFeeDistribution({
  executionBaseFee,
  priorityFee,
  blobFee,
}: {
  executionBaseFee: bigint | null | undefined;
  priorityFee: bigint | null | undefined;
  blobFee: bigint | null | undefined;
}) {
  const [activeSegment, setActiveSegment] = useState<string | null>(null);

  if (
    executionBaseFee == null ||
    priorityFee == null ||
    blobFee == null ||
    executionBaseFee < 0n ||
    priorityFee < 0n ||
    blobFee < 0n
  ) {
    return null;
  }

  const total = executionBaseFee + priorityFee + blobFee;
  if (total === 0n) return null;

  const segments = [
    {
      label: "Execution base fee",
      legend: "Execution base",
      amount: executionBaseFee,
      color: "bg-primary-700 dark:bg-primary-500",
      activeColor: "text-primary-700 dark:text-primary-400",
      destination: "Burned",
    },
    {
      label: "Priority fee",
      legend: "Priority",
      amount: priorityFee,
      color: "bg-positive-light dark:bg-positive-dark",
      activeColor: "text-positive-light dark:text-positive-dark",
      destination: "Paid to the block proposer",
    },
    {
      label: "Blob fee",
      legend: "Blob",
      amount: blobFee,
      color: "bg-orange-500 dark:bg-orange-400",
      activeColor: "text-orange-600 dark:text-orange-400",
      destination: "Burned",
    },
  ].map((segment) => ({
    ...segment,
    percentage: Number((segment.amount * 1000000n) / total) / 10000,
  }));

  return (
    <div
      className="mt-2 w-full max-w-xs"
      role="group"
      aria-label="Fee distribution"
    >
      <div className="w-full">
        <DistributionBar
          label="Fee segments"
          onActiveSegmentChange={setActiveSegment}
          segments={segments
            .filter(({ amount }) => amount > 0n)
            .map(({ label, amount, color, destination }) => ({
              id: label,
              label: `${label}: ${formatEther(amount)} ETH. ${destination}.`,
              value: amount,
              color,
            }))}
        />
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-contentSecondary-light dark:text-contentSecondary-dark">
        {segments.map(({ label, legend, color, activeColor, percentage }) => (
          <span
            key={label}
            className={`inline-flex items-center gap-1 transition-colors ${
              activeSegment === label ? activeColor : ""
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${color}`}
              aria-hidden="true"
            />
            {legend} {percentage.toFixed(2)}%
          </span>
        ))}
      </div>
    </div>
  );
}
