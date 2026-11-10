import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { EChartsOption } from "echarts";
import ReactEChartsCore from "echarts-for-react/lib/core";
import { useTheme } from "next-themes";

import { HelpIcon } from "~/components/HelpIcon";
import echarts from "~/echarts";
import type { ThemeMode } from "~/types";

// The calendar shows the range in one row of weeks. A range of one year is
// never more than 53 week columns. The cells are squares, and the cell size
// comes from the width of the chart. These sizes are in pixels.
const WEEKS_PER_YEAR = 53;
const MIN_CELL_SIZE = 10;
const LEFT = 40;
const RIGHT = 16;
const TOP = 48;
const VISUAL_MAP_HEIGHT = 88;

function getCellSize(width: number) {
  return Math.max(
    MIN_CELL_SIZE,
    Math.floor((width - LEFT - RIGHT) / WEEKS_PER_YEAR)
  );
}

// The primary color ramp of the app (`baseColors` in
// tooling/tailwind/colors.ts), from low values to high values.
const HEAT_COLORS: Record<ThemeMode, string[]> = {
  light: ["#D4BFFB", "#AE8CF6", "#7F4DE6", "#5D25D4"],
  dark: ["#4C2BA0", "#7A4BE8", "#A98AF5", "#D9C9FC"],
};
const EMPTY_COLOR: Record<ThemeMode, string> = {
  light: "#F5F5F5",
  dark: "#2A2650",
};
const CELL_BORDER_COLOR: Record<ThemeMode, string> = {
  light: "#FFFFFF",
  dark: "#1C1A37",
};
const HIGHLIGHT_COLOR: Record<ThemeMode, string> = {
  light: "#EA580C",
  dark: "#FB923C",
};
const LABEL_COLOR: Record<ThemeMode, string> = {
  light: "#737373",
  dark: "#A3A3A3",
};

export type CalendarHeatmapItem = {
  /** The day, as YYYY-MM-DD. */
  date: string;
  /** The value that sets the color of the cell. */
  value: number;
  /** An outline marks the cell when it is true. */
  highlighted?: boolean;
};

export type CalendarHeatmapProps<T extends CalendarHeatmapItem> = {
  title: ReactNode;
  /** A text that tells what the chart shows. An icon after the title shows it. */
  description?: ReactNode;
  /** The days with a value. Days out of `range` are not shown. */
  data?: T[];
  /** The first and the last day that the calendar shows, as YYYY-MM-DD. */
  range: [string, string];
  /**
   * The text of the highlighted cells in the legend. The legend shows only
   * when a highlighted cell is in the range.
   */
  highlightLabel?: string;
  /** Returns the labels of the color bar ends, for example "1 tx". */
  formatValue?: (value: number) => string;
  /** Returns the tooltip HTML of a day. `item` is not set for an empty day. */
  formatTooltip?: (date: string, item?: T) => string;
  /** The text that shows when `data` is empty. */
  emptyMessage?: ReactNode;
  isLoading?: boolean;
};

/**
 * A calendar with one cell for each day of a range. The color of a cell is
 * the value of the day. The user can drag the handles of the color bar to
 * show only some values.
 */
export function CalendarHeatmap<T extends CalendarHeatmapItem>({
  title,
  description,
  data,
  range,
  highlightLabel,
  formatValue = String,
  formatTooltip,
  emptyMessage,
  isLoading,
}: CalendarHeatmapProps<T>) {
  const { resolvedTheme } = useTheme();
  const theme = (resolvedTheme ?? "light") as ThemeMode;
  // A callback ref: the container shows only after the data loads.
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  // The range that the user selects on the color bar. A new option (a new
  // width, theme or data) keeps it. It is a ref, so a drag does not render
  // the chart again.
  const selectedRangeRef = useRef<[number, number]>();
  const onEvents = useMemo(
    () => ({
      datarangeselected: ({ selected }: { selected: [number, number] }) => {
        selectedRangeRef.current = selected;
      },
    }),
    []
  );

  // The cell size follows the width, so the cells stay square.
  useEffect(() => {
    if (!container) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        setWidth(entry.contentRect.width);
      }
    });

    observer.observe(container);

    return () => observer.disconnect();
  }, [container]);

  const cellSize = getCellSize(width);
  const calendarHeight = cellSize * 7;
  const [startDate, endDate] = range;

  const { option, height, hasHighlightInRange } = useMemo(() => {
    if (!data?.length) {
      return { option: undefined, height: 0, hasHighlightInRange: false };
    }

    const items = data.filter(
      (item) => item.date >= startDate && item.date <= endDate
    );
    const byDate = new Map(items.map((item) => [item.date, item]));
    const maxValue = Math.max(0, ...items.map((item) => item.value));
    const visualMapMax = Math.max(maxValue, 2);
    const selectedRange = selectedRangeRef.current;

    const option: EChartsOption = {
      animation: false,
      tooltip: {
        confine: true,
        show: !!formatTooltip,
        backgroundColor: theme === "dark" ? "#2E2854" : "#FAFAFA",
        borderColor: theme === "dark" ? "#372779" : "#5D25D4",
        textStyle: {
          color: theme === "dark" ? "#FFFFFF" : "#171717",
          fontSize: 12,
        },
        formatter: (params) => {
          const [date] = (params as unknown as { value: [string, number] })
            .value;

          return formatTooltip?.(date, byDate.get(date)) ?? "";
        },
      },
      // A color bar from 1 to the highest value. Its handles select a range
      // of values, and the other cells show as empty.
      visualMap: {
        type: "continuous",
        min: 1,
        max: visualMapMax,
        ...(selectedRange
          ? {
              range: [
                Math.max(1, Math.min(selectedRange[0], visualMapMax)),
                Math.max(1, Math.min(selectedRange[1], visualMapMax)),
              ],
            }
          : {}),
        calculable: true,
        precision: 0,
        orient: "horizontal",
        left: "center",
        bottom: 16,
        itemWidth: 14,
        itemHeight: 240,
        text: [formatValue(Math.max(maxValue, 1)), formatValue(1)],
        textGap: 12,
        textStyle: { color: LABEL_COLOR[theme], fontSize: 11 },
        inRange: { color: HEAT_COLORS[theme] },
        outOfRange: { color: EMPTY_COLOR[theme] },
      },
      calendar: {
        top: TOP,
        left: LEFT,
        cellSize,
        range: [startDate, endDate],
        splitLine: { show: false },
        itemStyle: {
          color: EMPTY_COLOR[theme],
          borderColor: CELL_BORDER_COLOR[theme],
          borderWidth: 2,
        },
        yearLabel: { show: false },
        monthLabel: { color: LABEL_COLOR[theme], fontSize: 11 },
        dayLabel: {
          firstDay: 1,
          nameMap: ["", "Mon", "", "Wed", "", "Fri", ""],
          color: LABEL_COLOR[theme],
          fontSize: 11,
        },
      },
      series: {
        type: "heatmap",
        coordinateSystem: "calendar",
        // A hover on the color bar outlines the cells with that value.
        emphasis: {
          itemStyle: { borderColor: LABEL_COLOR[theme], borderWidth: 2 },
        },
        data: items.map((item) => ({
          value: [item.date, item.value],
          ...(item.highlighted
            ? {
                itemStyle: {
                  borderColor: HIGHLIGHT_COLOR[theme],
                  borderWidth: 2,
                },
              }
            : {}),
        })),
      },
    };

    return {
      option,
      height: TOP + calendarHeight + VISUAL_MAP_HEIGHT + 24,
      hasHighlightInRange: items.some((item) => item.highlighted),
    };
  }, [
    data,
    startDate,
    endDate,
    theme,
    cellSize,
    calendarHeight,
    formatValue,
    formatTooltip,
  ]);

  if (isLoading) {
    return (
      <div className="h-48 animate-pulse rounded-md bg-primary-100 dark:bg-primary-900/40" />
    );
  }

  if (!option) {
    return (
      <p className="py-12 text-center text-sm text-contentSecondary-light dark:text-contentSecondary-dark">
        {emptyMessage ?? "No data."}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 font-semibold">
          {title}
          {description && <HelpIcon description={description} />}
        </span>
        {highlightLabel && hasHighlightInRange && (
          <span className="flex items-center gap-2 text-xs text-contentSecondary-light dark:text-contentSecondary-dark">
            <span
              className="inline-block h-3 w-3 rounded-sm border-2"
              style={{ borderColor: HIGHLIGHT_COLOR[theme] }}
            />
            {highlightLabel}
          </span>
        )}
      </div>
      {/* The calendar is wider than a narrow screen. It scrolls. */}
      <div className="overflow-x-auto">
        <div ref={setContainer} className="min-w-[640px]">
          {width > 0 && (
            <ReactEChartsCore
              echarts={echarts}
              option={option}
              notMerge
              onEvents={onEvents}
              style={{ height, width: "100%" }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
