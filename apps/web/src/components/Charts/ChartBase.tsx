import type { FC } from "react";
import { useMemo } from "react";
import { useState } from "react";
import type { EChartOption } from "echarts";
import EChartsReact from "echarts-for-react";
import { useTheme } from "next-themes";

import { cumulativeSum } from "~/utils";

type ChartBaseProps = {
  options: EChartOption;
  compact?: boolean;
};

const COMMON_OPTIONS: EChartOption = {
  grid: { top: 27, right: 10, bottom: 22, left: 45 },
  toolbox: {
    show: true,
    feature: {
      magicType: { type: ["bar", "line"] },
      dataView: { readOnly: false },
      saveAsImage: {},
    },
  },
  yAxis: {
    splitLine: { show: false },
  },
  tooltip: {
    trigger: "axis",
  },
};

function isDataObject(
  element: unknown[]
): element is EChartOption.SeriesLine.DataObject[] {
  return element.every(
    (el) =>
      typeof el === "object" &&
      el !== null &&
      "value" in el &&
      element.every((e) => typeof e === "number")
  );
}

function isNumberArray(elements: unknown[]): elements is number[] {
  return elements.every((el) => typeof el === "number");
}

function isStringArray(elements: unknown[]): elements is string[] {
  return elements.every((el) => typeof el === "string");
}

function tryConvert(element: string[], to: "number"): number[] | undefined;
function tryConvert(element: string[], to: "bigint"): bigint[] | undefined;
function tryConvert(element: string[], to: "number" | "bigint") {
  try {
    return element.map((el) => (to === "number" ? Number(el) : BigInt(el)));
  } catch (_) {
    return;
  }
}

function performCumulativeSum(data: unknown[]): string[] {
  let cumulativeSums;

  if (isNumberArray(data)) {
    cumulativeSums = cumulativeSum(data);
  } else if (isDataObject(data)) {
    const values = data.map(({ value }) => value);

    return performCumulativeSum(values);
  } else if (isStringArray(data)) {
    const bigNumbers = tryConvert(data, "bigint");

    if (bigNumbers) {
      cumulativeSums = cumulativeSum(bigNumbers);
    } else {
      const numbers = tryConvert(data, "number");

      if (numbers) {
        cumulativeSums = cumulativeSum(numbers);
      }
    }
  }

  if (cumulativeSums) {
    return cumulativeSums.map((sum) => sum.toString());
  }

  throw new Error("Unable to perform cumulative sum on data");
}

export const ChartBase: FC<ChartBaseProps> = function ({
  options,
  compact = false,
}) {
  const { resolvedTheme } = useTheme();

  const [showCumulative, setShowCumulative] = useState(false);

  const processedSeries = useMemo(
    () =>
      options.series?.map((series) => {
        const { data } = series;
        let newData = data;

        if (showCumulative && data) {
          newData = performCumulativeSum(data);
        }

        return {
          ...series,
          data: newData,
        };
      }),
    [options, showCumulative]
  );

  return (
    <EChartsReact
      option={{
        ...COMMON_OPTIONS,
        ...options,
        grid: {
          ...COMMON_OPTIONS.grid,
          ...(options.grid || {}),
        },
        toolbox: {
          ...COMMON_OPTIONS["toolbox"],
          ...(options.toolbox || {}),
          iconStyle: {
            borderColor: resolvedTheme === "dark" ? "#7D80AB" : "#171717",
          },
          emphasis: {
            iconStyle: {
              borderColor: resolvedTheme === "dark" ? "#E2CFFF" : "#5D25D4",
            },
          },
          feature: {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            ...COMMON_OPTIONS.toolbox?.feature,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            ...(options.toolbox?.feature || {}),
            mySwitchToCumulative: {
              show: true,
              iconStyle: {
                borderColor: showCumulative
                  ? resolvedTheme === "dark"
                    ? "#E2CFFF"
                    : "#5D25D4"
                  : undefined,
              },
              title: "Switch to Cumulative",
              icon: "path://M14.5 2C14.2239 2 14 2.22386 14 2.5C14 2.77614 14.2239 3 14.5 3H16.2929L11.5 7.79289L8.85355 5.14645C8.65829 4.95118 8.34171 4.95118 8.14645 5.14645L3.14645 10.1464C2.95118 10.3417 2.95118 10.6583 3.14645 10.8536C3.34171 11.0488 3.65829 11.0488 3.85355 10.8536L8.5 6.20711L11.1464 8.85355C11.3417 9.04882 11.6583 9.04882 11.8536 8.85355L17 3.70711V5.5C17 5.77614 17.2239 6 17.5 6C17.7761 6 18 5.77614 18 5.5V2.5C18 2.22386 17.7761 2 17.5 2H14.5ZM15.5 9C15.2239 9 15 9.22386 15 9.5V17.5C15 17.7761 15.2239 18 15.5 18C15.7761 18 16 17.7761 16 17.5V9.5C16 9.22386 15.7761 9 15.5 9ZM7.5 11C7.22386 11 7 11.2239 7 11.5V17.5C7 17.7761 7.22386 18 7.5 18C7.77614 18 8 17.7761 8 17.5V11.5C8 11.2239 7.77614 11 7.5 11ZM11 13.5C11 13.2239 11.2239 13 11.5 13C11.7761 13 12 13.2239 12 13.5V17.5C12 17.7761 11.7761 18 11.5 18C11.2239 18 11 17.7761 11 17.5V13.5ZM3 14.5C3 14.2239 3.22386 14 3.5 14C3.77614 14 4 14.2239 4 14.5V17.5C4 17.7761 3.77614 18 3.5 18C3.22386 18 3 17.7761 3 17.5V14.5Z",
              onclick: () =>
                setShowCumulative((prevShowCumulative) => !prevShowCumulative),
            },
          },
        },
        tooltip: {
          ...COMMON_OPTIONS["tooltip"],
          ...(options.tooltip || {}),
        },
        xAxis: {
          ...(COMMON_OPTIONS.xAxis || {}),
          ...(options.xAxis || {}),
          ...(compact
            ? {
                axisLine: { show: false },
                axisLabel: {
                  interval: 4,
                },
              }
            : {}),
        },
        yAxis: {
          ...(COMMON_OPTIONS.yAxis || {}),
          ...(options.yAxis || {}),
          axisLine: { show: !compact },
        },
        series: processedSeries,
      }}
      style={{ height: "100%", width: "100%" }}
    />
  );
};
