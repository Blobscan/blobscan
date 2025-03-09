import { Address } from "viem";

import { Aggregator } from "../abi/aggregator";
import { client } from "./client";
import { getClosestRoundData } from "./get-closest-round-data";

type PriceData = {
  phaseId: number;
  roundId: bigint;
  price: bigint;
  // The timestamp of the data in seconds.
  timestamp: bigint;
};

/**
 * Get the price of an asset at a specific timestamp.
 * @param address The price feed contract Addresses (https://docs.chain.link/data-feeds/price-feeds/addresses).
 * @param targetTimestamp The timestamp for which the price is requested in seconds.
 * @param tolerance The maximum difference between the target timestamp and the timestamp of the data.
 * @returns The price of the asset at the given timestamp.
 **/
export async function getPriceByTimestamp({
  address,
  targetTimestamp,
  tolerance,
}: {
  address: Address;
  targetTimestamp: bigint;
  tolerance: bigint;
}): Promise<PriceData> {
  const closestRoundData = await getClosestRoundData({
    address,
    targetTimestamp,
    tolerance,
  });

  if (closestRoundData === null) {
    throw new Error(
      `Could not retrieve ETH price from Chainlink oracle using timestamp: ${targetTimestamp}`
    );
  }

  const roundData = await client.readContract({
    functionName: "getRoundData",
    abi: Aggregator,
    args: [closestRoundData.roundId],
    address: closestRoundData.phaseAggregatorContractAddress,
  });

  return {
    phaseId: closestRoundData.phaseId,
    roundId: closestRoundData.roundId,
    price: roundData[1],
    timestamp: roundData[3],
  };
}
