import { describe, expect, it } from "vitest";

import dayjs from "@blobscan/dayjs";
import { Category, Rollup } from "@blobscan/db/prisma/enums";

import { getRecommendedDaysInterval } from "../../src/middlewares/withStatFilters";

describe("getRecommendedDaysInterval", () => {
  const from = dayjs.utc("2024-01-01");

  function getInterval(
    days: number,
    dimensions: {
      categories?: Category[] | "all";
      rollups?: Rollup[] | "all";
    } = {}
  ) {
    return getRecommendedDaysInterval(
      {
        from,
        to: from.add(days, "day"),
      },
      {
        ...dimensions,
        metrics: ["totalBlobs"],
      }
    );
  }

  it("counts one global series when no dimensions are requested", () => {
    expect(getInterval(15_000)).toBe(3);
  });

  it("counts requested categories without requiring rollups", () => {
    expect(
      getInterval(7_500, {
        categories: [Category.OTHER, Category.ROLLUP],
      })
    ).toBe(3);
  });

  it("counts requested rollups without requiring categories", () => {
    expect(
      getInterval(3_750, {
        rollups: [Rollup.ARBITRUM, Rollup.BASE, Rollup.BLAST, Rollup.OPTIMISM],
      })
    ).toBe(3);
  });

  it("adds category and rollup counts instead of multiplying them", () => {
    expect(
      getInterval(2_500, {
        categories: [Category.OTHER, Category.ROLLUP],
        rollups: [Rollup.ARBITRUM, Rollup.BASE, Rollup.OPTIMISM],
      })
    ).toBe(1);
  });

  it("counts every category when all categories are requested", () => {
    expect(getInterval(7_500, { categories: "all" })).toBe(3);
  });
});
