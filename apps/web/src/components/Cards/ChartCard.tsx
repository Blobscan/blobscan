import type { FC, ReactNode } from "react";
import cn from "classnames";
import type { EChartOption } from "echarts";

import "react-loading-skeleton/dist/skeleton.css";
import React from "react";
import Skeleton from "react-loading-skeleton";

import { ChartSkeleton } from "../ChartSkeleton";
import { ChartBase } from "../Charts/ChartBase";
import { Card } from "./Card";

type ChartCardProps = {
  title?: ReactNode;
  size?: "sm" | "md" | "lg";
  options: EChartOption;
};

function getSeriesDataState(series: EChartOption.Series[] | undefined) {
  return {
    isLoading: series
      ? series.some(({ data }) => data === undefined || data === null)
      : true,
    isEmpty: series ? series.some(({ data }) => data?.length === 0) : false,
  };
}

export const ChartCard: FC<ChartCardProps> = function ({
  title,
  size = "md",
  options,
}) {
  const { isEmpty, isLoading } = getSeriesDataState(options.series);

  return (
    <Card className="overflow-visible" compact>
      <div className="flex-start -mb-2 ml-2 flex font-semibold dark:text-warmGray-50">
        {title ?? <Skeleton width={150} />}
      </div>
      <div className="flex h-full flex-col gap-2">
        <div
          className={cn({
            "h-48 md:h-60 lg:h-56": size === "sm",
            "h-48 md:h-64 lg:h-80": size === "md",
            "h-48 md:h-64 lg:h-96": size === "lg",
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
            <ChartBase options={options} />
          )}
        </div>
      </div>
    </Card>
  );
};
