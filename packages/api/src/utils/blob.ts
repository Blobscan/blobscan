import { sha256 } from "viem";

export function computeVersionedHash(commitment: string) {
  const hashedCommitment = sha256(commitment as `0x${string}`);

  return `0x01${hashedCommitment.slice(4)}`;
}

export function hexToBytes(hex: string) {
  return Buffer.from(hex.slice(2), "hex");
}

export function bytesToHex(bytes: ArrayBuffer | Buffer) {
  const buffer = bytes instanceof ArrayBuffer ? Buffer.from(bytes) : bytes;

  return `0x${buffer.toString("hex")}`;
}
