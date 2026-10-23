import { describe, expect, it } from "vitest";

import {
  addCurrentPeriodColumns,
  createCurrentPeriodSeries,
  CURRENT_PERIOD_SERIES_ID_SUFFIX,
  getCurrentPeriodTimestamp,
  getMainSeriesIndex,
  getMetricColumn,
  getSeriesMetricValue,
  isCurrentPeriodSeries,
} from "~/components/Charts/ChartBase/helpers/currentPeriod";

const timestamps = [
  new Date("2024-03-18T00:00:00Z"),
  new Date("2024-03-19T00:00:00Z"),
  new Date("2024-03-20T00:00:00Z"),
];
const currentPeriodTimestamp = timestamps[2] as Date;
const dataset = {
  id: "global",
  source: { timestamp: timestamps, totalBlobs: [10, 20, 3] },
};

describe("addCurrentPeriodColumns", () => {
  it("should add the closed, current and tail columns of each metric", () => {
    expect(addCurrentPeriodColumns(dataset, currentPeriodTimestamp)).toEqual({
      id: "global",
      source: {
        timestamp: timestamps,
        totalBlobs: [10, 20, 3],
        totalBlobs__closed: [10, 20, null],
        "totalBlobs__closed-bar": [10, 20, 0],
        totalBlobs__current: [null, null, 3],
        totalBlobs__tail: [null, 20, 3],
      },
    });
  });

  it("should not change a dataset without the current period", () => {
    const otherTimestamp = new Date("2024-03-21T00:00:00Z");

    expect(addCurrentPeriodColumns(dataset, otherTimestamp)).toEqual(dataset);
  });
});

describe("getCurrentPeriodTimestamp", () => {
  it("should return the current period timestamp of a dataset that includes it", () => {
    expect(
      getCurrentPeriodTimestamp([{ ...dataset, currentPeriodTimestamp }])
    ).toBe(currentPeriodTimestamp);
  });

  it("should return undefined when no dataset includes the timestamp", () => {
    expect(
      getCurrentPeriodTimestamp([
        {
          ...dataset,
          currentPeriodTimestamp: new Date("2024-03-21T00:00:00Z"),
        },
      ])
    ).toBeUndefined();
    expect(getCurrentPeriodTimestamp([dataset])).toBeUndefined();
  });
});

describe("addCurrentPeriodColumns (current period field)", () => {
  it("should not give the current period field to the chart", () => {
    expect(
      addCurrentPeriodColumns(
        { ...dataset, currentPeriodTimestamp },
        currentPeriodTimestamp
      )
    ).not.toHaveProperty("currentPeriodTimestamp");
  });
});

describe("getSeriesMetricValue", () => {
  it("should read the value from the metric column of the drawn column", () => {
    const datasets = [addCurrentPeriodColumns(dataset, currentPeriodTimestamp)];

    expect(
      getSeriesMetricValue(
        { encode: { x: "timestamp", y: "totalBlobs__closed" } },
        datasets,
        2
      )
    ).toBe(3);
  });
});

describe("getMetricColumn", () => {
  it("should return the metric column of an added column", () => {
    expect(getMetricColumn("totalBlobs__closed")).toBe("totalBlobs");
    expect(getMetricColumn("totalBlobs__closed-bar")).toBe("totalBlobs");
    expect(getMetricColumn("totalBlobs__current")).toBe("totalBlobs");
    expect(getMetricColumn("totalBlobs")).toBe("totalBlobs");
  });
});

describe("createCurrentPeriodSeries", () => {
  const options = { seriesIdx: 0 };

  it("should stop a line at the last closed period and add a dotted segment and a static hollow point", () => {
    const [line, segment, point] = createCurrentPeriodSeries(
      {
        id: "rollup-base",
        name: "Base",
        type: "line",
        encode: { x: "timestamp", y: "totalBlobs" },
        itemStyle: { color: "#0052ff" },
      },
      options
    );

    expect(line?.encode).toEqual({ x: "timestamp", y: "totalBlobs__closed" });
    expect(segment).toMatchObject({
      name: "Base",
      type: "line",
      encode: { y: "totalBlobs__tail" },
      lineStyle: { type: "dotted", color: "#0052ff" },
    });
    expect(point).toMatchObject({
      name: "Base",
      type: "scatter",
      encode: { y: "totalBlobs__current" },
      symbol: "emptyCircle",
      itemStyle: { borderColor: "#0052ff" },
    });
    expect(isCurrentPeriodSeries(segment?.id)).toBe(true);
    expect(isCurrentPeriodSeries(point?.id)).toBe(true);
    expect(isCurrentPeriodSeries(line?.id)).toBe(false);
  });

  it("should put the current bar in the stack of its series", () => {
    const [bar, currentBar] = createCurrentPeriodSeries(
      {
        id: "rollup-base",
        type: "bar",
        stack: "total",
        encode: { x: "timestamp", y: "totalBlobs" },
      },
      options
    );

    expect(bar).toMatchObject({
      stack: "total",
      encode: { y: "totalBlobs__closed-bar" },
    });
    expect(currentBar).toMatchObject({
      id: `rollup-base-bar${CURRENT_PERIOD_SERIES_ID_SUFFIX}`,
      type: "bar",
      stack: "total",
      encode: { y: "totalBlobs__current" },
      itemStyle: { opacity: 0.5, borderType: "dashed" },
    });
  });

  it("should give an unstacked bar and its current bar the same stack", () => {
    const [bar, currentBar] = createCurrentPeriodSeries(
      { type: "bar", encode: { x: "timestamp", y: "totalBlobs" } },
      options
    );

    expect(bar?.stack).toBeDefined();
    expect(currentBar?.stack).toBe(bar?.stack);
  });
});

describe("current period series", () => {
  it("should have no animation options of their own", () => {
    const currentPeriodSeries = [
      ...createCurrentPeriodSeries(
        { type: "line", encode: { x: "timestamp", y: "totalBlobs" } },
        { seriesIdx: 0 }
      ),
      ...createCurrentPeriodSeries(
        { type: "bar", encode: { x: "timestamp", y: "totalBlobs" } },
        { seriesIdx: 1 }
      ),
    ].filter((s) => isCurrentPeriodSeries(s.id));

    for (const s of currentPeriodSeries) {
      expect(
        Object.keys(s).filter((key) => key.startsWith("animation"))
      ).toEqual([]);
    }
  });
});

describe("current period hover", () => {
  const series = {
    id: "rollup-base",
    name: "Base",
    type: "bar",
    stack: "total",
    encode: { x: "timestamp", y: "totalBlobs" },
    emphasis: { focus: "series" },
  };

  it("should give the current period series the hover style of their series", () => {
    const [, currentBar] = createCurrentPeriodSeries(series, { seriesIdx: 0 });

    expect(currentBar?.emphasis).toEqual({ focus: "series" });
    expect(currentBar?.silent).toBeUndefined();
  });

  it("should map a current period series to the index of its series", () => {
    const other = { ...series, id: "rollup-arbitrum", name: "Arbitrum" };
    const [baseBar, baseCurrentBar] = createCurrentPeriodSeries(series, {
      seriesIdx: 0,
    });
    const [otherBar, otherCurrentBar] = createCurrentPeriodSeries(other, {
      seriesIdx: 1,
    });
    // The order of ChartBase: all the series, then the current period series
    const chartSeries = [
      baseBar,
      otherBar,
      baseCurrentBar,
      otherCurrentBar,
    ].filter((s) => s !== undefined);

    expect(getMainSeriesIndex(chartSeries, 2)).toBe(0);
    expect(getMainSeriesIndex(chartSeries, 3)).toBe(1);
    expect(getMainSeriesIndex(chartSeries, 1)).toBe(1);
    expect(getMainSeriesIndex(chartSeries, undefined)).toBeUndefined();
  });
});
