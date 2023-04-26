import { SkeletonRow } from "~/components/SkeletonItems";
import { CardBase } from "../Bases";

export const TransactionCardSkeleton: React.FC = function () {
  return (
    <div className="animate-pulse">
      <CardBase>
        <div className="flex justify-between px-3 py-4">
          <div className="flex w-9/12 flex-col space-y-2">
            <SkeletonRow className="h-5 w-10/12" />
            <SkeletonRow className="h-3.5 w-8/12" />
            <SkeletonRow className="h-5 w-32" />
          </div>

          <div className="flex flex-col space-y-2 self-center">
            <SkeletonRow className="h-4 w-28" />
            <SkeletonRow className="h-4 w-20" />
          </div>
        </div>
      </CardBase>
    </div>
  );
};
