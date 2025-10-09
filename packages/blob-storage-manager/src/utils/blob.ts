import type { BlobFileType, HexString } from "../types";

export function calculateBlobBytes(blob: string): number {
  return blob.slice(2).length / 2;
}

export function hexToBytes(hex: HexString) {
  return Buffer.from(hex.slice(2), "hex");
}

export function bytesToHex(bytes: Buffer | ArrayBuffer) {
  const buffer = bytes instanceof Buffer ? bytes : Buffer.from(bytes);

  return `0x${buffer.toString("hex")}`;
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

/**
 * Determines the expected file type based on the URI extension.
 * Defaults to "binary" for all non-.txt files, assuming future blobs use binary format.
 */
export function getBlobFileType(uri: string): BlobFileType {
  return uri.endsWith(".txt") ? "text" : "binary";
}
