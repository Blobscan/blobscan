import dayjs from "../dayjs";

export function formatTimestamp(timestamp: number | Date) {
  const unixHandler =
    typeof timestamp === "number" ? dayjs.unix(timestamp) : dayjs(timestamp);

  return `${unixHandler.fromNow()} (${unixHandler.format(
    "MMM D, YYYY h:mm AZ",
  )})`;
}
