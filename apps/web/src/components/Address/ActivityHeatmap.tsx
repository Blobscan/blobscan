import type { FC } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { EChartsOption } from "echarts";
import ReactEChartsCore from "echarts-for-react/lib/core";
import { useTheme } from "next-themes";

import dayjs from "@blobscan/dayjs";

import { HelpIcon } from "~/components/HelpIcon";
import echarts from "~/echarts";
import type { ThemeMode } from "~/types";
import { formatNumber } from "~/utils";
import type { AddressTimeseries } from "./helpers";

// The calendar shows the last 365 days in one row of weeks. 365 days are
// never more than 53 week columns. The cells are squares, and the cell size
// comes from the width of the chart. These sizes are in pixels.
const DAYS_SHOWN = 365;
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
// tooling/tailwind/colors.ts), from few txs to many txs.
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
const STREAK_COLOR: Record<ThemeMode, string> = {
  light: "#EA580C",
  dark: "#FB923C",
};
const LABEL_COLOR: Record<ThemeMode, string> = {
  light: "#737373",
  dark: "#A3A3A3",
};

type Day = { date: string; sent: number; received: number; total: number };

/** Returns the days with txs, with the date as YYYY-MM-DD. */
function getActiveDays(data: AddressTimeseries): Day[] {
  return data.timestamps.flatMap((timestamp, i) => {
    const sent = data.sent.totalTransactions[i] ?? 0;
    const received = data.received.totalTransactions[i] ?? 0;

    return sent || received
      ? [
          {
            date: dayjs.utc(timestamp).format("YYYY-MM-DD"),
            sent,
            received,
            total: sent + received,
          },
        ]
      : [];
  });
}

/**
 * Returns the dates of the longest run of consecutive active days. When two
 * runs have the same length, it returns the most recent one.
 */
function getLongestStreakDates(days: Day[]): Set<string> {
  let best: string[] = [];
  let run: string[] = [];

  days.forEach((day, i) => {
    const prev = days[i - 1];
    const isNextDay =
      !!prev && dayjs.utc(day.date).diff(dayjs.utc(prev.date), "day") === 1;

    run = isNextDay ? [...run, day.date] : [day.date];

    if (run.length >= best.length) {
      best = run;
    }
  });

  return new Set(best);
}

export type ActivityHeatmapProps = {
  /**
   * The daily timeseries of all the time. The calendar shows only the last
   * 365 days, but the longest streak comes from all the days.
   */
  data?: AddressTimeseries;
  isLoading?: boolean;
};

/**
 * A calendar with one cell for each day of the last 365 days. The color of a
 * cell is the number of blob txs of the day, and an outline marks the days of
 * the longest streak in that range.
 */
export const ActivityHeatmap: FC<ActivityHeatmapProps> = function ({
  data,
  isLoading,
}) {
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

  const { option, height, hasStreakInRange } = useMemo(() => {
    const allDays = data ? getActiveDays(data) : [];

    if (!allDays.length) {
      return { option: undefined, height: 0, hasStreakInRange: false };
    }

    const end = dayjs.utc().startOf("day");
    const start = end.subtract(DAYS_SHOWN - 1, "day");
    const startDate = start.format("YYYY-MM-DD");
    const endDate = end.format("YYYY-MM-DD");
    const days = allDays.filter(
      (day) => day.date >= startDate && day.date <= endDate
    );
    const streak = getLongestStreakDates(allDays);
    const byDate = new Map(days.map((day) => [day.date, day]));
    const maxTxs = Math.max(0, ...days.map((day) => day.total));
    const visualMapMax = Math.max(maxTxs, 2);
    const selectedRange = selectedRangeRef.current;

    const option: EChartsOption = {
      animation: false,
      tooltip: {
        confine: true,
        backgroundColor: theme === "dark" ? "#2E2854" : "#FAFAFA",
        borderColor: theme === "dark" ? "#372779" : "#5D25D4",
        textStyle: {
          color: theme === "dark" ? "#FFFFFF" : "#171717",
          fontSize: 12,
        },
        formatter: (params) => {
          const [date] = (params as unknown as { value: [string, number] })
            .value;
          const day = byDate.get(date);
          const label = dayjs.utc(date).format("ddd, MMM D, YYYY");

          if (!day) {
            return `<b>${label}</b><br/>No blob txs`;
          }

          const parts = [
            day.sent ? `${formatNumber(day.sent)} sent` : "",
            day.received ? `${formatNumber(day.received)} received` : "",
          ].filter(Boolean);

          return `<b>${label}</b><br/>${formatNumber(day.total)} blob ${
            day.total === 1 ? "tx" : "txs"
          } (${parts.join(", ")})${
            streak.has(date) ? "<br/>In the longest streak" : ""
          }`;
        },
      },
      // A color bar from 1 tx to the busiest day. Its handles select a
      // range of values, and the other cells show as empty.
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
        text: [`${formatNumber(Math.max(maxTxs, 1))} txs`, "1 tx"],
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
        data: days.map((day) => ({
          value: [day.date, day.total],
          ...(streak.has(day.date)
            ? {
                itemStyle: {
                  borderColor: STREAK_COLOR[theme],
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
      // The longest streak can be older than the range.
      hasStreakInRange: days.some((day) => streak.has(day.date)),
    };
  }, [data, theme, cellSize, calendarHeight]);

  if (isLoading) {
    return (
      <div className="h-48 animate-pulse rounded-md bg-primary-100 dark:bg-primary-900/40" />
    );
  }

  if (!option) {
    return (
      <p className="py-12 text-center text-sm text-contentSecondary-light dark:text-contentSecondary-dark">
        This address has no blob transactions.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 font-semibold">
          Daily Blob Txs
          <HelpIcon description="Blob transactions in each UTC day of the last 365 days, sent or received. A darker cell has more transactions, and an outline marks the longest streak. Drag the handles of the color bar to show only some values." />
        </span>
        {hasStreakInRange && (
          <span className="flex items-center gap-2 text-xs text-contentSecondary-light dark:text-contentSecondary-dark">
            <span
              className="inline-block h-3 w-3 rounded-sm border-2"
              style={{ borderColor: STREAK_COLOR[theme] }}
            />
            Longest streak
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
};
