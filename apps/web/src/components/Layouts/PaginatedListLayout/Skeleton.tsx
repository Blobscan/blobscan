import { Fragment, type FC, type ReactNode } from "react";

import { Header } from "~/components/Header";
import { SectionCard } from "../../Cards/SectionCard";
import { SkeletonBase } from "../../SkeletonItems";

export const Skeleton: FC<{ header: ReactNode; skeletonItem: ReactNode }> =
  function ({ header, skeletonItem }) {
    return (
      <>
        <Header>{header}</Header>
        <SectionCard>
          <SkeletonBase>
            <div className="h-10" />
            <div className="space-y-6">
              {Array(6)
                .fill(skeletonItem)
                .map((el, i) => (
                  <Fragment key={i}>{el}</Fragment>
                ))}
            </div>
          </SkeletonBase>
        </SectionCard>
      </>
    );
  };
