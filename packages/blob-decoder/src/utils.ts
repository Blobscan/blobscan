export function bigIntToHex(value: bigint | string): string {
  const value_ = typeof value === "string" ? BigInt(value) : value;

  return `0x${value_.toString(16)}`;
}

export function stripHexPrefix(blobData: string) {
  return blobData.startsWith("0x") ? blobData.slice(2) : blobData;
}
