import dayjs from "./dayjs";

export function formatTimestamp(timestamp: number) {
  const unixHandler = dayjs.unix(timestamp);

  return `${unixHandler.fromNow()} (${unixHandler.format(
    "MMM D, YYYY h:mm AZ",
  )})`;
}
