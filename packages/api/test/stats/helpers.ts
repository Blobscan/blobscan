import { beforeEach, describe, expect, it } from "vitest";

import type { TimeFrame } from "@blobscan/zod";
import { timeFrameSchema } from "@blobscan/zod";

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

    timeFrameSchema.options.forEach((timeFrame) => {
      it(`should get the stats for ${timeFrame}`, async () => {
        const result = await statsFetcher(timeFrame);

        expect(result).toMatchSnapshot();
      });
    });
  });
}
