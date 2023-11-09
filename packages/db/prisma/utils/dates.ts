import { Prisma } from "@prisma/client";

import dayjs from "@blobscan/dayjs";

export type RawDate = string | Date | dayjs.Dayjs;

export type RawDatePeriod = {
  from?: RawDate;
  to?: RawDate;
};

export type DatePeriod = {
  from?: string;
  to?: string;
};

export function normalizeDailyDate(
  date: string | Date | dayjs.Dayjs,
  startOfOrEndOfDay: "startOf" | "endOf" = "endOf"
) {
  const date_ = dayjs.isDayjs(date) ? date : dayjs(new Date(date)).utc();

  return date_[startOfOrEndOfDay]("day").toISOString();
}

export function normalizeDailyDatePeriod(
  datePeriod?: RawDatePeriod
): DatePeriod {
  if (!datePeriod || (!datePeriod.from && !datePeriod.to))
    return { to: normalizeDailyDate(dayjs()) };

  const normalizedDatePeriod = {
    from: datePeriod.from && normalizeDailyDate(datePeriod.from, "startOf"),
    to: datePeriod.to && normalizeDailyDate(datePeriod.to, "endOf"),
  };

  const { from, to } = normalizedDatePeriod;

  if (from && to && new Date(from) > new Date(to)) {
    throw new Error(`Invalid date period: start date is after end date`);
  }

  return normalizedDatePeriod;
}

export function buildRawWhereClause(
  dateField: Prisma.Sql,
  { from, to }: DatePeriod
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
