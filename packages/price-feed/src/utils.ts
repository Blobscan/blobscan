import type { PriceData, RoundData } from "./PriceFeed";

export type ParsedRoundId = {
  phaseId: number;
  phaseRoundId: bigint;
};

export type RoundIdish = bigint | ParsedRoundId;

export type Timestampish = number | bigint | Date;

export type RawRoundData = readonly [bigint, bigint, bigint, bigint, bigint];

/// See https://docs.chain.link/data-feeds/historical-data#roundid-in-proxy to learn more about how
/// to round ids are encoded in the proxy contract.
export function parseRoundId(roundIdLike: RoundIdish): ParsedRoundId {
  if (typeof roundIdLike === "bigint") {
    return {
      phaseId: Number(roundIdLike >> BigInt(64)),
      phaseRoundId: roundIdLike & BigInt("0xffffffffffffffff"),
    };
  }

  return roundIdLike;
}

/// See https://docs.chain.link/data-feeds/historical-data#roundid-in-proxy to learn more about how
/// to round ids are encoded in the proxy contract.
export function buildRoundId(phaseId: number, phaseRoundId: bigint) {
  return (BigInt(phaseId) << BigInt(64)) | phaseRoundId;
}

export function isEmptyRoundData(roundData: RawRoundData) {
  const updatedAt = roundData[3];

  return updatedAt === BigInt(0);
}

export function toRoundData(
  rawAggregatorRoundData: RawRoundData,
  phaseId: number
): RoundData {
  const [roundId, price, _, updatedAt] = rawAggregatorRoundData;

  return {
    aggregatorRoundId: roundId,
    roundId: buildRoundId(phaseId, roundId),
    price,
    timestamp: normalizeTimestamp(updatedAt),
  };
}

export function toPriceData(roundData: RoundData): PriceData {
  const { roundId, price, timestamp } = roundData;

  return {
    roundId,
    price,
    timestamp: new Date(timestamp * 1000),
  };
}

export function normalizeTimestamp(timestampish: Timestampish) {
  if (timestampish instanceof Date) {
    return Math.floor(timestampish.getTime() / 1000);
  }
  return Number(timestampish);
}
