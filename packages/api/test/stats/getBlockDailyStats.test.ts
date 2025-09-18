import { beforeAll, describe } from "vitest";

import dayjs from "@blobscan/dayjs";
import { fixtures } from "@blobscan/test";

import type { TRPCContext } from "../../src";
import { createTestContext } from "../helpers";
import { createStatsCaller } from "./caller";
import type { StatsCaller } from "./caller";
import { runTimeFrameTests } from "./helpers";

describe("getBlockDailyStats", () => {
  let caller: StatsCaller;
  let ctx: TRPCContext;
  const to = dayjs(fixtures.systemDate).endOf("day").toISOString();

  beforeAll(async () => {
    ctx = await createTestContext();

    caller = createStatsCaller(ctx);
  });

  runTimeFrameTests({
    statsFiller() {
      return ctx.prisma.dailyStats.aggregate({ to });
    },
    statsFetcher(timeFrame) {
      return caller.getBlockDailyStats({ timeFrame });
    },
  });
});
