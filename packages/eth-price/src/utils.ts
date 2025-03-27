import { Address } from "viem";

import dayjs from "@blobscan/dayjs";

export type ParsedRoundId = {
  phaseId: number;
  phaseRoundId: bigint;
};

export type RoundIdish = bigint | ParsedRoundId;

export type Timestampish = number | bigint;

export function parseRoundId(roundIdLike: RoundIdish): ParsedRoundId {
  if (typeof roundIdLike === "bigint") {
    // See https://docs.chain.link/data-feeds/historical-data#roundid-in-proxy
    return {
      phaseId: Number(roundIdLike >> BigInt(64)),
      phaseRoundId: roundIdLike & BigInt("0xffffffffffffffff"),
    };
  }

  return roundIdLike;
}

export function buildRoundId(phaseId: number, phaseRoundId: bigint) {
  return (BigInt(phaseId) << BigInt(64)) | phaseRoundId;
}

export function toDayjs(timestamp: Timestampish) {
  return dayjs.unix(Number(timestamp));
}
