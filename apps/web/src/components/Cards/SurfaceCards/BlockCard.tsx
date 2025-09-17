import { useMemo } from "react";
import type { FC } from "react";

import { formatWei } from "@blobscan/eth-format";

import { RollupBadge } from "~/components/Badges/RollupBadge";
import { BlobUsageDisplay } from "~/components/Displays/BlobUsageDisplay";
import { Separator } from "~/components/Separator";
import { Skeleton } from "~/components/Skeleton";
import type { Block, Rollup } from "~/types";
import { buildBlockRoute, normalizeTimestamp, pluralize } from "~/utils";
import { Link } from "../../Link";
import { CardField } from "../Card";
import { SurfaceCardBase } from "./SurfaceCardBase";

type BlockCardProps = {
  className?: string;
  block: Pick<
    Block,
    | "hash"
    | "number"
    | "blobGasPrice"
    | "blobGasUsed"
    | "timestamp"
    | "transactions"
  >;
};

const BlockCard: FC<Partial<BlockCardProps>> = function ({
  block: { blobGasPrice, blobGasUsed, number, timestamp, transactions } = {},
  className,
}) {
  const blobCount = useMemo(
    () => transactions?.reduce((acc, tx) => acc + tx.blobs.length, 0),
    [transactions]
  );
  const totalBlobSize = transactions
    ?.flatMap((tx) => tx.blobs)
    .reduce((acc, { size }) => acc + (size ?? 0), 0);
  const totalBlobUsage = transactions
    ?.flatMap((tx) => tx.blobs)
    .reduce((acc, { usageSize }) => acc + (usageSize ?? 0), 0);
  const rollupToAmount =
    transactions?.reduce<Partial<Record<Rollup, number>>>(
      (amounts, { blobs, rollup }) => {
        if (!rollup) {
          return amounts;
        }
        const amount = amounts[rollup] ?? 0;

        amounts[rollup] = amount + blobs.length;

        return amounts;
      },
      {} as Partial<Record<Rollup, number>>
    ) ?? [];

  return (
    <SurfaceCardBase className={className}>
      <div className="flex  justify-between gap-2 text-sm">
        <div className="flex gap-2 md:flex-row">
          {number ? (
            <div className="flex gap-1 text-contentSecondary-light dark:text-contentSecondary-dark">
              Block <Link href={buildBlockRoute(number)}>{number}</Link>
            </div>
          ) : (
            <Skeleton width={150} />
          )}
        </div>
        <div className="flex items-center gap-2">
          {Object.entries(rollupToAmount).map(([rollup, amount], i) => (
            <RollupBadge
              key={i}
              rollup={rollup as Rollup}
              amount={amount}
              compact
            />
          ))}
        </div>
      </div>
      {timestamp ? (
        <div className="text-xs italic text-contentSecondary-light dark:text-contentSecondary-dark">
          {normalizeTimestamp(timestamp).fromNow()}
        </div>
      ) : (
        <Skeleton width={110} size="xs" />
      )}
      <div className="mt-1.5 flex flex-col gap-1 text-xs">
        <div className="flex w-full gap-1">
          {blobGasPrice && blobGasUsed ? (
            <>
              <CardField
                name={<div title="Blob Gas Price">B. Gas Price</div>}
                value={formatWei(blobGasPrice)}
              />
              <Separator />
              <CardField
                name={<div title="Blob Gas Used">B. Gas Used</div>}
                value={blobGasUsed.toString()}
              />
            </>
          ) : (
            <Skeleton width={300} size="xs" />
          )}
        </div>
        {transactions ? (
          <div className="flex gap-1">
            <span>
              {transactions.length} {pluralize("Tx", transactions.length)}
            </span>
            <Separator />
            <span>
              {blobCount} {pluralize("Blob", blobCount ?? 0)}
            </span>
            {totalBlobSize !== undefined && totalBlobUsage !== undefined && (
              <>
                <Separator />
                <BlobUsageDisplay
                  blobSize={totalBlobSize}
                  blobUsage={totalBlobUsage}
                  variant="inline"
                />
              </>
            )}
          </div>
        ) : (
          <Skeleton width={170} size="xs" />
        )}
      </div>
    </SurfaceCardBase>
  );
};

export { BlockCard };
