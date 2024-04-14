import type { FC } from "react";

import "react-loading-skeleton/dist/skeleton.css";
import Skeleton from "react-loading-skeleton";

import { buildBlobRoute, formatBytes } from "~/utils";
import type { DeserializedBlob } from "~/utils";
import { Link } from "../../Link";
import { SurfaceCardBase } from "./SurfaceCardBase";

type BlobCardProps = Partial<{
  blob: Pick<DeserializedBlob, "versionedHash" | "commitment" | "size">;
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
            <div className="truncate text-xs">
              <span className="text-contentTertiary-light dark:text-contentTertiary-dark">
                Commitment
              </span>{" "}
              {commitment}
            </div>
          ) : (
            <Skeleton width={700} />
          )}
        </div>
        <div>
          {size ? (
            <div className="flex gap-2 text-xs">
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
