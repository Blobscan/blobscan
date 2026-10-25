import { createHash } from "crypto";

export function computeVersionedHash(commitment: string) {
  const hashedCommitment = createHash("sha256")
    .update(commitment.slice(2), "hex")
    .digest("hex");

  return `0x01${hashedCommitment.slice(2)}`;
}

export function hexToBytes(hex: string) {
  return Buffer.from(hex.slice(2), "hex");
}

export function bytesToHex(bytes: ArrayBuffer | Uint8Array) {
  return `0x${Buffer.from(bytes).toString("hex")}`;
}
