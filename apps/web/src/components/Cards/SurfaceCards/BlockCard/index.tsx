import { useMemo } from "react";

import dayjs from "~/utils/dayjs";
import type { Block } from "~/types";
import { buildBlockRoute } from "~/utils";
import { Link } from "../../../Link";
import { CardTitleBase } from "../../Bases";
import { SurfaceCardBase } from "../SurfaceCardBase";

type BlockCardProps = {
  block: Block;
};

export const BlockCard: React.FC<BlockCardProps> = function ({ block }) {
  const { number, timestamp, transactions } = block;
  const hasOneTx = transactions.length === 1;
  const blobCount = useMemo(
    () => transactions.reduce((acc, tx) => acc + tx.blobs.length, 0),
    [transactions],
  );
  const hasOneBlob = blobCount === 1;

  return (
    <SurfaceCardBase>
      <CardTitleBase>
        Block <Link href={buildBlockRoute(number)}>#{number}</Link>
      </CardTitleBase>
      <div className="pt-2 text-sm">
        <div className="mb-2 text-xs italic text-contentSecondary-light dark:text-contentSecondary-dark">
          {dayjs(timestamp).fromNow()}
        </div>
        <div className="flex">
          <span>
            {transactions.length} Blob Transaction{hasOneTx ? "" : "s"}
          </span>
          <span className="mx-1 inline-block">･</span>
          <span>
            {blobCount} Blob{hasOneBlob ? "" : "s"}
          </span>
        </div>
      </div>
    </SurfaceCardBase>
  );
};

export { BlockCardSkeleton } from "./Skeleton";
