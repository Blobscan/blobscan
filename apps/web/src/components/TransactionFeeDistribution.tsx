import { useState } from "react";
import { formatEther } from "viem";

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
      color: "bg-violet-500",
      activeColor: "text-violet-700 dark:text-violet-400",
      destination: "Burned",
    },
    {
      label: "Priority fee",
      legend: "Priority",
      amount: priorityFee,
      color: "bg-amber-500",
      activeColor: "text-amber-700 dark:text-amber-400",
      destination: "Paid to the block proposer",
    },
    {
      label: "Blob fee",
      legend: "Blob",
      amount: blobFee,
      color: "bg-cyan-500",
      activeColor: "text-cyan-700 dark:text-cyan-400",
      destination: "Burned",
    },
  ].map((segment) => ({
    ...segment,
    percentage: Number((segment.amount * 1000000n) / total) / 10000,
  }));

  return (
    <div
      className="mt-2 w-full max-w-sm"
      role="group"
      aria-label="Fee distribution"
    >
      <div className="flex h-1 w-full overflow-hidden rounded-full">
        {segments
          .filter(({ amount }) => amount > 0n)
          .map(({ label, amount, color, destination, percentage }) => {
            const description = `${label}: ${formatEther(
              amount
            )} ETH. ${destination}.`;
            return (
              <button
                key={label}
                type="button"
                aria-label={description}
                onMouseEnter={() => setActiveSegment(label)}
                onMouseLeave={() => setActiveSegment(null)}
                onFocus={() => setActiveSegment(label)}
                onBlur={() => setActiveSegment(null)}
                className={`h-full ${color} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
                style={{ width: `${percentage}%` }}
              >
                <span className="sr-only">{label}</span>
              </button>
            );
          })}
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
