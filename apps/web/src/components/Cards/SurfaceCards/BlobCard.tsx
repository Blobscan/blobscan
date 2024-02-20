import type { FC } from "react";

import "react-loading-skeleton/dist/skeleton.css";
import Skeleton from "react-loading-skeleton";

import type { AllBlobs } from "~/types";
import { buildBlobRoute, formatBytes } from "~/utils";
import { Link } from "../../Link";
import { SurfaceCardBase } from "./SurfaceCardBase";

type BlobCardProps = Partial<{
  blob: AllBlobs["blobs"][number];
}>;

const BlobCard: FC<BlobCardProps> = ({
  blob: { versionedHash, commitment, size } = {},
}) => {
  return (
    <SurfaceCardBase>
      <div className="flex flex-col gap-2 text-sm">
        <div>
          {versionedHash ? (
            <div className="flex gap-2">
              <span className="font-bold text-contentSecondary-light dark:text-surfaceContentSecondary-dark">
                Blob
              </span>
              <Link href={buildBlobRoute(versionedHash)}>{versionedHash}</Link>
            </div>
          ) : (
            <Skeleton width={400} />
          )}
        </div>
        <div>
          {commitment ? (
            <div className="truncate text-xs">{commitment}</div>
          ) : (
            <Skeleton width={700} />
          )}
        </div>
        <div>
          {size ? (
            <div className="rwz flex gap-2">
              <span>{formatBytes(size)}</span>
            </div>
          ) : (
            <Skeleton width={120} />
          )}
        </div>
      </div>
    </SurfaceCardBase>
  );
};

export { BlobCard };
