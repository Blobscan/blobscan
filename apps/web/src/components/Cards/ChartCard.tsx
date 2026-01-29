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
  title?: ReactNode;
}

export const ChartCard: FC<ChartCardProps> = function ({
  title,
  size = "md",
  options,
  metricInfo,
  compact,
  showLegend,
}) {
  const { yAxis } = metricInfo;
  const yUnit = yAxis.displayUnit ?? yAxis.unit;
  const isEmpty = options.series && options.series.length === 0;
  const isLoading = !options.series;

  return (
    <Card className="h-full overflow-visible" compact>
      <div className="flex-start -mb-2 ml-2 flex font-semibold dark:text-warmGray-50">
        {`${title}${yUnit ? ` (${yUnit})` : ""}` ?? <Skeleton width={150} />}
      </div>
      <div className="flex h-full flex-col gap-2">
        <div
          className={cn({
            "h-48 md:h-60 lg:h-56": size === "sm",
            "h-64 md:h-64 lg:h-80": size === "md",
            "h-72 md:h-72 lg:h-96": size === "lg",
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
              showLegend={showLegend}
            />
          )}
        </div>
      </div>
    </Card>
  );
};
