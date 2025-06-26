import type { HexString } from "../types";

export function calculateBlobBytes(blob: string): number {
  return blob.slice(2).length / 2;
}

export function hexToBytes(hex: HexString) {
  return Buffer.from(hex.slice(2), "hex");
}

export function bytesToHex(bytes: Buffer) {
  return `0x${bytes.toString("hex")}`;
}

export function isHexString(value: unknown): value is HexString {
  return (
    typeof value === "string" &&
    /^0x[0-9a-fA-F]*$/.test(value) &&
    (value.length - 2) % 2 === 0
  );
}

export function normalizeBlobData(data: string | Buffer) {
  if (typeof data === "string") {
    if (!isHexString(data)) {
      throw new Error(`Invalid blob data hex string`);
    }

    return hexToBytes(data);
  }

  return data;
}
