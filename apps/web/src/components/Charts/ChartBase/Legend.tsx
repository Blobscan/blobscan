import React, { useCallback, useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import cn from "classnames";
import type { ECElementEvent, EChartOption } from "echarts";
import type { EChartsInstance } from "echarts-for-react";

import { Scrollable } from "~/components/Scrollable";
import { formatSeriesName } from "./helpers";

export type LegendProps = {
  echartRef: MutableRefObject<EChartsInstance | null>;
};

type LegendItem = {
  name: string;
  color: string;
  disabled: boolean;
};

export const Legend: React.FC<LegendProps> = function ({ echartRef }) {
  const legendRef = useRef<HTMLDivElement>(null);
  const [currentSeriesName, setCurrentSeriesName] = useState<
    string | undefined
  >();
  const [items, setItems] = useState<LegendItem[]>([]);

  const handleToggle = useCallback(
    ({ name, disabled: itemDisabled }: LegendItem) => {
      const allClicked = name === "All";

      if (allClicked) {
        echartRef.current?.getEchartsInstance().dispatchAction({
          type: !itemDisabled ? "legendUnSelect" : "legendToggleSelect",
          batch: items.map(({ name }) => ({
            name,
          })),
        });
        setItems((prev) =>
          prev.map((item) => ({ ...item, disabled: !itemDisabled }))
        );

        return;
      }

      echartRef.current?.getEchartsInstance().dispatchAction({
        type: "legendToggleSelect",
        name,
      });

      setItems((prev) =>
        prev.map((item) =>
          item.name === name || allClicked
            ? { ...item, disabled: !item.disabled }
            : item
        )
      );
    },
    [echartRef, items]
  );

  useEffect(() => {
    const echartInstance = echartRef.current?.getEchartsInstance();

    if (!echartInstance) {
      return;
    }

    const options = echartInstance.getOption();
    const series =
      options?.series.map(({ name, itemStyle }: EChartOption.SeriesLine) => ({
        name,
        color: itemStyle?.color ?? "#505050",
        disabled: false,
      })) ?? [];

    const items = [...series].reverse();

    if (items.length > 1) {
      items.unshift({
        name: "All",
        disabled: false,
      });
    }
    setItems(items);

    echartInstance.on(
      "mouseover",
      ({ componentType, seriesName, seriesIndex }: ECElementEvent) => {
        if (componentType === "series" && !!seriesName && !!seriesIndex) {
          setCurrentSeriesName(seriesName);
        }
      }
    );

    echartInstance.on("mouseout", () => {
      setCurrentSeriesName(undefined);
    });

    echartInstance.on("globalout", () => {
      setCurrentSeriesName(undefined);
    });
  }, [echartRef]);

  return (
    <div
      ref={legendRef}
      className={cn(
        "flex h-full w-full cursor-pointer gap-2 truncate",
        "md:w-20 md:flex-col md:items-start md:gap-0",
        { "justify-center": items.length <= 15 }
      )}
    >
      <Scrollable>
        <div className="flex items-center md:flex-col">
          {items?.map((item, i) => {
            const { color, disabled, name } = item;
            const formattedName = formatSeriesName(name);

            return (
              <div
                key={`${name}-${i}`}
                className={cn(
                  {
                    "opacity-100":
                      currentSeriesName === name || !currentSeriesName,
                  },
                  {
                    "opacity-50":
                      currentSeriesName !== name && !!currentSeriesName,
                  },

                  { "text-[#505050]": disabled },
                  "cursor flex w-full items-center gap-1 break-normal text-xs opacity-100 transition-opacity"
                )}
                role="button"
                tabIndex={0}
                onMouseEnter={() => {
                  setCurrentSeriesName(name);
                  echartRef.current?.getEchartsInstance().dispatchAction({
                    type: "highlight",
                    seriesName: name,
                  });
                }}
                onMouseLeave={() => {
                  setCurrentSeriesName(undefined);
                  echartRef.current?.getEchartsInstance().dispatchAction({
                    type: "downplay",
                    seriesName: name,
                  });
                }}
                onClick={() => handleToggle(item)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleToggle(item);
                  }
                }}
              >
                {name !== "All" && (
                  <div
                    className="h-[8px] w-[8px] rounded border"
                    style={{
                      borderColor: color,
                      ...(disabled ? {} : { backgroundColor: color }),
                    }}
                  />
                )}
                <div
                  title={formattedName}
                  className="w-full whitespace-nowrap md:truncate"
                >
                  {formattedName}
                </div>
              </div>
            );
          })}
        </div>
      </Scrollable>
    </div>
  );
};
