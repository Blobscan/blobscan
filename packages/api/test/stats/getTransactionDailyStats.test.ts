import { beforeAll, describe } from "vitest";

import dayjs from "@blobscan/dayjs";
import { fixtures } from "@blobscan/test";

import type { TRPCContext } from "../../src";
import { createTestContext } from "../helpers";
import type { StatsCaller } from "./caller";
import { createStatsCaller } from "./caller";
import { runTimeFrameTests } from "./helpers";

describe("getTransactionDailyStats", () => {
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
      return caller.getTransactionDailyStats({ timeFrame });
    },
  });
});
