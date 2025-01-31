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

export async function getPriceByTimestamp({
  address,
  timestamp,
  tolerance,
}: {
  address: Address;
  timestamp: bigint;
  tolerance: bigint;
}): Promise<Data> {
  const response = await getClosestRoundData({ address, timestamp, tolerance });

  if (response === null) {
    throw new Error(`No data found for timestamp: ${timestamp}`);
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
