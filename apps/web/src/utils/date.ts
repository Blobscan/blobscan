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

export function secondsToTimeString(seconds: number) {
  let unit = seconds;

  if (unit < 120) {
    return `${seconds} seconds`;
  }
  unit /= 60;

  if (unit < 120) {
    return `${Math.round(unit)} minutes`;
  }
  unit /= 60;

  if (unit < 48) {
    return `${Math.round(unit)} hours`;
  }
  unit /= 24;

  if (unit < 14) {
    return `${Math.round(unit)} days`;
  }
  unit /= 7;

  if (unit < 52) {
    return `${Math.round(unit)} weeks`;
  }
  unit /= 52;

  return `${unit.toFixed(1)} years`;
}

export function getHumanDate(date: string | Date) {
  return dayjs(date).format("dddd, MMMM, DD YYYY");
}
