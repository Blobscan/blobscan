import { SkeletonBase, SkeletonRow } from "~/components/SkeletonItems";
import { CardBase, CardHeaderBase } from "../Bases";

export const BlockCardSkeleton: React.FC = function () {
  return (
    <SkeletonBase>
      <CardBase>
        <CardHeaderBase>
          <SkeletonRow className="h-5 w-32" />
        </CardHeaderBase>
        <div className="pt-4">
          <SkeletonRow className="mb-2 h-4 w-20" />
          <SkeletonRow className="h-4 w-60" />
        </div>
      </CardBase>
    </SkeletonBase>
  );
};
