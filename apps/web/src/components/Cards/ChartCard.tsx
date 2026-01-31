import type { FC, ReactNode } from "react";
import cn from "classnames";

import "react-loading-skeleton/dist/skeleton.css";
import React from "react";
import Skeleton from "react-loading-skeleton";

import { ChartSkeleton } from "../ChartSkeleton";
import { ChartBase } from "../Charts/ChartBase";
import type { ChartBaseProps } from "../Charts/ChartBase";
import { Card } from "./Card";

interface ChartCardProps extends ChartBaseProps {
  headerControls?: ReactNode;
  title?: ReactNode;
}

export const ChartCard: FC<ChartCardProps> = function ({
  headerControls,
  title,
  size = "md",
  options,
  metricInfo,
  compact,
}) {
  const { yAxis } = metricInfo;
  const yUnit = yAxis.displayUnit ?? yAxis.unit;
  const isEmpty = options.series && options.series.length === 0;
  const isLoading = !options.series;

  return (
    <Card className="h-full overflow-visible" compact>
      <div className="flex w-full justify-between p-1">
        <div className="flex-start -mb-2 flex font-semibold">
          {`${title}${yUnit ? ` (${yUnit})` : ""}` ?? <Skeleton width={150} />}
        </div>
        {!isLoading && headerControls}
      </div>
      <div className="flex h-full flex-col gap-2">
        <div
          className={cn({
            "h-48 md:h-56 lg:h-56": size === "sm",
            "h-60 md:h-72 lg:h-72": size === "md",
            "h-72 md:h-80 lg:h-[22rem]": size === "lg",
            "h-84 md:h-96 lg:h-[26rem]": size === "xl",
            "h-96 md:h-[28rem] lg:h-[30rem]": size === "2xl",
          })}
        >
          {isEmpty ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-sm font-thin uppercase text-contentSecondary-light dark:text-contentSecondary-dark">
                No data
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex h-full w-full items-center justify-center">
              <ChartSkeleton itemsCount={6} />
            </div>
          ) : (
            <ChartBase
              metricInfo={metricInfo}
              options={options}
              compact={compact}
            />
          )}
        </div>
      </div>
    </Card>
  );
};
