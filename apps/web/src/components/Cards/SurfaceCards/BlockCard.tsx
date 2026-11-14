import { useMemo } from "react";
import type { FC } from "react";

import { formatWei } from "@blobscan/eth-format";

import { RollupBadgeGroup } from "~/components/Badges/RollupBadgeGroup";
import { ContentReveal } from "~/components/ContentReveal";
import { BlobUsageDisplay } from "~/components/Displays/BlobUsageDisplay";
import { Separator } from "~/components/Separator";
import { Skeleton } from "~/components/Skeleton";
import { routes } from "~/routes";
import type { Block, Rollup } from "~/types";
import { normalizeTimestamp, pluralize } from "~/utils";
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
      (amounts, { rollup }) => {
        if (!rollup) {
          return amounts;
        }
        const amount = amounts[rollup] ?? 0;

        amounts[rollup] = amount + 1;

        return amounts;
      },
      {} as Partial<Record<Rollup, number>>
    ) ?? {};

  return (
    <SurfaceCardBase className={className}>
      <div className="flex items-center justify-between gap-2 text-sm">
        <div className="flex gap-2 md:flex-row">
          <ContentReveal isLoading={!number}>
            {number ? (
              <div className="flex gap-1 text-contentSecondary-light dark:text-contentSecondary-dark">
                Block <Link href={routes.block(number)}>{number}</Link>
              </div>
            ) : (
              <Skeleton width={150} />
            )}
          </ContentReveal>
        </div>
        <div className="flex h-5 shrink-0 items-center justify-end">
          <RollupBadgeGroup amounts={rollupToAmount} />
        </div>
      </div>
      <ContentReveal isLoading={!timestamp}>
        {timestamp ? (
          <div className="text-xs italic text-contentSecondary-light dark:text-contentSecondary-dark">
            {normalizeTimestamp(timestamp).fromNow()}
          </div>
        ) : (
          <Skeleton width={110} size="xs" />
        )}
      </ContentReveal>
      <div className="mt-1.5 flex flex-col gap-1 text-xs">
        <div className="flex w-full gap-1">
          <ContentReveal
            className="flex w-full gap-1"
            isLoading={!(blobGasPrice && blobGasUsed)}
          >
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
          </ContentReveal>
        </div>
        <ContentReveal isLoading={!transactions}>
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
        </ContentReveal>
      </div>
    </SurfaceCardBase>
  );
};

export { BlockCard };
