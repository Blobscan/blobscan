import { SkeletonRow } from "~/components/SkeletonItems";
import { CardBase, CardHeaderBase } from "../Bases";

export const BlockCardSkeleton: React.FC = function () {
  return (
    <div className="animate-pulse">
      <CardBase>
        <CardHeaderBase>
          <SkeletonRow className="h-5 w-20" />
        </CardHeaderBase>
        <div className="px-3 py-4">
          <SkeletonRow className="mb-2 h-3.5 w-28" />
          <SkeletonRow className="h-4" />
        </div>
      </CardBase>
    </div>
  );
};
