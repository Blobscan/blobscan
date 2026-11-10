import type { DefaultLabelFormatterCallbackParams } from "echarts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createBaseTooltipOptions } from "~/components/Charts/ChartBase/helpers/tooltip";
import type { Axes } from "~/components/Charts/ChartBase/types";

type Formatter = (
  params:
    | DefaultLabelFormatterCallbackParams
    | DefaultLabelFormatterCallbackParams[]
) => string;

const CURRENT_PERIOD = new Date("2026-11-03T00:00:00.000Z");
const CLOSED_PERIOD = new Date("2026-11-02T00:00:00.000Z");

const axes: Axes = {
  x: { type: "time" },
  y: { type: "count" },
};

function getFormatter(updatedAt?: Date) {
  const { formatter } = createBaseTooltipOptions({
    currentSeriesRef: { current: null },
    axes,
    themeMode: "light",
    currentPeriod: { timestamp: CURRENT_PERIOD, updatedAt },
  });

  return formatter as Formatter;
}

function axisParam(period: Date) {
  return {
    axisValue: period.getTime(),
    name: period.toISOString(),
    seriesId: "totalBlobs",
    seriesName: "totalBlobs",
    value: 10,
  } as unknown as DefaultLabelFormatterCallbackParams;
}

function itemParam(period: Date) {
  return {
    name: period.toISOString(),
    seriesId: "totalBlobs",
    seriesName: "totalBlobs",
    value: 10,
  } as unknown as DefaultLabelFormatterCallbackParams;
}

describe("tooltip formatter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-03T12:05:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows Live and the update time on the current period", () => {
    const html = getFormatter(new Date("2026-11-03T12:00:00.000Z"))([
      axisParam(CURRENT_PERIOD),
    ]);

    expect(html).toContain("Live");
    expect(html).toContain("Updated 5 minutes ago");
  });

  it("gets the update time again on each hover", () => {
    const formatter = getFormatter(new Date("2026-11-03T12:00:00.000Z"));

    formatter([axisParam(CURRENT_PERIOD)]);
    vi.setSystemTime(new Date("2026-11-03T12:10:00.000Z"));

    expect(formatter([axisParam(CURRENT_PERIOD)])).toContain(
      "Updated 10 minutes ago"
    );
  });

  it("shows Live and no update time when there is no update time", () => {
    const html = getFormatter()([axisParam(CURRENT_PERIOD)]);

    expect(html).toContain("Live");
    expect(html).not.toContain("Updated");
  });

  it("shows Live on the current period in an item tooltip", () => {
    const html = getFormatter(new Date("2026-11-03T12:00:00.000Z"))(
      itemParam(CURRENT_PERIOD)
    );

    expect(html).toContain("Live");
    expect(html).toContain("Updated 5 minutes ago");
  });

  it("does not show Live or the update time on a closed period", () => {
    const formatter = getFormatter(new Date("2026-11-03T12:00:00.000Z"));

    for (const html of [
      formatter([axisParam(CLOSED_PERIOD)]),
      formatter(itemParam(CLOSED_PERIOD)),
    ]) {
      expect(html).not.toContain("Live");
      expect(html).not.toContain("Updated");
      expect(html).not.toContain("justify-content: space-between; align-items");
    }
  });
});

describe("tooltip total", () => {
  const STACKS = ["Blobs", "Blobs", undefined];

  function getTotalFormatter(
    opts: Pick<
      Parameters<typeof createBaseTooltipOptions>[0],
      "totalStack" | "totalLabel"
    > = {}
  ) {
    const { formatter } = createBaseTooltipOptions({
      currentSeriesRef: { current: null },
      axes,
      themeMode: "light",
      displayTotal: true,
      getSeriesStack: (seriesIndex) => STACKS[seriesIndex],
      ...opts,
    });

    return formatter as Formatter;
  }

  function seriesParam(seriesIndex: number, seriesName: string, value: number) {
    return {
      name: CLOSED_PERIOD.toISOString(),
      seriesId: seriesName,
      seriesIndex,
      seriesName,
      value,
    } as unknown as DefaultLabelFormatterCallbackParams;
  }

  const params = [
    seriesParam(0, "Blobs Received", 7),
    seriesParam(1, "Blobs Sent", 10),
    seriesParam(2, "Avg. Daily Blobs", 8),
  ];

  // The total is the last value of the tooltip.
  function getTotal(html: string) {
    return html
      .slice(html.lastIndexOf("<hr"))
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  it("should add all the series when there is no total stack", () => {
    expect(getTotal(getTotalFormatter()(params))).toBe("Total 25");
  });

  it("should add only the series of the total stack", () => {
    expect(
      getTotal(
        getTotalFormatter({ totalStack: "Blobs", totalLabel: "Total Blobs" })(
          params
        )
      )
    ).toBe("Total Blobs 17");
  });
});
