import { useMemo } from "react";
import { useRouter } from "next/router";

import dayjs from "~/dayjs";
import type { Block } from "~/types";
import { Link } from "../Link";
import { SurfaceCardBase } from "./SurfaceCardBase";

type BlockCardProps = {
  block: Block;
};

export const BlockCard: React.FC<BlockCardProps> = function ({ block }) {
  const router = useRouter();
  const { number, timestamp, transactions } = block;
  const hasOneTx = transactions.length === 1;
  const blobCount = useMemo(
    () => transactions.reduce((acc, tx) => acc + tx.blobs.length, 0),
    [transactions],
  );
  const hasOneBlob = blobCount === 1;

  return (
    <SurfaceCardBase>
      <div
        className={`
        bg-surfaceHeader-light
        px-3
        text-base
        font-semibold
        dark:bg-surfaceHeader-dark
        sm:p-3
      `}
      >
        Block <Link href="#">#{number}</Link>
      </div>
      <div className="px-4 py-2 text-sm sm:px-6">
        <div className="mb-2 text-xs italic text-contentSecondary-light dark:text-contentSecondary-dark">
          {dayjs.unix(timestamp).fromNow()}
        </div>
        <div>
          <Link href="#">
            <span>
              {transactions.length} Blob Transaction{hasOneTx ? "" : "s"}
            </span>
          </Link>
          <span className="mx-1 inline-block">･</span>
          <Link href="#">
            <span>
              {blobCount} Blob{hasOneBlob ? "" : "s"}
            </span>
          </Link>
        </div>
      </div>
    </SurfaceCardBase>
  );
};
