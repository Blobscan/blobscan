import type { FC } from "react";

import { CategoryIcon } from "~/components/CategoryIcon";
import { Skeleton } from "~/components/Skeleton";
import { StorageIcon } from "~/components/StorageIcon";
import { useBreakpoint } from "~/hooks/useBreakpoint";
import type { Category } from "~/types";
import { buildBlobRoute, formatBytes } from "~/utils";
import type { DeserializedBlob } from "~/utils";
import { Link } from "../../Link";
import { CardField } from "../Card";
import { SurfaceCardBase } from "./SurfaceCardBase";

type BlobCardProps = Partial<{
  blob: Pick<
    DeserializedBlob,
    "versionedHash" | "commitment" | "size" | "dataStorageReferences" | "proof"
  >;
  transactions: { category: Category | null }[];
  compact?: boolean;
}>;

const BlobCard: FC<BlobCardProps> = ({
  blob: { versionedHash, commitment, size, dataStorageReferences, proof } = {},
  transactions,
  compact,
}) => {
  const breakpoint = useBreakpoint();
  const isCompact =
    compact ||
    breakpoint === "sm" ||
    breakpoint === "md" ||
    breakpoint === "default";

  return (
    <SurfaceCardBase>
      <div className="flex flex-col gap-1 text-sm">
        {versionedHash ? (
          <div className="flex justify-between gap-2">
            <div className={`flex  gap-2 ${isCompact ? "max-w-[92%]" : ""}`}>
              <span className="text-contentSecondary-light dark:text-surfaceContentSecondary-dark">
                Blob
              </span>
              <Link href={buildBlobRoute(versionedHash)}>{versionedHash}</Link>
            </div>
            {transactions
              ?.filter((tx) => !!tx.category)
              .map(({ category }) => (
                <CategoryIcon key={category} category={category as Category} />
              ))}
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
        <div className="flex flex-row gap-2">
          {size && dataStorageReferences ? (
            <>
              <div className="flex gap-2 text-xs">
                <span>{formatBytes(size)}</span>
              </div>
              <span>·</span>
              <div className="flex flex-row gap-1">
                {dataStorageReferences.map(({ storage, url }) => (
                  <StorageIcon
                    key={storage}
                    storage={storage}
                    url={url}
                    size="md"
                  />
                ))}
              </div>
            </>
          ) : (
            <Skeleton width={120} size="xs" />
          )}
        </div>
      </div>
    </SurfaceCardBase>
  );
};

export { BlobCard };
