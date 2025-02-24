import { Address } from "viem";

import { Aggregator } from "../abi/aggregator";
import { client } from "./client";
import { getClosestRoundData } from "./get-closest-round-data";

type Data = {
  phaseId: number;
  roundId: bigint;
  price: bigint;
  timestamp: bigint;
};

/**
 * Get the price of an asset at a specific timestamp.
 * @param address The price feed contract Addresses (https://docs.chain.link/data-feeds/price-feeds/addresses).
 * @param timestamp The timestamp to get the price for.
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
}): Promise<Data> {
  const response = await getClosestRoundData({
    address,
    targetTimestamp,
    tolerance,
  });

  if (response === null) {
    throw new Error(`No data found for target timestamp: ${targetTimestamp}`);
  }

  const roundData = await client.readContract({
    functionName: "getRoundData",
    abi: Aggregator,
    args: [response.roundId],
    address: response.phaseAggregatorContractAddress,
  });

  return {
    phaseId: response.phaseId,
    roundId: response.roundId,
    price: roundData[1],
    timestamp: roundData[3],
  };
}
