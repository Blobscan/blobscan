import dayjs from "@blobscan/dayjs";

export function formatTimestamp(timestamp: number | Date) {
  const unixHandler =
    typeof timestamp === "number" ? dayjs.unix(timestamp) : dayjs(timestamp);

  return `${unixHandler.fromNow()} (${unixHandler.format(
    "MMM D, YYYY h:mm AZ",
  )})`;
}

export function getDateFromDateTime(dateTime: Date): string {
  return dateTime.toISOString().split("T")[0] as string;
}

export function formatDate(
  date: string,
  options: Partial<{ hideYear: boolean }>,
) {
  if (options.hideYear) {
    return date.split("-").slice(1).join("-");
  }

  return date;
}

export function bytesToKilobytes(bytes: bigint | number): number {
  if (typeof bytes === "bigint") {
    return Number(bytes / BigInt(1000));
  } else {
    return Number(bytes / 1000);
  }
}

export function abbreviateNumber(value: number | string): string {
  const suffixes = ["", "K", "M", "B", "T"];
  let suffixNum = 0;
  let value_ = Number(value);

  while (value_ >= 1000) {
    value_ /= 1000;
    suffixNum++;
  }

  let formattedValue = value_.toPrecision(3);

  formattedValue += suffixes[suffixNum];

  return formattedValue;
}
