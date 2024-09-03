import dayjs from "@blobscan/dayjs";

import type { DatePeriod, RawDatePeriod } from "../types";

export function normalizeDate(date: string | Date | dayjs.Dayjs) {
  let date_: dayjs.Dayjs;

  if (dayjs.isDayjs(date)) {
    date_ = date;
  } else if (date instanceof Date) {
    date_ = dayjs(date);
  } else {
    date_ = dayjs(new Date(date));
  }

  return date_.utc();
}

export function normalizeDailyDate(
  date: string | Date | dayjs.Dayjs,
  startOfOrEndOfDay: "startOf" | "endOf" = "endOf"
) {
  const date_ = normalizeDate(date);

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
    throw new Error(`Invalid date period. Start date is after end date`);
  }

  return normalizedDatePeriod;
}
