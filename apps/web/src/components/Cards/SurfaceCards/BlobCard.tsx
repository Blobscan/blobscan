import type { FC } from "react";

import "react-loading-skeleton/dist/skeleton.css";
import Skeleton from "react-loading-skeleton";

import type { Transaction } from "~/types";
import { buildBlobRoute } from "~/utils";
import { Link } from "../../Link";
import { SurfaceCardBase } from "./SurfaceCardBase";

type BlobCardProps = Partial<{
  blob: Transaction["blobs"][0];
  txHash: string;
}>;

const BlobCard: FC<BlobCardProps> = ({
  blob: { index, blobHash: versionedHash, blob } = {},
  txHash,
}) => {
  const isIndexDefined = index !== undefined;

  return (
    <SurfaceCardBase>
      <div className="space-y-2 text-sm">
        <div className="font-semibold">
          {isIndexDefined && txHash ? (
            <Link
              href={
                isIndexDefined && txHash ? buildBlobRoute(txHash, index) : ""
              }
            >
              Blob #{index}
            </Link>
          ) : (
            <Skeleton width={70} />
          )}
        </div>
        <div className="flex flex-col gap-1">
          <div className="font-semibold">
            {versionedHash ? "Versioned Hash" : <Skeleton width={120} />}
          </div>
          <div className="truncate">
            {versionedHash ?? <Skeleton width={400} />}
          </div>
        </div>
        <div>
          <div className="gap-1 font-semibold">
            {blob?.commitment ? "Commitment" : <Skeleton width={90} />}
          </div>
          <div className="truncate">
            {blob?.commitment ?? <Skeleton width={700} />}
          </div>
        </div>
      </div>
    </SurfaceCardBase>
  );
};

export { BlobCard };
