import { type ReactNode } from "react";

import { SkeletonBase, SkeletonRow } from "~/components/SkeletonItems";
import { CardBase } from ".";

export const CardBaseSkeleton: React.FC<{ header?: ReactNode }> = function ({
  header,
}) {
  return (
    <CardBase header={header}>
      <SkeletonBase>
        {!header && <SkeletonRow className="mb-12 h-5 w-52" />}
        <div className="space-y-6">
          <SkeletonRow className="h-5 w-7/12" />
          <SkeletonRow className="h-5 w-3/12" />
          <SkeletonRow className="h-5 w-6/12" />
          <SkeletonRow className="h-5 w-7/12" />
        </div>
      </SkeletonBase>
    </CardBase>
  );
};
