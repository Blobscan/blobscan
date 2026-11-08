import dayjs from "@blobscan/dayjs";
import { Prisma } from "@blobscan/db";
import { z } from "@blobscan/zod";

import type { TRPCContext } from "../../context";
import { publicProcedure } from "../../procedures";
import { cacheTRPCQuery, normalize } from "../../utils";
import type { AddressGranularity, AddressInput, Role } from "./helpers";
import {
  ROLES,
  addressInputSchema,
  decimalToBigInt,
  getAddressGranularity,
  getCurrentPeriodStart,
  getRoleTotals,
  getTimeFrameStart,
} from "./helpers";

// Dagster updates the address metrics every 10 minutes.
const CACHE_TTL_SECONDS = 60;

const roleSeriesSchema = z.object({
  totalTransactions: z.number().int().array(),
  totalBlobs: z.number().int().array(),
  totalBlobUsageSize: z.bigint().array(),
  totalBlobBaseFee: z.bigint().array(),
  totalBlobAsCalldataFee: z.bigint().array(),
  totalBlobBaseFeeUsd: z.number().nullable().array(),
  totalBlobAsCalldataFeeUsd: z.number().nullable().array(),
  totalUsdPricedTransactions: z.number().int().array(),
});

type RoleSeries = z.input<typeof roleSeriesSchema>;

const outputSchema = z
  .object({
    data: z.object({
      granularity: z.enum(["hour", "day"]),
      timestamps: z
        .date()
        .array()
        .describe(
          "The start of each period, with no gaps. The last one is the current period, and its values are partial."
        ),
      sent: roleSeriesSchema,
      received: roleSeriesSchema,
      selfTotalTransactions: z
        .number()
        .int()
        .array()
        .describe(
          "The self-sends (from = to) in each period. They are also in the sent and the received totals."
        ),
      selfTotalBlobs: z
        .number()
        .int()
        .array()
        .describe(
          "The blobs of the self-sends in each period. They are also in the sent and the received totals."
        ),
      network: z
        .object({
          totalBlobs: z.number().int().array(),
          totalBlobBaseFee: z.bigint().array(),
          totalBlobGasUsed: z.bigint().array(),
        })
        .describe("The totals of all addresses in each period."),
      updatedAt: z.date().nullable(),
    }),
  })
  .transform(normalize);

type Output = z.input<typeof outputSchema>;

function createRoleSeries(): RoleSeries {
  return {
    totalTransactions: [],
    totalBlobs: [],
    totalBlobUsageSize: [],
    totalBlobBaseFee: [],
    totalBlobAsCalldataFee: [],
    totalBlobBaseFeeUsd: [],
    totalBlobAsCalldataFeeUsd: [],
    totalUsdPricedTransactions: [],
  };
}

/** Returns the start of each period from `start` to `end`, both included. */
export function buildTimestamps(
  start: Date,
  end: Date,
  granularity: AddressGranularity
) {
  const timestamps: Date[] = [];

  for (let t = dayjs(start).utc(); !t.isAfter(end); t = t.add(1, granularity)) {
    timestamps.push(t.toDate());
  }

  return timestamps;
}

async function findAddressRows(
  prisma: TRPCContext["prisma"],
  address: string,
  granularity: AddressGranularity,
  start: Date | undefined
) {
  const args = {
    where: { address, periodStart: { gte: start } },
    orderBy: { periodStart: "asc" },
  } as const;

  return granularity === "hour"
    ? prisma.addressHourlyMetrics.findMany(args)
    : prisma.addressDailyMetrics.findMany(args);
}

async function findNetworkRows(
  prisma: TRPCContext["prisma"],
  granularity: AddressGranularity,
  start: Date
) {
  const args = {
    select: {
      periodStart: true,
      totalBlobs: true,
      totalBlobBaseFee: true,
      totalBlobGasUsed: true,
    },
    where: { category: null, rollup: null, periodStart: { gte: start } },
  } as const;

  return granularity === "hour"
    ? prisma.hourlyMetrics.findMany(args)
    : prisma.dailyMetrics.findMany(args);
}

const getAddressTimeseries = cacheTRPCQuery(
  async ({
    ctx: { prisma },
    input,
  }: {
    ctx: TRPCContext;
    input: AddressInput;
  }): Promise<Output> => {
    const { address, timeFrame } = input;
    const granularity = getAddressGranularity(timeFrame);
    const currentPeriodStart = getCurrentPeriodStart(granularity);
    const rows = await findAddressRows(
      prisma,
      address,
      granularity,
      getTimeFrameStart(timeFrame, granularity)
    );

    // For `All`, the timeseries starts at the first period of the address,
    // not at the first period of the chain.
    const start =
      getTimeFrameStart(timeFrame, granularity) ??
      rows[0]?.periodStart ??
      currentPeriodStart;
    const timestamps = buildTimestamps(start, currentPeriodStart, granularity);
    const networkRows = await findNetworkRows(prisma, granularity, start);

    const rowsByTime = new Map(rows.map((r) => [r.periodStart.getTime(), r]));
    const networkByTime = new Map(
      networkRows.map((r) => [r.periodStart.getTime(), r])
    );

    const series: Record<Role, RoleSeries> = {
      sent: createRoleSeries(),
      received: createRoleSeries(),
    };
    const selfTotalTransactions: number[] = [];
    const selfTotalBlobs: number[] = [];
    const network = {
      totalBlobs: [] as number[],
      totalBlobBaseFee: [] as bigint[],
      totalBlobGasUsed: [] as bigint[],
    };
    let updatedAt: Date | null = null;

    for (const timestamp of timestamps) {
      const row = rowsByTime.get(timestamp.getTime());

      for (const role of ROLES) {
        const totals = getRoleTotals(row, role, Prisma.Decimal);
        const roleSeries = series[role];

        roleSeries.totalTransactions.push(totals.totalTransactions);
        roleSeries.totalBlobs.push(totals.totalBlobs);
        roleSeries.totalBlobUsageSize.push(totals.totalBlobUsageSize);
        roleSeries.totalBlobBaseFee.push(
          decimalToBigInt(totals.totalBlobBaseFee)
        );
        roleSeries.totalBlobAsCalldataFee.push(
          decimalToBigInt(totals.totalBlobAsCalldataFee)
        );
        roleSeries.totalBlobBaseFeeUsd.push(totals.totalBlobBaseFeeUsd);
        roleSeries.totalBlobAsCalldataFeeUsd.push(
          totals.totalBlobAsCalldataFeeUsd
        );
        roleSeries.totalUsdPricedTransactions.push(
          totals.totalUsdPricedTransactions
        );
      }

      selfTotalTransactions.push(row?.selfTotalTransactions ?? 0);
      selfTotalBlobs.push(row?.selfTotalBlobs ?? 0);

      if (row && (!updatedAt || row.updatedAt > updatedAt)) {
        updatedAt = row.updatedAt;
      }

      const networkRow = networkByTime.get(timestamp.getTime());

      network.totalBlobs.push(networkRow?.totalBlobs ?? 0);
      network.totalBlobBaseFee.push(
        decimalToBigInt(new Prisma.Decimal(networkRow?.totalBlobBaseFee ?? 0))
      );
      network.totalBlobGasUsed.push(
        decimalToBigInt(new Prisma.Decimal(networkRow?.totalBlobGasUsed ?? 0))
      );
    }

    return {
      data: {
        granularity,
        timestamps,
        sent: series.sent,
        received: series.received,
        selfTotalTransactions,
        selfTotalBlobs,
        network,
        updatedAt,
      },
    };
  },
  { queryName: "addressGetTimeseries", ttl: CACHE_TTL_SECONDS }
);

export const getTimeseries = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/addresses/{address}/stats/timeseries",
      tags: ["addresses"],
      summary:
        "retrieves the metrics of an address as sender and as receiver in each period of a time frame.",
    },
  })
  .input(addressInputSchema)
  .output(outputSchema)
  .query(({ ctx, input }) => getAddressTimeseries({ ctx, input }));
