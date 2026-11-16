import * as echarts from "echarts";
import { describe, expect, it } from "vitest";

import {
  getBinaryAxisScale,
  getEndpointAxisScale,
  createEndpointXAxisOptions,
  createYAxisOptions,
  getLeftAxisMax,
} from "~/components/Charts/ChartBase/helpers/axis";
import { formatBytesValue } from "~/components/Charts/ChartBase/helpers/formatters";

const KIB = 1024;
const MIB = 1024 * KIB;

describe("getEndpointAxisScale", () => {
  it.each([
    [0, 1],
    [184_200, 200_000],
    [350_000, 500_000],
    [18_000_000, 20_000_000],
    [0.018, 0.02],
    [50, 50],
  ])("should show zero and an upper limit for %s", (value, upperLimit) => {
    const scale = getEndpointAxisScale(value);

    expect(scale.min).toBe(0);
    expect(scale.max).toBe(upperLimit);
    expect(scale.max).toBeGreaterThanOrEqual(value);
    expect((scale.max - scale.min) / scale.interval).toBe(1);
  });
});

describe("summary chart labels", () => {
  it.each([1, 2, 30])(
    "should show only the axis end labels for %s days",
    (days) => {
      const chart = echarts.init(null, undefined, {
        renderer: "svg",
        ssr: true,
        width: 600,
        height: 240,
      });
      const dates = Array.from(
        { length: days },
        (_, i) => `2026-11-${String(i + 1).padStart(2, "0")}`
      );

      try {
        chart.setOption({
          animation: false,
          xAxis: createEndpointXAxisOptions({ type: "time" }, days),
          yAxis: createYAxisOptions(
            { type: "count" },
            true,
            getEndpointAxisScale(184_200)
          ),
          series: [{ type: "bar", data: dates.map((date) => [date, 184_200]) }],
        });

        const svg = chart.renderToSVGString();
        const dateLabels = svg.match(/Nov \d\d/g) ?? [];

        expect(dateLabels).toEqual(
          days === 1
            ? ["Nov 01"]
            : ["Nov 01", `Nov ${String(days).padStart(2, "0")}`]
        );
        expect(svg).toContain(">0</text>");
        expect(svg).toContain(">200K</text>");
        expect(svg).not.toContain(">100K</text>");
      } finally {
        chart.dispose();
      }
    }
  );
});

describe("getBinaryAxisScale", () => {
  it("should return a power of 2 interval that gives about 5 ticks", () => {
    // 1.6 MiB ÷ 5 is about 328 KiB, so the interval is 512 KiB, and the max
    // is the next tick.
    expect(getBinaryAxisScale(1.6 * MIB)).toEqual({
      interval: 512 * KIB,
      max: 2 * MIB,
    });
  });

  it("should keep a max that is on a tick", () => {
    expect(getBinaryAxisScale(5 * MIB)).toEqual({
      interval: MIB,
      max: 5 * MIB,
    });
  });

  it("should return undefined when there are no values", () => {
    expect(getBinaryAxisScale(0)).toBeUndefined();
  });
});

describe("getLeftAxisMax", () => {
  const dataset = {
    source: {
      timestamp: ["2026-11-01", "2026-11-02"],
      data: [100, 300],
      unused: [50, 20],
      utilization: [66, 93],
      avg: [400, 400],
    },
  };

  it("should add the series of a stack", () => {
    expect(
      getLeftAxisMax(
        [
          { stack: "usage", encode: { y: "data" } },
          { stack: "usage", encode: { y: "unused" } },
        ],
        dataset
      )
    ).toBe(320);
  });

  it("should use a series that is not stacked by itself", () => {
    expect(
      getLeftAxisMax(
        [{ stack: "usage", encode: { y: "data" } }, { encode: { y: "avg" } }],
        dataset
      )
    ).toBe(400);
  });

  it("should not use the series of the right y-axis", () => {
    expect(
      getLeftAxisMax(
        [
          { encode: { y: "data" } },
          { yAxisIndex: 1, encode: { y: "utilization" } },
        ],
        dataset
      )
    ).toBe(300);
  });
});

describe("formatBytesValue", () => {
  const axis = { type: "count", unitType: "byte", unit: "B" } as const;

  it("should show the best unit when the axis has no display unit", () => {
    expect(formatBytesValue(917_504, axis)).toBe("896 KiB");
    expect(formatBytesValue(1.5 * MIB, axis, true)).toBe("1.5 MiB");
  });

  it("should not show a unit when the axis has a display unit", () => {
    expect(formatBytesValue(2 * MIB, { ...axis, displayUnit: "MiB" })).toBe(
      "2"
    );
  });
});
