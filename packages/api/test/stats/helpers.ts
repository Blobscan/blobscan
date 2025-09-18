import { beforeEach, describe, expect, it } from "vitest";

import type { TimeFrame } from "../../src";
import { TIME_FRAMES } from "../../src/middlewares/withTimeFrame";

export function runTimeFrameTests({
  statsFiller,
  statsFetcher,
}: {
  statsFiller: () => Promise<unknown>;
  statsFetcher: (timeFrame: TimeFrame) => Promise<unknown>;
}) {
  return describe("when getting stats for a specific timeframe", () => {
    beforeEach(async () => {
      await statsFiller();
    });

    TIME_FRAMES.forEach((timeFrame) => {
      it(`should get daily stats for ${timeFrame}`, async () => {
        const result = await statsFetcher(timeFrame);

        expect(result).toMatchSnapshot();
      });
    });
  });
}
