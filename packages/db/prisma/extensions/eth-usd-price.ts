import type { EthUsdPrice } from "@prisma/client";
import { Prisma } from "@prisma/client";

import { curryPrismaExtensionFnSpan } from "../instrumentation";
import type { BlockId, BlockIdField } from "../zod-utils";
import {
  blobCommitmentSchema,
  blobVersionedHashSchema,
  parsedBlockIdSchema,
} from "../zod-utils";

const startExtensionFnSpan = curryPrismaExtensionFnSpan("eth-usd-price");

const startBlockModelFnSpan = startExtensionFnSpan("block");

export const ethUsdPriceExtension = Prisma.defineExtension((prisma) =>
  prisma.$extends({
    name: "Eth Usd Price",
    model: {
      blob: {
        findEthUsdPrices(blobId: string) {
          let whereClause: Prisma.Sql;
          const isCommitment = blobCommitmentSchema.safeParse(blobId);
          const isVersionedHash = blobVersionedHashSchema.safeParse(blobId);

          if (!isCommitment || !isVersionedHash) {
            throw new Error(
              `Couldn't retrieve ETH/USD price for blob: id "${blobId}" is not a valid versioned hash nor commitment.`
            );
          }

          if (isCommitment) {
            whereClause = Prisma.sql`b.versioned_hash = ${blobId}`;
          } else {
            whereClause = Prisma.sql`b.commitment = ${blobId}`;
          }

          return prisma.$queryRaw<EthUsdPrice[]>`
            SELECT p.id, p.price, p.timestamp
            FROM blob b join blobs_on_transactions btx on b.versioned_hash = btx.blob_hash join eth_usd_price p on DATE_TRUNC('minute', btx.block_timestamp) = p.timestamp
            WHERE ${whereClause}
            ORDER BY btx.block_timestamp DESC
          `;
        },
      },
      block: {
        findEthUsdPrice(blockIdOrBlockIdField: BlockId | BlockIdField) {
          let blockIdField: BlockIdField;

          if (typeof blockIdOrBlockIdField === "object") {
            blockIdField = blockIdOrBlockIdField;
          } else {
            const res = parsedBlockIdSchema.safeParse(blockIdOrBlockIdField);

            if (!res.success) {
              throw new Error(
                `Couldn't retrieve ETH/USD price for block: id "${blockIdOrBlockIdField}" is invalid`
              );
            }

            blockIdField = res.data;
          }

          const { type, value } = blockIdField;
          let whereClause: Prisma.Sql = Prisma.empty;
          let orderBy: Prisma.Sql = Prisma.empty;

          switch (type) {
            case "hash": {
              whereClause = Prisma.sql`WHERE b.hash = ${value}`;
              break;
            }
            case "number": {
              whereClause = Prisma.sql`WHERE b.number = ${value}`;
              break;
            }
            case "slot": {
              whereClause = Prisma.sql`WHERE b.slot = ${value}`;
              break;
            }
            case "label": {
              const sortDirection =
                value === "latest" ? Prisma.sql`DESC` : Prisma.sql`ASC`;

              orderBy = Prisma.sql`ORDER BY b.number ${sortDirection} LIMIT 1`;
              break;
            }
          }

          return startBlockModelFnSpan("findEthUsdPrice", async () => {
            const ethUsdPrice = await prisma.$queryRaw<EthUsdPrice[]>`
              SELECT p.id, p.price, p.timestamp
              FROM block b left join eth_usd_price p on DATE_TRUNC('minute', b.timestamp) = p.timestamp
              ${whereClause}
              ${orderBy}
            `;

            return ethUsdPrice[0];
          });
        },

        findAdjacentEthUsdPrice(
          blockNumber: number,
          direction: "next" | "prev"
        ) {
          return startBlockModelFnSpan("firndAdjacentEthUsdPrice", async () => {
            const whereClause =
              direction === "next"
                ? Prisma.sql`WHERE b.number > ${blockNumber}`
                : Prisma.sql`WHERE b.number < ${blockNumber}`;
            const sortDirection =
              direction === "next" ? Prisma.sql`ASC` : Prisma.sql`DESC`;
            const orderByClause = Prisma.sql`ORDER BY b.number ${sortDirection}`;

            const ethUsdPrice = await prisma.$queryRaw<EthUsdPrice[]>`
              SELECT p.id, p.price, p.timestamp
              FROM block b left join eth_usd_price p on DATE_TRUNC('minute', b.timestamp) = p.timestamp
              ${whereClause}
              ${orderByClause}
              LIMIT 1
            `;

            return ethUsdPrice[0];
          });
        },
      },
      transaction: {
        async findEthUsdPrice(txHash: string) {
          const ethUsdPrice = await prisma.$queryRaw<EthUsdPrice[]>`
              SELECT p.id, p.price, p.timestamp
              FROM transaction tx left join eth_usd_price p on DATE_TRUNC('minute', tx.block_timestamp) = p.timestamp
              WHERE tx.hash = ${txHash}
            `;

          return ethUsdPrice[0];
        },
      },
    },
  })
);
