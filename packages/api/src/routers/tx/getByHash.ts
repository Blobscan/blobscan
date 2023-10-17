import { ValueType } from "@opentelemetry/api";
import { MeterProvider } from "@opentelemetry/sdk-metrics";
import { TRPCError } from "@trpc/server";

import { publicProcedure } from "../../procedures";
import { fullTransactionSelect } from "./common";
import { getByHashInputSchema } from "./getByHash.schema";

export const getByHash = publicProcedure
  .input(getByHashInputSchema)
  .query(async ({ ctx, input }) => {
    const { hash } = input;
    const tx = await ctx.prisma.transaction.findUnique({
      select: fullTransactionSelect,
      where: { hash },
    });
    if (!tx) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `No tx with hash '${hash}'`,
      });
    }

    const meter = new MeterProvider().getMeter("blobscan-api");
    const counter = meter.createCounter("blobscan_api_requests_total", {
      valueType: ValueType.INT,
      description:
        "Number of requests made to Blobscan API by endpoint, status_code and method",
    });
    counter.add(1, {
      method: "GET",
      endpoint: "/api/tx/by-hash",
      status_code: "200",
    });

    return tx;
  });
