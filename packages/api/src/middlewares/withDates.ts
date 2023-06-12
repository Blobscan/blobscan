import dayjs from "dayjs";
import { z } from "zod";

import { Prisma } from "@blobscan/db";

import { t } from "../client";
import { toDailyDate } from "../utils/stats";

type FilteringDates = {
  from?: string;
  to?: string;
};

function _buildRawWhereClause(
  dateField: Prisma.Sql,
  { from, to }: FilteringDates,
): Prisma.Sql {
  if (from && to) {
    return Prisma.sql`WHERE ${dateField} BETWEEN ${from}::TIMESTAMP AND ${to}::TIMESTAMP`;
  } else if (from) {
    return Prisma.sql`WHERE ${dateField} >= ${from}::TIMESTAMP`;
  } else if (to) {
    return Prisma.sql`WHERE ${dateField} < ${to}::TIMESTAMP`;
  }

  return Prisma.empty;
}

function _buildWhereClause(dateField: string, { from, to }: FilteringDates) {
  return { [dateField]: { gte: from, lte: to } };
}

export const DATES_SCHEMA = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export const withDates = t.middleware(({ next, input }) => {
  const { from, to } = DATES_SCHEMA.parse(input);
  const dates: FilteringDates = {
    from: from ? toDailyDate(from) : undefined,
    to: toDailyDate(to ?? dayjs()),
  };

  return next({
    ctx: {
      dates: {
        ...dates,
        buildWhereClause: (dateField: string) =>
          _buildWhereClause(dateField, dates),
        buildRawWhereClause: (dateField: Prisma.Sql) =>
          _buildRawWhereClause(dateField, dates),
      },
    },
  });
});
