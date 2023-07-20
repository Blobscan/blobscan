import type { FC, ReactNode } from "react";
import cn from "classnames";
import type { EChartOption } from "echarts";

import "react-loading-skeleton/dist/skeleton.css";
import Skeleton from "react-loading-skeleton";

import { ChartBase } from "../Charts/ChartBase";
import { Card, CardHeader } from "./Card";

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

const ChartSkeleton: FC = function () {
  return (
    <div className="flex items-end gap-1">
      <Skeleton width={20} height={20} />
      <Skeleton width={20} height={50} />
      <Skeleton width={20} height={70} />
      <Skeleton width={20} height={40} />
      <Skeleton width={20} height={80} />
      <Skeleton width={20} height={60} />
      <Skeleton width={20} height={100} />
    </div>
  );
};

export const ChartCard: FC<ChartCardProps> = function ({
  title,
  size = "md",
  options,
}) {
  const { isEmpty, isLoading } = getSeriesDataState(options.series);

  return (
    <Card compact>
      <div className="flex h-full flex-col gap-2">
        <div
          className={cn({
            "h-48 md:h-60 lg:h-48": size === "sm",
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
              <ChartSkeleton />
            </div>
          ) : (
            <ChartBase options={options} />
          )}
        </div>

        <CardHeader inverse compact>
          <div className="flex justify-center text-sm">
            {title ?? <Skeleton width={150} />}
          </div>
        </CardHeader>
      </div>
    </Card>
  );
};
