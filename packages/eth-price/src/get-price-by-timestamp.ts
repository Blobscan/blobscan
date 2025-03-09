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
 *
 * This function uses the Chainlink price feed to get the price of an asset at a specific timestamp.
 *
 * Before explaining the function, it is important to understand some concepts about Chainlink price feeds:
 *
 *  - Round: Each time new data is added to the price feed, a new round is created.
 *
 *  - RoundId: The roundId is a unique identifier for each round.
 *
 *  - Phase: Each time the price feed has a significant change, for example,
 *    when the set of oracles is changed a new phase is created.
 *
 *  - PhaseId: The phaseId is a unique identifier for each phase.
 *
 *  - Phase aggregator contract: Each time a new phase is created, a new phase aggregator contract is deployed.
 *    The phase aggregator contract is responsible for aggregating the data for a specific phase.
 *
 * Note: The price information is stored in rounds in the phase aggregator contracts.
 *
 * Basic steps:
 *    1. We get the phase aggregator contracts of the price feed contract.
 *    (This is done by calling the getPhaseAggregators inside the getClosestRoundData function).
 *
 *    2. Inside each phase aggregator contract, we find the round that is closest to the target timestamp.
 *   (This is done by calling the binarySearchRoundId inside the getClosestRoundData function).
 *
 *    3. We get the data from the retrieved round.
 *
 * Aditional information can be found here: https://docs.chain.link/data-feeds
 *
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
