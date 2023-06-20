import { Prisma } from "@prisma/client";

import dayjs from "@blobscan/dayjs";

export type DatePeriod = {
  from?: string;
  to?: string;
};

export function normalizeDate(
  date: dayjs.Dayjs | string | Date,
  startOfOrEndOfDay: "startOf" | "endOf" = "endOf",
) {
  const date_ = dayjs(date);

  return date_[startOfOrEndOfDay]("day").toISOString();
}

export function buildRawWhereClause(
  dateField: Prisma.Sql,
  { from, to }: DatePeriod,
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

export function buildWhereClause(dateField: string, { from, to }: DatePeriod) {
  return { [dateField]: { gte: from, lte: to } };
}

export function getDefaultDatePeriod(): DatePeriod {
  return { to: normalizeDate(dayjs()) };
}
