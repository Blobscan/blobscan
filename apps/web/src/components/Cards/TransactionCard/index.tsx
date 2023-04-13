import { type HTMLAttributes } from "react";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

import dayjs from "~/dayjs";
import { type Transaction } from "~/types";
import { Link } from "../../Link";
import { SurfaceCardBase } from "../Bases";

type TransactionCardProps = {
  transaction: Transaction;
};

const AddressLabel: React.FC<{
  className?: HTMLAttributes<HTMLSpanElement>["className"];
  address: string;
}> = function ({ address, className }) {
  return (
    <Link href="#">
      {<span className={`truncate text-xs ${className ?? ""}`}>{address}</span>}
    </Link>
  );
};

export const TransactionCard: React.FC<TransactionCardProps> = function ({
  transaction: { hash, from, to, block, blockNumber, blobs },
}) {
  return (
    <SurfaceCardBase>
      <div className="flex justify-between p-4 text-sm">
        <div className="flex flex-col space-y-2">
          <div>
            Transaction <Link href="#">{hash}</Link>
          </div>
          <div className="flex items-center space-x-2">
            <AddressLabel address={from} />
            <ArrowRightIcon className="h-2 w-2" />
            <AddressLabel address={to} />
          </div>
          <div className="mt-5 text-sm">
            <Link href="#">{blobs.length} Blobs</Link>
          </div>
        </div>

        <div className="flex flex-col space-y-2 self-center">
          <Link href="#">
            <span>Block #{blockNumber}</span>
          </Link>
          <div className="text-xs italic text-contentSecondary-light dark:text-contentSecondary-dark">
            {dayjs.unix(block.timestamp).fromNow()}
          </div>
        </div>
      </div>
    </SurfaceCardBase>
  );
};
