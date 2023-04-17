import { useMemo } from "react";
import { useRouter } from "next/router";

import dayjs from "~/dayjs";
import type { Block } from "~/types";
import { buildRoute } from "~/utils";
import { Link } from "../../Link";
import { CardBase, CardHeaderBase } from "../Bases";

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
    <CardBase>
      <CardHeaderBase>
        Block{" "}
        <Link href={buildRoute("block", block.number.toString())}>
          #{number}
        </Link>
      </CardHeaderBase>
      <div className="px-3 py-2 text-sm">
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
    </CardBase>
  );
};
