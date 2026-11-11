import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { EChartsOption } from "echarts";
import ReactEChartsCore from "echarts-for-react/lib/core";
import { useTheme } from "next-themes";

import { ContentReveal } from "~/components/ContentReveal";
import { EmptyState } from "~/components/EmptyState";
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
const BOTTOM = 8;
// The color bar is a second chart below the calendar.
const COLOR_BAR_HEIGHT = 64;
const COLOR_BAR_MAX_LENGTH = 240;
// The space for the two labels of the color bar and their gaps.
const COLOR_BAR_LABELS_WIDTH = 130;

/** Returns a callback ref and the width of its element, in pixels. */
function useElementWidth() {
  // A callback ref measures the loading grid and the chart.
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!element) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        setWidth(entry.contentRect.width);
      }
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [element]);

  return [setElement, width] as const;
}

function getCellSize(width: number) {
  return Math.max(
    MIN_CELL_SIZE,
    Math.floor((width - LEFT - RIGHT) / WEEKS_PER_YEAR)
  );
}

// Violet colors from low values to high values. More activity is darker
// in light mode and brighter in dark mode.
const HEAT_COLORS: Record<ThemeMode, string[]> = {
  light: ["#DCCCF7", "#B99AEF", "#8D60DC", "#5D25D4"],
  dark: ["#443565", "#6C4A9E", "#9A71D8", "#C8AEFA"],
};
const EMPTY_COLOR: Record<ThemeMode, string> = {
  light: "#EDECF2",
  dark: "#2B2B42",
};
const CELL_BORDER_COLOR: Record<ThemeMode, string> = {
  light: "#FFFFFF",
  dark: "#1C1A37",
};
const HIGHLIGHT_COLOR: Record<ThemeMode, string> = {
  light: "#CA8A04",
  dark: "#FCD34D",
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
  /** An outer outline marks the group of highlighted cells. */
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
  emptyMessage?: string;
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
  // The cell size follows the width of the calendar, so the cells stay
  // square. The length of the color bar follows the visible width.
  const [setContainer, width] = useElementWidth();
  const [setColorBarContainer, colorBarWidth] = useElementWidth();
  const calendarRef = useRef<ReactEChartsCore>(null);
  // The range that the user selects on the color bar. A new option (a new
  // width, theme or data) keeps it. It is a ref, so a drag does not render
  // the charts again.
  const selectedRangeRef = useRef<[number, number]>();
  // The color bar is not in the calendar chart, because the calendar scrolls
  // on a narrow screen and the color bar must stay in view. Thus the
  // selection of the color bar is sent to the calendar chart.
  const colorBarEvents = useMemo(
    () => ({
      datarangeselected: ({ selected }: { selected: [number, number] }) => {
        selectedRangeRef.current = selected;
        calendarRef.current
          ?.getEchartsInstance()
          .dispatchAction({ type: "selectDataRange", selected });
      },
    }),
    []
  );

  const cellSize = getCellSize(width);
  const colorBarLength = Math.max(
    0,
    Math.min(COLOR_BAR_MAX_LENGTH, colorBarWidth - COLOR_BAR_LABELS_WIDTH)
  );
  const calendarHeight = cellSize * 7;
  const [startDate, endDate] = range;

  const height = TOP + calendarHeight + BOTTOM;
  const skeletonCells = useMemo(() => {
    const dayMs = 24 * 60 * 60 * 1000;
    const startTime = Date.parse(startDate);
    const firstRow = (new Date(startTime).getUTCDay() + 6) % 7;
    const dayCount = Math.floor((Date.parse(endDate) - startTime) / dayMs) + 1;

    return Array.from({ length: dayCount }, (_, day) => {
      const offset = firstRow + day;

      return {
        x: LEFT + Math.floor(offset / 7) * cellSize + 1,
        y: TOP + (offset % 7) * cellSize + 1,
      };
    });
  }, [startDate, endDate, cellSize]);

  const { option, colorBarOption, hasHighlightInRange } = useMemo(() => {
    if (!data?.length) {
      return {
        option: undefined,
        colorBarOption: undefined,
        hasHighlightInRange: false,
      };
    }

    const items = data.filter(
      (item) => item.date >= startDate && item.date <= endDate
    );
    const byDate = new Map(items.map((item) => [item.date, item]));
    // Use grid positions to remove edges between highlighted cells.
    const dayMs = 24 * 60 * 60 * 1000;
    const startTime = Date.parse(startDate);
    const firstRow = (new Date(startTime).getUTCDay() + 6) % 7;
    const highlightedCells = items
      .filter((item) => item.highlighted)
      .map((item) => {
        const offset = (Date.parse(item.date) - startTime) / dayMs + firstRow;
        return { column: Math.floor(offset / 7), row: offset % 7 };
      });
    const highlightedPositions = new Set(
      highlightedCells.map(({ column, row }) => `${column},${row}`)
    );
    const outline = highlightedCells.flatMap(({ column, row }) => {
      const x = LEFT + column * cellSize;
      const y = TOP + row * cellSize;
      const edges = [
        { column: column - 1, row, x1: x, y1: y, x2: x, y2: y + cellSize },
        {
          column: column + 1,
          row,
          x1: x + cellSize,
          y1: y,
          x2: x + cellSize,
          y2: y + cellSize,
        },
        { column, row: row - 1, x1: x, y1: y, x2: x + cellSize, y2: y },
        {
          column,
          row: row + 1,
          x1: x,
          y1: y + cellSize,
          x2: x + cellSize,
          y2: y + cellSize,
        },
      ];

      return edges
        .filter(
          (edge) => !highlightedPositions.has(`${edge.column},${edge.row}`)
        )
        .map(({ x1, y1, x2, y2 }) => ({
          type: "line" as const,
          silent: true,
          z: 10,
          shape: { x1, y1, x2, y2 },
          style: {
            stroke: HIGHLIGHT_COLOR[theme],
            lineWidth: 2,
            lineCap: "square" as const,
          },
        }));
    });
    const maxValue = Math.max(0, ...items.map((item) => item.value));
    const visualMapMax = Math.max(maxValue, 2);
    const selectedRange = selectedRangeRef.current;
    // The two charts have the same value range and colors.
    const visualMap = {
      type: "continuous" as const,
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
      inRange: { color: HEAT_COLORS[theme] },
      outOfRange: { color: EMPTY_COLOR[theme] },
    };

    const option: EChartsOption = {
      animation: false,
      graphic: outline,
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
      // The color bar chart shows the bar. This one only sets the colors.
      visualMap: { ...visualMap, show: false },
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
        // A hover on a cell outlines it.
        emphasis: {
          itemStyle: { borderColor: LABEL_COLOR[theme], borderWidth: 2 },
        },
        data: items.map((item) => ({
          value: [item.date, item.value],
        })),
      },
    };

    // A color bar from 1 to the highest value. Its handles select a range
    // of values, and the other cells show as empty.
    const colorBarOption: EChartsOption = {
      animation: false,
      visualMap: {
        ...visualMap,
        calculable: true,
        precision: 0,
        orient: "horizontal",
        left: "center",
        bottom: 8,
        itemWidth: 14,
        itemHeight: colorBarLength,
        text: [formatValue(Math.max(maxValue, 1)), formatValue(1)],
        textGap: 12,
        textStyle: { color: LABEL_COLOR[theme], fontSize: 11 },
      },
    };

    return {
      option,
      colorBarOption,
      hasHighlightInRange: items.some((item) => item.highlighted),
    };
  }, [
    data,
    startDate,
    endDate,
    theme,
    cellSize,
    colorBarLength,
    formatValue,
    formatTooltip,
  ]);

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
      <ContentReveal isLoading={isLoading} className="flex flex-col gap-2">
        {/* The calendar is wider than a narrow screen. It scrolls. */}
        <div className="overflow-x-auto">
          <div ref={setContainer} className="min-w-[640px]">
            {isLoading ? (
              <div
                role="status"
                aria-label="Loading daily activity"
                className="animate-pulse"
              >
                <svg width="100%" height={height} aria-hidden="true">
                  {skeletonCells.map(({ x, y }, day) => (
                    <rect
                      key={day}
                      x={x}
                      y={y}
                      width={cellSize - 2}
                      height={cellSize - 2}
                      fill={theme === "dark" ? "#434672" : "#EADEFD"}
                    />
                  ))}
                </svg>
              </div>
            ) : option ? (
              width > 0 && (
                <ReactEChartsCore
                  ref={calendarRef}
                  echarts={echarts}
                  option={option}
                  notMerge
                  style={{ height, width: "100%" }}
                />
              )
            ) : (
              <div className="h-48">
                <EmptyState
                  size="md"
                  description={emptyMessage ?? "No Chart Data"}
                />
              </div>
            )}
          </div>
        </div>
        {/* The color bar is out of the scroll area, so it stays in view. */}
        <div ref={setColorBarContainer}>
          {isLoading ? (
            <div
              className="relative animate-pulse"
              style={{ height: COLOR_BAR_HEIGHT }}
              aria-hidden="true"
            >
              <div
                className="absolute bottom-2 left-1/2 h-3.5 -translate-x-1/2 rounded-sm bg-[#EADEFD] dark:bg-[#434672]"
                style={{ width: colorBarLength }}
              />
            </div>
          ) : colorBarOption && colorBarLength > 0 ? (
            <ReactEChartsCore
              echarts={echarts}
              option={colorBarOption}
              notMerge
              onEvents={colorBarEvents}
              style={{ height: COLOR_BAR_HEIGHT, width: "100%" }}
            />
          ) : null}
        </div>
      </ContentReveal>
    </div>
  );
}
