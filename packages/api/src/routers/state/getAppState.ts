import type { Prisma } from "@blobscan/db";

import { publicProcedure } from "../../procedures";

type StateQuery = {
  lastAggregatedBlock: number;
  lastFinalizedBlock: number;
  lastLowerSyncedSlot: number;
  lastUpperSyncedSlot: number;
  swarmDataId: number;
  swarmDataTTL: number;
}[];

type BlocksQuery = {
  number: number;
  slot: number;
  timestamp: Date;
  blobGasPrice: Prisma.Decimal;
}[];

type PriceQuery = { price: Prisma.Decimal; timestamp: Date }[];

export const getAppState = publicProcedure.query(
  async ({ ctx: { prisma } }) => {
    const [stateQuery, blocksQuery, ethPricesQuery] = await Promise.all([
      prisma.$queryRaw<StateQuery>`
      SELECT 
        st.last_aggregated_block AS "lastAggregatedBlock",
        st.last_finalized_block AS "lastFinalizedBlock",
        st.last_lower_synced_slot AS "lastLowerSyncedSlot",
        st.last_upper_synced_slot AS "lastUpperSyncedSlot",
        bs.swarm_data_id AS "swarmDataId",
        bs.swarm_data_ttl AS "swarmDataTTL"
      FROM blockchain_sync_state st JOIN blob_storages_state bs ON st.id = bs.id
      WHERE st.id = 1;
    `,
      prisma.$queryRaw<BlocksQuery>`
       (
          SELECT number, slot, timestamp, blob_gas_price AS "blobGasPrice"
          FROM block
          WHERE timestamp <= NOW()
          ORDER BY timestamp DESC
          LIMIT 1
      )
      UNION ALL
      (
          SELECT number, slot, timestamp, blob_gas_price AS "blobGasPrice"
          FROM block
          WHERE 
            timestamp <= (NOW() - INTERVAL '24 hours') AND
            timestamp >= (NOW() - INTERVAL '24 hours 5 minutes')
          ORDER BY timestamp DESC
          LIMIT 1
      );
          `,
      prisma.$queryRaw<PriceQuery>`
       (
          SELECT *
          FROM eth_usd_price
          WHERE timestamp <= NOW()
          ORDER BY timestamp DESC
          LIMIT 1
      )
      UNION ALL
      (
          SELECT *
          FROM eth_usd_price
          WHERE
            timestamp <= (NOW() - INTERVAL '24 hours') AND
            timestamp >= (NOW() - INTERVAL '24 hours 5 minutes')
          ORDER BY timestamp DESC
          LIMIT 1
      );
          `,
    ]);

    const [latestPrice, past24hPrice] = ethPricesQuery;
    const [latestBlock, past24hBlock] = blocksQuery;

    return {
      ethPrices: {
        latest: latestPrice
          ? {
              usdPrice: latestPrice.price.toNumber(),
              timestamp: latestPrice.timestamp,
            }
          : null,
        past24h: past24hPrice
          ? {
              usdPrice: past24hPrice.price.toNumber(),
              timestamp: past24hPrice.timestamp,
            }
          : null,
      },
      blocks: {
        latest: latestBlock,
        past24h: past24hBlock,
      },
      syncState: stateQuery[0],
    };
  }
);
