import { Address } from "viem";

import { getPhaseAggregatorByPhaseId } from "../src/get-phase-aggregators";
import {
  getPriceByTimestamp,
  getRoundData,
  RoundData,
} from "../src/get-price-by-timestamp";

export async function getPriceInRange({
  address,
  startTimestampSeconds,
  endTimestampSeconds,
  contractUpdatePeriodSeconds,
}: {
  address: Address;
  startTimestampSeconds: bigint;
  endTimestampSeconds: bigint;
  contractUpdatePeriodSeconds: bigint;
}): Promise<RoundData[]> {
  const priceData = await getPriceByTimestamp({
    address,
    tolerance: contractUpdatePeriodSeconds,
    targetTimestampSeconds: startTimestampSeconds,
  });

  let phaseAggregator = await getPhaseAggregatorByPhaseId({
    address,
    phaseId: priceData.phaseId,
  });

  let roundId = priceData.roundId;
  let priceDataList: RoundData[] = [];

  while (true) {
    const priceData = await getRoundData({
      roundId,
      phaseAggregatorAddress: phaseAggregator.address,
    });

    priceDataList.push(priceData);

    if (priceData.timestamp >= endTimestampSeconds) {
      break;
    }

    if (phaseAggregator.latestRoundId <= roundId) {
      phaseAggregator = await getPhaseAggregatorByPhaseId({
        address,
        phaseId: phaseAggregator.phaseId + 1,
      });
    }

    roundId += BigInt(1);
  }

  return priceDataList;
}
