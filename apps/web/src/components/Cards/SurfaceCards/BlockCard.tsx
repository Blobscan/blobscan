import { useMemo, type FC } from "react";

import "react-loading-skeleton/dist/skeleton.css";
import Skeleton from "react-loading-skeleton";

import dayjs from "~/utils/dayjs";
import type { Block } from "~/types";
import { buildBlockRoute } from "~/utils";
import { Link } from "../../Link";
import { CardHeader } from "../Card";
import { SurfaceCardBase } from "./SurfaceCardBase";

type BlockCardProps = {
  block: Block;
};

const BlockCard: FC<Partial<BlockCardProps>> = function ({
  block: { number, timestamp, transactions } = {},
}) {
  const hasOneTx = transactions?.length === 1;
  const blobCount = useMemo(
    () => transactions?.reduce((acc, tx) => acc + tx.blobs.length, 0),
    [transactions],
  );
  const hasOneBlob = blobCount === 1;

  return (
    <SurfaceCardBase>
      <CardHeader>
        {number ? (
          <>
            Block <Link href={buildBlockRoute(number)}>#{number}</Link>
          </>
        ) : (
          <Skeleton width={130} />
        )}
      </CardHeader>
      <div className="pt-2 text-sm">
        {timestamp ? (
          <div className="mb-2 text-xs italic text-contentSecondary-light dark:text-contentSecondary-dark">
            {dayjs(timestamp).fromNow()}
          </div>
        ) : (
          <Skeleton width={100} />
        )}
        {transactions ? (
          <div className="flex">
            <span>
              {transactions.length} Blob Tx{hasOneTx ? "" : "s"}
            </span>
            <span className="mx-1 inline-block">･</span>
            <span>
              {blobCount} Blob{hasOneBlob ? "" : "s"}
            </span>
          </div>
        ) : (
          <Skeleton width={200} />
        )}
      </div>
    </SurfaceCardBase>
  );
};

export { BlockCard };
