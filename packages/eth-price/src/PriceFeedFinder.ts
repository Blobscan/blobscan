import { Address, PublicClient } from "viem";

import dayjs from "@blobscan/dayjs";

import { EAC } from "../abi/EAC";
import { Aggregator } from "../abi/aggregator";
import { buildRoundId, toDayjs, parseRoundId, Timestampish } from "./utils";

export type PriceRoundData = {
  aggregatorRoundId: bigint;
  phaseId: number;
  price: bigint;
  roundId: bigint;
  startedAt: dayjs.Dayjs;
  updatedAt: dayjs.Dayjs;
};

type AggregatorData = {
  phaseId: number;
  address: Address;
  lastRoundTimestamp?: dayjs.Dayjs;
  lastRoundId?: bigint;
  lastAggregatorRoundId?: bigint;
};

type ParsedRoundId = ReturnType<typeof parseRoundId>;

type RoundIdLike = bigint | ParsedRoundId;
export interface Options {
  startRoundId?: RoundIdLike;
}

export class PriceFeedFinder {
  private constructor(
    private readonly client: PublicClient,
    private readonly aggregators: AggregatorData[],
    private readonly timeTolerance: number
  ) {}

  /**
   * Creates a new instance of the PriceFeedFinder class.
   * @param client The client used to interact with the data feed contract.
   * @param dataFeedContractAddress The price data feed contract address.
   * @param aggregators The phase aggregators of the price feed contract.
   * @param timeTolerance The maximum time difference in seconds allowed between the target
   * timestamp and the round timestamp.
   */
  static async create({
    client,
    dataFeedContractAddress,
    timeTolerance,
  }: {
    client: PublicClient;
    dataFeedContractAddress: Address;
    timeTolerance?: number;
  }) {
    const aggregators = await PriceFeedFinder.#retrieveAggregators(
      client,
      dataFeedContractAddress
    );

    if (!aggregators.length) {
      throw new Error("Failed to create PriceFeedFinder: no aggregators found");
    }

    const instance = new PriceFeedFinder(
      client,
      aggregators,
      timeTolerance || Infinity
    );

    return instance;
  }

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
   * @param timestamp The timestamp for which the price is requested in seconds.
   * @returns The price of the asset at the given timestamp.
   **/
  async getPriceByTimestamp(
    timestamp: Timestampish,
    { startRoundId }: Options = {}
  ): Promise<PriceRoundData | null> {
    const normalizedTargetTimestamp = toDayjs(timestamp);

    // Skip if the timestamp is in the future
    if (normalizedTargetTimestamp.isAfter(dayjs().utc())) {
      return null;
    }

    const parsedStartRoundId = startRoundId
      ? parseRoundId(startRoundId)
      : undefined;

    for (const aggregator of this.aggregators.sort(
      (a, b) => b.phaseId - a.phaseId
    )) {
      const { lastRoundTimestamp } = aggregator;

      if (
        parsedStartRoundId &&
        parsedStartRoundId.phaseId !== aggregator.phaseId
      ) {
        continue;
      }

      if (
        lastRoundTimestamp &&
        normalizedTargetTimestamp.isAfter(lastRoundTimestamp)
      ) {
        continue;
      }

      const roundData = await this.#binarySearchPriceRoundData(
        aggregator,
        Number(timestamp),
        parsedStartRoundId
          ? {
              initialAggregatorRoundRange: {
                low: parsedStartRoundId.phaseRoundId,
              },
            }
          : undefined
      );

      if (roundData) {
        return roundData;
      }
    }

    return null;
  }

  /**
   * Finds the roundId that corresponds to a timestamp using binary search.
   *
   * This function is an adaptation of this implementation:
   * https://github.com/smartcontractkit/quickstarts-historical-prices-api/blob/main/lib/binarySearch.ts
   *
   * @param targetTimestamp The target timestamp.
   * @param latestAggregatorRoundId The latest roundId of the phase aggregator contract.
   * @returns The roundId of the timestamp. If the roundId is not found, it returns null.
   * */
  async #binarySearchPriceRoundData(
    aggregator: AggregatorData,
    targetTimestamp: number,
    {
      initialAggregatorRoundRange,
    }: Partial<{
      initialAggregatorRoundRange: Partial<{ low: bigint; high: bigint }>;
    }> = {}
  ): Promise<PriceRoundData | null> {
    let low = initialAggregatorRoundRange?.low || BigInt(0);
    let high =
      initialAggregatorRoundRange?.high ||
      aggregator.lastAggregatorRoundId ||
      (await this.#fetchPriceRoundDataOrThrow(aggregator, "latest"))
        .aggregatorRoundId;
    let closestRoundData: PriceRoundData | null = null;

    let count = 0;

    while (low <= high) {
      const mid = low + (high - low) / BigInt(2);

      count++;
      const roundData = await this.#fetchPriceRoundData(aggregator, mid);

      if (roundData) {
        const midTimestamp = roundData.updatedAt.unix();

        if (midTimestamp <= targetTimestamp) {
          low = mid + BigInt(1);

          if (targetTimestamp - midTimestamp <= this.timeTolerance) {
            closestRoundData = roundData;
          }
        } else {
          high = mid - BigInt(1);
        }
      } else {
        low = mid + BigInt(1);
      }
    }

    return closestRoundData;
  }

  /**
   * It gets the phase aggregators contracts of a price feed contract.
   *
   * This function was extracted from a fragment of this larger function:
   * https://github.com/smartcontractkit/quickstarts-historical-prices-api/blob/85180c5a1d06eba6e32417bfbf19fcbb53e140be/controllers/index.ts#L108
   *
   * @returns A set of phase aggregator contracts.
   */
  static async #retrieveAggregators(
    client: PublicClient,
    dataFeedAddress: Address
  ): Promise<AggregatorData[]> {
    try {
      const latestPhaseId = await client.readContract({
        address: dataFeedAddress,
        abi: EAC,
        functionName: "phaseId",
      });

      const phaseAggregatorIds: number[] = [];

      for (let i = 1; i <= latestPhaseId; i++) {
        phaseAggregatorIds.push(i);
      }

      const phaseAggregators = await client.multicall({
        contracts: phaseAggregatorIds.map((id) => ({
          address: dataFeedAddress,
          abi: EAC,
          functionName: "phaseAggregators",
          args: [id.toString()],
        })),
      });

      const aggregatorDatas: AggregatorData[] = [];

      for (let i = 0; i < phaseAggregators.length; i++) {
        const phaseAggregator = phaseAggregators[i];

        if (!phaseAggregator || phaseAggregator.status === "failure") {
          continue;
        }

        const address = phaseAggregator.result as Address;
        const currentPhaseId = i + 1;
        const isLatestAggregator = currentPhaseId === latestPhaseId;

        if (isLatestAggregator) {
          aggregatorDatas.push({
            phaseId: i + 1,
            address,
          });

          continue;
        }

        try {
          const [
            latestAggregatorRoundId,
            _,
            __,
            latestRoundUpdatedAtTimestamp,
          ] = await client.readContract({
            address,
            abi: Aggregator,
            functionName: "latestRoundData",
          });

          aggregatorDatas.push({
            phaseId: currentPhaseId,
            address,
            lastRoundTimestamp: toDayjs(latestRoundUpdatedAtTimestamp),
            lastRoundId: buildRoundId(currentPhaseId, latestAggregatorRoundId),
            lastAggregatorRoundId: latestAggregatorRoundId,
          });
        } catch (_) {
          continue;
        }
      }

      return aggregatorDatas;
    } catch (err) {
      throw new Error(
        `Failed to retrieve aggregators from data feed contract ${dataFeedAddress}`,
        { cause: err }
      );
    }
  }

  async #fetchPriceRoundData(
    { address, phaseId }: AggregatorData,
    aggregatorRoundId: bigint | "latest"
  ): Promise<PriceRoundData | null> {
    try {
      const isLatest = aggregatorRoundId === "latest";
      const [aggregatorRoundId_, answer, startedAt, updatedAt] =
        await this.client.readContract({
          functionName: isLatest ? "latestRoundData" : "getRoundData",
          abi: Aggregator,
          args: isLatest ? undefined : [aggregatorRoundId],
          address: address,
        });

      if (startedAt === BigInt(0)) {
        return null;
      }

      return {
        roundId: buildRoundId(phaseId, aggregatorRoundId_),
        phaseId,
        aggregatorRoundId: aggregatorRoundId_,
        price: answer,
        startedAt: toDayjs(startedAt),
        updatedAt: toDayjs(updatedAt),
      };
    } catch (err) {
      return null;
    }
  }

  async #fetchPriceRoundDataOrThrow(
    aggregatorData: AggregatorData,
    roundId: bigint | "latest"
  ) {
    const roundData = await this.#fetchPriceRoundData(aggregatorData, roundId);

    if (!roundData) {
      throw new Error(
        `Failed to retrieve round data with id ${roundId} from aggregator contract: ${aggregatorData.address}`
      );
    }

    return roundData;
  }
}
