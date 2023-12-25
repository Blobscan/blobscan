import React, { Fragment } from "react";
import type { ReactNode } from "react";

import "react-loading-skeleton/dist/skeleton.css";
import Skeleton from "react-loading-skeleton";

import { useBreakpoint } from "~/hooks/useBreakpoint";

export type InfoGridProps = {
  fields?: { name: ReactNode; value: ReactNode }[];
};

export const InfoGrid: React.FC<InfoGridProps> = function ({ fields }) {
  const breakpoint = useBreakpoint();
  const isCompact = breakpoint === "default";
  const headerWidth = isCompact ? "100%" : "55%";
  const valueWidth = isCompact ? "100%" : "70%";
  const skeletonsLength = isCompact ? 4 : 7;
  const skeletonHeight = isCompact ? 17 : 20;

  return (
    <div className="grid w-full gap-3 md:grid-cols-4">
      {!fields
        ? Array.from({ length: skeletonsLength }).map((_, i) => (
            <Fragment key={i}>
              <div>
                <Skeleton width={headerWidth} height={skeletonHeight} />
              </div>
              <div className="col-span-3">
                <Skeleton width={valueWidth} height={skeletonHeight} />
              </div>
            </Fragment>
          ))
        : fields.map(({ name, value }, i) => (
            <Fragment key={i}>
              <div className="font-semibold dark:text-coolGray-400">{name}</div>
              <div className="col-span-3 overflow-hidden break-words text-sm">
                {value}
              </div>
            </Fragment>
          ))}
    </div>
  );
};
