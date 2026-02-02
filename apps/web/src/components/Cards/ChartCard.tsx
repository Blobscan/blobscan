import type { FC, ReactNode } from "react";

import "react-loading-skeleton/dist/skeleton.css";
import React from "react";

import type { MakePartial, Size } from "~/types";
import { ChartSkeleton } from "../ChartSkeleton";
import { ChartBase } from "../Charts/ChartBase";
import type { ChartBaseProps } from "../Charts/ChartBase";
import { Card } from "./Card";

interface ChartCardProps
  extends MakePartial<ChartBaseProps, "dataset" | "series" | "options"> {
  headerControls?: ReactNode;
  title?: ReactNode;
}

const SIZES: Record<Size, string> = {
  xs: "h-48 md:h-56 lg:h-56",
  sm: "h-48 md:h-56 lg:h-56",
  md: "h-60 md:h-72 lg:h-72",
  lg: "h-72 md:h-80 lg:h-[22rem]",
  xl: "h-84 md:h-96 lg:h-[26rem]",
  "2xl": "h-96 md:h-[28rem] lg:h-[30rem]",
};

export const ChartCard: FC<ChartCardProps> = function ({
  dataset,
  headerControls,
  title,
  size = "md",
  options,
  series,
  metricInfo,
  compact,
}) {
  const { yAxis } = metricInfo;
  const yUnit = yAxis.displayUnit ?? yAxis.unit;
  const isEmpty = series && !series.length;
  const isLoading = !series;

  return (
    <Card className="h-full overflow-visible" compact>
      <div className="flex w-full justify-between p-1">
        {title && (
          <div className="flex-start -mb-2 flex font-semibold">
            {`${title}${yUnit ? ` (${yUnit})` : ""}`}
          </div>
        )}
        {!isLoading && headerControls}
      </div>
      <div className="flex h-full flex-col gap-2">
        <div className={SIZES[size]}>
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
              compact={compact}
              dataset={dataset}
              metricInfo={metricInfo}
              options={options}
              series={series}
            />
          )}
        </div>
      </div>
    </Card>
  );
};
