import { beforeAll, beforeEach, describe } from "vitest";

import type { TRPCContext } from "../../src";
import { outputSchema } from "../../src/routers/stats/getDailyStats";
import { createTestContext } from "../helpers";
import { runTRPCQueryCacheTests } from "../test-suites/cache";
import type { StatsCaller } from "./caller";
import { createStatsCaller } from "./caller";

describe("getDailyStats", () => {
  let caller: StatsCaller;
  let ctx: TRPCContext;
  const input: Parameters<typeof caller.getDailyStats>[0] = {
    timeFrame: "7d",
    sort: "desc",
  };

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

  runTRPCQueryCacheTests({
    procedureCall() {
      return caller.getDailyStats(input);
    },
    procedureInput: input,
    procedureName: "getDailyStats",
    outputSchema: outputSchema,
    ttlProvided: "daily",
  });
});
