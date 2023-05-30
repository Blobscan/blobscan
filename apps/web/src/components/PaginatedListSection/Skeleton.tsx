import { Fragment, type FC, type ReactNode } from "react";

import { SectionCard } from "../Cards/SectionCard";
import { SkeletonBase } from "../SkeletonItems";

export const Skeleton: FC<{ header: ReactNode; skeletonItem: ReactNode }> =
  function ({ header, skeletonItem }) {
    return (
      <SectionCard header={header}>
        <SkeletonBase>
          <div className="space-y-4">
            {Array(6)
              .fill(skeletonItem)
              .map((el, i) => (
                <Fragment key={i}>{el}</Fragment>
              ))}
          </div>
        </SkeletonBase>
      </SectionCard>
    );
  };
