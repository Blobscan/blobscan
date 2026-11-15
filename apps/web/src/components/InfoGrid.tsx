import React, { Fragment } from "react";
import type { ReactNode } from "react";

import "react-loading-skeleton/dist/skeleton.css";
import Skeleton from "react-loading-skeleton";

import { useBreakpoint } from "~/hooks/useBreakpoint";
import { ContentReveal } from "./ContentReveal";
import { InfoField } from "./InfoField";

export type InfoGridProps = {
  skeletonRows?: number;
  isLoading?: boolean;
  fields?: {
    name: ReactNode;
    value: ReactNode;
    helpText?: ReactNode;
    revealValue?: boolean;
  }[];
};

export const InfoGrid: React.FC<InfoGridProps> = function ({
  fields,
  skeletonRows,
  isLoading = false,
}) {
  const breakpoint = useBreakpoint();
  const isCompact = breakpoint === "default";
  const headerWidth = isCompact ? "100%" : "55%";
  const valueWidth = isCompact ? "100%" : "50%";
  const skeletonsLength = skeletonRows ?? (isCompact ? 4 : 7);
  const skeletonHeight = isCompact ? 15 : 15;

  return (
    <div className="grid w-full grid-cols-4 gap-3">
      {!fields
        ? Array.from({ length: skeletonsLength }).map((_, i) => (
            <Fragment key={i}>
              <div className="col-span-4 md:col-span-1">
                <Skeleton width={headerWidth} height={skeletonHeight} />
              </div>
              <div className="col-span-4 md:col-span-3">
                <Skeleton width={valueWidth} height={skeletonHeight} />
              </div>
            </Fragment>
          ))
        : fields.map(({ name, value, helpText, revealValue = true }, i) => (
            <Fragment key={typeof name === "string" ? name : i}>
              <div className="col-span-4 font-semibold text-contentSecondary-light dark:text-coolGray-400 md:col-span-1">
                {helpText ? (
                  <InfoField description={helpText}>{name}</InfoField>
                ) : (
                  name
                )}
              </div>
              <ContentReveal
                isLoading={isLoading || !revealValue}
                index={i}
                className="col-span-4 break-words text-sm md:col-span-3"
              >
                {value}
              </ContentReveal>
            </Fragment>
          ))}
    </div>
  );
};
