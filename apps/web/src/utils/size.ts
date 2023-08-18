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
