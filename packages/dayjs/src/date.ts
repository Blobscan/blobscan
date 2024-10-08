import dayjs from "dayjs";

export type DateLike = string | Date | dayjs.Dayjs;

export type DatePeriodLike = {
  from?: DateLike;
  to?: DateLike;
};

export type DatePeriod = {
  from?: Date;
  to?: Date;
};

export const MIN_DATE = new Date(0);

export function getDateFromISODateTime(isoDateTime: DateLike) {
  let normalizedDateTime: string;
  if (typeof isoDateTime === "string") {
    normalizedDateTime = isoDateTime;
  } else if (isoDateTime instanceof Date) {
    normalizedDateTime = isoDateTime.toISOString();
  } else {
    normalizedDateTime = isoDateTime.toISOString();
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return normalizedDateTime.split("T")[0]!;
}

export function normalizeDate(date: DateLike) {
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

export function toDailyDate(
  date: DateLike,
  startOfOrEndOfDay: "startOf" | "endOf" = "endOf"
) {
  const date_ = normalizeDate(date);

  return date_[startOfOrEndOfDay]("day");
}

export function toDailyDatePeriod(
  datePeriodLike?: DatePeriodLike
): Required<DatePeriod> {
  const { from, to } = datePeriodLike || {};

  if (from && to && dayjs(to).isBefore(from)) {
    throw new Error(`Invalid date period. Start date is after end date`);
  }

  return {
    from: from ? toDailyDate(from, "startOf").toDate() : MIN_DATE,
    to: to ? toDailyDate(to, "endOf").toDate() : new Date(),
  };
}
