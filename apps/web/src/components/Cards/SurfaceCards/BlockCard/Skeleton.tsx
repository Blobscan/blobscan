import { SkeletonBase, SkeletonRow } from "~/components/SkeletonItems";
import { CardTitleBase } from "../../Bases";
import { SurfaceCardBase } from "../SurfaceCardBase";

export const BlockCardSkeleton: React.FC = function () {
  return (
    <SkeletonBase>
      <SurfaceCardBase>
        <CardTitleBase>
          <SkeletonRow className="h-5 w-32" />
        </CardTitleBase>
        <div className="pt-4">
          <SkeletonRow className="mb-2 h-4 w-60 max-w-[90px]" />
          <SkeletonRow className="h-4 max-w-[300px]" />
        </div>
      </SurfaceCardBase>
    </SkeletonBase>
  );
};
