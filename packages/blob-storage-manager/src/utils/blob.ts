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

export function isHexString(data: string): data is HexString {
  return data.startsWith("0x");
}

export function normalizeBlobData(data: string | Buffer) {
  if (typeof data === "string") {
    if (!isHexString(data)) {
      throw new Error(`Invalid blob data hex string: must start with '0x'`);
    }

    return hexToBytes(data);
  }

  return data;
}
