import { Prisma } from "@blobscan/db";
import { z } from "@blobscan/zod";

import type { TRPCContext } from "../../context";
import { publicProcedure } from "../../procedures";
import { cacheTRPCQuery, normalize } from "../../utils";
import type { AddressInput, RoleTotals } from "./helpers";
import {
  addRoleTotals,
  addressInputSchema,
  buildAddressAggregateSelection,
  decimalToBigInt,
  findEdgeTransaction,
  getAddressGranularity,
  getAddressMetricsModel,
  getLongestGap,
  getLongestStreak,
  getNetworkMetricsModel,
  getRoleTotals,
  getTimeFrameStart,
  mergeAggregates,
  NETWORK_WIDE_FILTER,
  roleTotalsSchema,
  serializeRoleTotals,
} from "./helpers";

// The cache keeps a result for 60 seconds. Dagster updates the address
// metrics every 10 minutes, thus a cached result is at most 60 seconds older
// than the database.
const CACHE_TTL_SECONDS = 60;

const transactionRefSchema = z
  .object({ hash: z.string(), blockTimestamp: z.date() })
  .nullable();

const outputSchema = z
  .object({
    data: z.object({
      address: z.string(),
      category: z
        .string()
        .nullable()
        .describe("Null when the address is not in the database."),
      rollup: z.string().nullable(),
      timeFrame: addressInputSchema.shape.timeFrame,
      sent: roleTotalsSchema,
      received: roleTotalsSchema,
      selfTotalTransactions: z
        .number()
        .int()
        .nonnegative()
        .describe(
          "The transactions where the address is the sender and the receiver. They are also in `sent` and in `received`."
        ),
      network: z
        .object({
          totalBlobs: z.number().int().nonnegative(),
          totalBlobBaseFee: z.bigint().nonnegative(),
          totalBlobGasUsed: z.bigint().nonnegative(),
        })
        .describe(
          "The totals of all addresses in the time frame, for the share of network blobs and the timing ratio."
        ),
      allTime: z
        .object({
          totalTransactions: z
            .number()
            .int()
            .nonnegative()
            .describe(
              "The blob transactions of the address in either role. A self-send counts one time."
            ),
          activeDays: z.number().int().nonnegative(),
          longestStreak: z
            .number()
            .int()
            .nonnegative()
            .describe(
              "The largest number of consecutive days with blob transactions."
            ),
          longestGap: z
            .number()
            .int()
            .nonnegative()
            .describe(
              "The largest number of days with no blob transactions between two active days. It is 0 when the address has fewer than two active days."
            ),
          firstTransaction: transactionRefSchema,
          lastTransaction: transactionRefSchema,
        })
        .describe("All-time values. They do not depend on the time frame."),
      updatedAt: z.date().nullable(),
    }),
  })
  .transform(normalize);

type Output = z.input<typeof outputSchema>;

type Totals = {
  sent: RoleTotals;
  received: RoleTotals;
  selfTotalTransactions: number;
  updatedAt: Date | null;
};

async function getAllTimeTotals(
  prisma: TRPCContext["prisma"],
  address: string
): Promise<Totals> {
  const allTime = await prisma.addressAllTimeMetrics.findUnique({
    where: { address },
  });

  // The all-time row has the closed days until aggregatedUntil. Add the daily
  // rows after it: the current day, and a closed day that Dagster did not
  // add yet.
  const recent = await prisma.addressDailyMetrics.aggregate({
    ...buildAddressAggregateSelection(),
    where: {
      address,
      ...(allTime ? { periodStart: { gt: allTime.aggregatedUntil } } : {}),
    },
  });

  const recentRow = mergeAggregates(recent);
  const sent = getRoleTotals(recentRow, "sent");
  const received = getRoleTotals(recentRow, "received");
  const selfTotalTransactions = recent._sum.selfTotalTransactions ?? 0;
  const recentUpdatedAt = recent._max.updatedAt ?? null;

  if (!allTime) {
    return {
      sent,
      received,
      selfTotalTransactions,
      updatedAt: recentUpdatedAt,
    };
  }

  return {
    sent: addRoleTotals(getRoleTotals(allTime, "sent"), sent),
    received: addRoleTotals(getRoleTotals(allTime, "received"), received),
    selfTotalTransactions:
      allTime.selfTotalTransactions + selfTotalTransactions,
    updatedAt: recentUpdatedAt ?? allTime.updatedAt,
  };
}

async function getTimeFrameTotals(
  prisma: TRPCContext["prisma"],
  address: string,
  input: AddressInput
): Promise<Totals> {
  const granularity = getAddressGranularity(input.timeFrame);
  const where = {
    address,
    periodStart: { gte: getTimeFrameStart(input.timeFrame, granularity) },
  };
  const result = await getAddressMetricsModel(prisma, granularity).aggregate({
    ...buildAddressAggregateSelection(),
    where,
  });

  const row = mergeAggregates(result);

  return {
    sent: getRoleTotals(row, "sent"),
    received: getRoleTotals(row, "received"),
    selfTotalTransactions: result._sum.selfTotalTransactions ?? 0,
    updatedAt: result._max.updatedAt ?? null,
  };
}

async function getNetworkTotals(
  prisma: TRPCContext["prisma"],
  input: AddressInput
) {
  if (input.timeFrame === "All") {
    const row = await prisma.allTimeMetrics.findFirst({
      where: NETWORK_WIDE_FILTER,
    });

    return {
      totalBlobs: row?.totalBlobs ?? 0,
      totalBlobBaseFee: new Prisma.Decimal(row?.totalBlobBaseFee ?? 0),
      totalBlobGasUsed: new Prisma.Decimal(row?.totalBlobGasUsed ?? 0),
    };
  }

  const granularity = getAddressGranularity(input.timeFrame);
  const { _sum } = await getNetworkMetricsModel(prisma, granularity).aggregate({
    _sum: {
      totalBlobs: true,
      totalBlobBaseFee: true,
      totalBlobGasUsed: true,
    },
    where: {
      ...NETWORK_WIDE_FILTER,
      periodStart: { gte: getTimeFrameStart(input.timeFrame, granularity) },
    },
  });

  return {
    totalBlobs: _sum.totalBlobs ?? 0,
    totalBlobBaseFee: new Prisma.Decimal(_sum.totalBlobBaseFee ?? 0),
    totalBlobGasUsed: new Prisma.Decimal(_sum.totalBlobGasUsed ?? 0),
  };
}

const getAddressOverall = cacheTRPCQuery(
  async ({
    ctx: { prisma },
    input,
  }: {
    ctx: TRPCContext;
    input: AddressInput;
  }): Promise<Output> => {
    const { address } = input;

    const [
      dbAddress,
      timeFrameTotals,
      allTimeTotals,
      network,
      activeDays,
      longestStreak,
      longestGap,
      firstTransaction,
      lastTransaction,
    ] = await Promise.all([
      prisma.address.findUnique({
        select: { category: true, rollup: true },
        where: { address },
      }),
      input.timeFrame === "All"
        ? null
        : getTimeFrameTotals(prisma, address, input),
      getAllTimeTotals(prisma, address),
      getNetworkTotals(prisma, input),
      prisma.addressDailyMetrics.count({ where: { address } }),
      getLongestStreak(prisma, address),
      getLongestGap(prisma, address),
      findEdgeTransaction(prisma, address, "first"),
      findEdgeTransaction(prisma, address, "last"),
    ]);

    const totals = timeFrameTotals ?? allTimeTotals;

    return {
      data: {
        address,
        category: dbAddress?.category ?? null,
        rollup: dbAddress?.rollup ?? null,
        timeFrame: input.timeFrame,
        sent: serializeRoleTotals(totals.sent),
        received: serializeRoleTotals(totals.received),
        selfTotalTransactions: totals.selfTotalTransactions,
        network: {
          totalBlobs: network.totalBlobs,
          totalBlobBaseFee: decimalToBigInt(network.totalBlobBaseFee),
          totalBlobGasUsed: decimalToBigInt(network.totalBlobGasUsed),
        },
        allTime: {
          totalTransactions:
            allTimeTotals.sent.totalTransactions +
            allTimeTotals.received.totalTransactions -
            allTimeTotals.selfTotalTransactions,
          activeDays,
          longestStreak,
          longestGap,
          firstTransaction,
          lastTransaction,
        },
        updatedAt: totals.updatedAt,
      },
    };
  },
  { queryName: "addressGetOverall", ttl: CACHE_TTL_SECONDS }
);

export const getOverall = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/addresses/{address}/stats/overall",
      tags: ["addresses"],
      summary:
        "retrieves the metrics of an address as sender and as receiver in a time frame.",
    },
  })
  .input(addressInputSchema)
  .output(outputSchema)
  .query(({ ctx, input }) => getAddressOverall({ ctx, input }));
