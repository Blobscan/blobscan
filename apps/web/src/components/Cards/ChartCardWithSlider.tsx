import type { EChartOption } from "echarts";
import type { FC, ReactNode } from "react";

import cn from "classnames";
import Slider from '@mui/material/Slider';
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import { useState } from "react";
import { Card } from "~/components/Cards/Card";
import { ChartBase } from "~/components/Charts/ChartBase";
import { ChartSkeleton } from "~/components/ChartSkeleton";
import { buildTimeSeriesOptions, normalizeTimestamp } from "~/utils";

function getSeriesDataState(series: EChartOption.Series[] | undefined) {
  return {
    isLoading: series
      ? series.some(({ data }) => data === undefined || data === null)
      : true,
    isEmpty: series ? series.some(({ data }) => data?.length === 0) : false,
  };
}

export type ChartCardWithSliderProps = {
  title?: ReactNode;
  size?: "sm" | "md" | "lg";
  compact?: boolean;
  allData: bigint[];
  allAxle: number[];
  initCoordinateAxle: number[];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  xAxisLabel?: (value: any) => unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  xAxisTooltip?: (value: any) => unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  yAxisLabel?: (value: any) => unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  yAxisTooltip?: (value: any) => unknown;

  minDistance: number;
  sliderStep?: number;
}

export const ChartCardWithSlider: FC<ChartCardWithSliderProps> = function ({
  title,
  size = "md",
  compact = false,
  allData,
  allAxle,
  initCoordinateAxle,

  xAxisLabel = (value) => normalizeTimestamp(value).format("HH:mm:ss"),
  xAxisTooltip = (value) => value,
  yAxisLabel = (value) => value,
  yAxisTooltip = (value) => value,

  minDistance,
  sliderStep = 1,
}) {
  const [initAxle, setInitAxle] = useState<number[]>(initCoordinateAxle);
  const [axleRange, setAxleRange] = useState<number[]>(
    allAxle.slice(
      allAxle.indexOf(initAxle[0] as number),
      allAxle.indexOf(initAxle[1] as number) + 1,
    )
  );
  const [dataRange, setDataRange] = useState<bigint[]>(
    allData.slice(
      allAxle.indexOf(initAxle[0] as number),
      allAxle.indexOf(initAxle[1] as number) + 1,
    )
  )

  const handleRangeChange = (
    event: Event,
    newRange: number | number[],
    activeThumb: number,
  ) => {
    if (!Array.isArray(newRange) || newRange.length < 2) {
      return;
    }

    if (newRange[1] as number - (newRange[0] as number) < minDistance) {
      if (activeThumb === 0) {
        const start = Math.min(
          newRange[0] as number,
          (allAxle[allAxle.length - 1] as number) - minDistance
        );
        const end = start + minDistance;
        setInitAxle([start, end]);
        setAxleRange(allAxle.slice(
          allAxle.indexOf(start),
          allAxle.indexOf(end) + 1,
        ));
        setDataRange(allData.slice(
          allAxle.indexOf(start),
          allAxle.indexOf(end) + 1,
        ));
      } else {
        const end = Math.max(
          newRange[1] as number,
          (allAxle[0] as number) + minDistance
        );
        const start = end - minDistance;
        setInitAxle([start, end]);
        setAxleRange(allAxle.slice(
          allAxle.indexOf(start),
          allAxle.indexOf(end) + 1,
        ));
        setDataRange(allData.slice(
          allAxle.indexOf(start),
          allAxle.indexOf(end) + 1,
        ));
      }
    } else {
      setInitAxle(newRange);
      setAxleRange(allAxle.slice(
        allAxle.indexOf(newRange[0] as number),
        allAxle.indexOf(newRange[1] as number) + 1,
      ));
      setDataRange(allData.slice(
        allAxle.indexOf(newRange[0] as number),
        allAxle.indexOf(newRange[1] as number) + 1,
      ));
    }
  };

  const options: EChartOption<
    EChartOption.SeriesBar | EChartOption.SeriesLine
  > = {
    ...buildTimeSeriesOptions({
      dates: axleRange.map((time) => normalizeTimestamp(time).format("YYYY-MM-DD HH:mm:ss")),
      axisFormatters: {
        xAxisLabel: xAxisLabel,
        xAxisTooltip: xAxisTooltip,
        yAxisLabel: yAxisLabel,
        yAxisTooltip:yAxisTooltip,
      },
    }),
    // Improper configuration may result in incomplete display of the x/y axis.
    // More Info: https://echarts.apache.org/en/option.html#title
    grid: { top: 27, right: 25, bottom: "20%", left: 100 },
    series: [
      {
        name: "Reward",
        data: dataRange.map(value => Number(value)),
        type: compact ? "line" : "bar",
        smooth: true,
      },
    ],
  };
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
            "h-80 md:h-96 lg:h-160": size === "lg",
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
            <div className="flex flex-col h-full w-full items-center">
              <ChartBase options={options} />
              <Slider
                value={initAxle}
                onChange={handleRangeChange}
                min={allAxle[0]}
                max={allAxle[allAxle.length - 1]}
                step={sliderStep}
                shiftStep={sliderStep}
                valueLabelDisplay="auto"
                valueLabelFormat={(index: number) => normalizeTimestamp(index).format("YYYY-MM-DD HH:mm:ss")}
                color="info"
                disableSwap
                marks
              />
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
