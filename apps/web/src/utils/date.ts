import dayjs from "@blobscan/dayjs";

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

  return new Date(date).toISOString().split("T")[0];
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

export function getHumanDate(date: string | Date) {
  return dayjs(date).format("dddd, MMMM, DD YYYY");
}
