import { ValueType } from "@opentelemetry/api";
import { MeterProvider } from "@opentelemetry/sdk-metrics";

import {
  paginationSchema,
  withPagination,
} from "../../middlewares/withPagination";
import { publicProcedure } from "../../procedures";
import { fullTransactionSelect } from "./common";
import { getByAddressInputSchema } from "./getByAddress.schema";

export const getByAddress = publicProcedure
  .input(paginationSchema)
  .use(withPagination)
  .input(getByAddressInputSchema)
  .query(async ({ ctx, input }) => {
    const { address } = input;

    const [transactions, totalTransactions] = await Promise.all([
      ctx.prisma.transaction.findMany({
        select: fullTransactionSelect,
        where: {
          OR: [{ fromId: address }, { toId: address }],
        },
        orderBy: { blockNumber: "desc" },
        ...ctx.pagination,
      }),
      // FIXME: this is not efficient
      ctx.prisma.transaction.count({
        where: {
          OR: [{ fromId: address }, { toId: address }],
        },
      }),
    ]);

    const meter = new MeterProvider().getMeter("blobscan-api");
    const counter = meter.createCounter("blobscan_api_requests_total", {
      valueType: ValueType.INT,
      description:
        "Number of requests made to Blobscan API by endpoint, status_code and method",
    });
    counter.add(1, {
      method: "GET",
      endpoint: "/api/tx/by-addr",
      status_code: "200",
    });

    return {
      transactions,
      totalTransactions,
    };
  });
