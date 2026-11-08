import { describe, expect, it } from "vitest";

import {
  getBinaryAxisScale,
  getLeftAxisMax,
} from "~/components/Charts/ChartBase/helpers/axis";
import { formatBytesValue } from "~/components/Charts/ChartBase/helpers/formatters";

const KIB = 1024;
const MIB = 1024 * KIB;

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
