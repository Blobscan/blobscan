import { useMemo } from "react";
import type { FC } from "react";

import type dayjs from "@blobscan/dayjs";

import { CategoryIcon } from "~/components/CategoryIcon";
import { EtherUnitDisplay } from "~/components/Displays/EtherUnitDisplay";
import { Skeleton } from "~/components/Skeleton";
import type { Category } from "~/types";
import { buildBlockRoute } from "~/utils";
import { Link } from "../../Link";
import { CardField } from "../Card";
import { SurfaceCardBase } from "./SurfaceCardBase";

type BlockCardProps = {
  block: {
    hash: string;
    number: number;
    blobGasPrice: bigint;
    blobGasUsed: bigint;
    timestamp: dayjs.Dayjs;
    transactions: {
      category?: Category | null;
      blobs: { versionedHash: string }[];
    }[];
  };
};

const BlockCard: FC<Partial<BlockCardProps>> = function ({
  block: { blobGasPrice, blobGasUsed, number, timestamp, transactions } = {},
}) {
  const hasOneTx = transactions?.length === 1;
  const blobCount = useMemo(
    () => transactions?.reduce((acc, tx) => acc + tx.blobs.length, 0),
    [transactions]
  );
  const categories =
    (transactions?.map((tx) => tx.category).filter(Boolean) as Category[]) ??
    [];

  const hasOneBlob = blobCount === 1;

  return (
    <SurfaceCardBase>
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
          {categories.map((category, i) => (
            <CategoryIcon key={i} category={category} />
          ))}
        </div>
      </div>
      {timestamp ? (
        <div className="text-xs italic text-contentSecondary-light dark:text-contentSecondary-dark">
          {timestamp.fromNow()}
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
                value={<EtherUnitDisplay amount={blobGasPrice} />}
              />
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
          <div className="mt-1 flex">
            <span>
              {transactions.length} Blob Tx{hasOneTx ? "" : "s"}
            </span>
            <span className="mx-1 inline-block">･</span>
            <span>
              {blobCount} Blob{hasOneBlob ? "" : "s"}
            </span>
          </div>
        ) : (
          <Skeleton width={170} size="xs" />
        )}
      </div>
    </SurfaceCardBase>
  );
};

export { BlockCard };
