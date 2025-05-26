import { sha256 } from "viem";

export function computeVersionedHash(commitment: string) {
  const hashedCommitment = sha256(commitment as `0x${string}`);

  return `0x01${hashedCommitment.slice(4)}`;
}
