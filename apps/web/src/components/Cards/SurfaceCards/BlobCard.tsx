import type { FC } from "react";

import "react-loading-skeleton/dist/skeleton.css";
import Skeleton from "react-loading-skeleton";

import type { Transaction } from "~/types";
import { buildBlobRoute } from "~/utils";
import { Link } from "../../Link";
import { SurfaceCardBase } from "./SurfaceCardBase";

type BlobCardProps = Partial<{
  blobOnTx: Transaction["blobs"][0];
}>;

const BlobCard: FC<BlobCardProps> = ({
  blobOnTx: { blobHash: versionedHash, blob, index } = {},
}) => {
  const isIndexDefined = index !== undefined;

  return (
    <SurfaceCardBase>
      <div className="space-y-2 text-sm">
        <div className="font-semibold">
          {isIndexDefined ? `Blob #${index}` : <Skeleton width={70} />}
        </div>
        <div className="flex flex-col gap-1">
          <div className="font-semibold">
            {versionedHash ? "Versioned Hash" : <Skeleton width={120} />}
          </div>
          <div className="truncate">
            {versionedHash ? (
              <Link href={buildBlobRoute(versionedHash)}>{versionedHash}</Link>
            ) : (
              <Skeleton width={400} />
            )}
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
