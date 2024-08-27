import dayjs from "@blobscan/dayjs";

export function normalizeTimestamp(timestamp: number | Date | string) {
  return typeof timestamp === "number"
    ? dayjs.unix(timestamp)
    : dayjs(timestamp);
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
    : `(${unixHandler.format("MMM D, YYYY h:mm AZ")})`;

  return `${unixHandler.fromNow()} ${dateFormattedSuffix}`;
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
