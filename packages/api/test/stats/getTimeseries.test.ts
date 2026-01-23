import { beforeAll, beforeEach, describe } from "vitest";

import dayjs from "@blobscan/dayjs";
import { fixtures } from "@blobscan/test";

import type { TRPCContext } from "../../src";
import { outputSchema } from "../../src/routers/stats/getTimeseries";
import { createTestContext } from "../helpers";
import { runTRPCQueryCacheTests } from "../test-suites/cache";
import type { StatsCaller } from "./caller";
import { createStatsCaller } from "./caller";
import { runTimeFrameTests } from "./helpers";

describe("getTimeseriesStats", () => {
  let caller: StatsCaller;
  let ctx: TRPCContext;
  const input: Parameters<typeof caller.getTimeseries>[0] = {
    timeFrame: "7d",
    sort: "desc",
  };
  const to = dayjs(fixtures.systemDate).endOf("day").toISOString();

  beforeAll(async () => {
    ctx = await createTestContext({ withRedis: true });

    caller = createStatsCaller(ctx);
  });

  beforeEach(async () => {
    await ctx.prisma.dailyStats.aggregate();

    return async () => {
      await ctx.prisma.dailyStats.deleteMany();
    };
  });

  runTimeFrameTests({
    statsFiller() {
      return ctx.prisma.dailyStats.aggregate({ to });
    },
    statsFetcher(timeFrame) {
      return caller.getTimeseries({ timeFrame });
    },
  });

  runTRPCQueryCacheTests({
    procedureCall() {
      return caller.getTimeseries(input);
    },
    procedureInput: input,
    procedureName: "getTimeseries",
    outputSchema: outputSchema,
    ttlProvided: "daily",
  });
});
