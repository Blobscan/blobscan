import dayjs from "@blobscan/dayjs";

export const MS_PER_MINUTE = 60_000;
export const MS_PER_HOUR = 60 * MS_PER_MINUTE;
export const MS_PER_DAY = 24 * MS_PER_HOUR;

export const TIMESTAMP_FORMAT = "MMM D, YYYY h:mm:ss AZ";

export function normalizeTimestamp(timestamp: number | Date | string) {
  return typeof timestamp === "number"
    ? dayjs.unix(timestamp)
    : dayjs(timestamp);
}

export function getISODate(date: dayjs.Dayjs | Date | string) {
  if (dayjs.isDayjs(date)) {
    return date.format("YYYY-MM-DD");
  }

  return new Date(date).toISOString().split("T")[0] as string;
}

export function formatTimestamp(
  timestamp: number | Date | string | dayjs.Dayjs,
  compact = false
) {
  const unixHandler = dayjs.isDayjs(timestamp)
    ? timestamp
    : normalizeTimestamp(timestamp);

  const dateFormattedSuffix = compact
    ? ""
    : ` (${unixHandler.format(TIMESTAMP_FORMAT)})`;

  return `${unixHandler.fromNow()}${dateFormattedSuffix}`;
}

export function formatDate(
  date: string,
  options: Partial<{ hideYear: boolean }>
) {
  if (options.hideYear) {
    return date.split("-").slice(1).join("-");
  }

  return date;
}

export const HUMAN_DATE_FORMAT = "dddd, MMMM, DD YYYY";

export function getHumanDate(date: string | Date) {
  return dayjs(date).format(HUMAN_DATE_FORMAT);
}

const DAYS_PER_YEAR = 365;

function pluralize(count: number, unit: string) {
  return `${count.toLocaleString("en-US")} ${count === 1 ? unit : `${unit}s`}`;
}

/**
 * Formats a number of days. From 365 days, it shows the years and the
 * remaining days, for example "1 year, 35 days". A year is 365 days.
 */
export function formatDayCount(days: number) {
  const years = Math.floor(days / DAYS_PER_YEAR);
  const remainingDays = days % DAYS_PER_YEAR;

  if (!years) {
    return pluralize(days, "day");
  }

  return remainingDays
    ? `${pluralize(years, "year")}, ${pluralize(remainingDays, "day")}`
    : pluralize(years, "year");
}
