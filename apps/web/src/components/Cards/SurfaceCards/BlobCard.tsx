import type { FC } from "react";

import { RollupBadge } from "~/components/Badges/RollupBadge";
import { StorageBadge } from "~/components/Badges/StorageBadge";
import { BlobUsageDisplay } from "~/components/Displays/BlobUsageDisplay";
import { Separator } from "~/components/Separator";
import { Skeleton } from "~/components/Skeleton";
import { useBreakpoint } from "~/hooks/useBreakpoint";
import type { Blob, Rollup } from "~/types";
import { buildBlobRoute } from "~/utils";
import { Link } from "../../Link";
import { CardField } from "../Card";
import { SurfaceCardBase } from "./SurfaceCardBase";

type BlobCardProps = Partial<{
  blob: Pick<
    Blob,
    | "versionedHash"
    | "commitment"
    | "size"
    | "usageSize"
    | "dataStorageReferences"
    | "proof"
  > & { rollup?: Rollup | null };
  compact?: boolean;
  className?: string;
}>;

const BlobCard: FC<BlobCardProps> = ({
  blob: {
    versionedHash,
    commitment,
    size,
    usageSize,
    dataStorageReferences,
    proof,
    rollup,
  } = {},
  compact,
  className,
}) => {
  const breakpoint = useBreakpoint();
  const isCompact =
    compact ||
    breakpoint === "sm" ||
    breakpoint === "md" ||
    breakpoint === "default";

  return (
    <SurfaceCardBase className={className}>
      <div className="flex flex-col gap-1 text-sm">
        {versionedHash ? (
          <div className="flex justify-between gap-2">
            <div className={`flex gap-1 ${isCompact ? "max-w-[92%]" : ""}`}>
              <span className="text-contentSecondary-light dark:text-surfaceContentSecondary-dark">
                Blob
              </span>
              <Link href={buildBlobRoute(versionedHash)}>{versionedHash}</Link>
            </div>
            {rollup ? (
              <RollupBadge key={rollup} rollup={rollup} compact />
            ) : null}
          </div>
        ) : (
          <Skeleton width={isCompact ? undefined : 630} />
        )}
        {commitment ? (
          <CardField name="Commitment" value={commitment} />
        ) : (
          <Skeleton width={isCompact ? undefined : 760} size="xs" />
        )}
        {proof ? (
          <CardField name="Proof" value={proof} />
        ) : (
          <Skeleton width={isCompact ? undefined : 740} size="xs" />
        )}
        <div className="flex flex-row items-center gap-2 text-xs">
          {size !== undefined && usageSize !== undefined && (
            <BlobUsageDisplay
              blobSize={size}
              blobUsage={usageSize ?? 0}
              variant="inline"
            />
          )}
          {!!dataStorageReferences?.length && (
            <>
              <Separator />
              <div className="flex flex-row gap-1">
                {dataStorageReferences.map(({ storage, url }) => (
                  <StorageBadge
                    key={storage}
                    storage={storage}
                    url={url}
                    size="md"
                    compact
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </SurfaceCardBase>
  );
};

export { BlobCard };
