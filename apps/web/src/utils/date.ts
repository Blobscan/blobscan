import dayjs from "@blobscan/dayjs";

export function normalizeTimestamp(timestamp: number | Date) {
  return typeof timestamp === "number"
    ? dayjs.unix(timestamp)
    : dayjs(timestamp);
}

export function formatTimestamp(timestamp: number | Date) {
  const unixHandler = normalizeTimestamp(timestamp);

  return `${unixHandler.fromNow()} (${unixHandler.format(
    "MMM D, YYYY h:mm AZ"
  )})`;
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
