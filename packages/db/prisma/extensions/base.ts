/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  Address,
  Blob,
  BlobDataStorageReference,
  BlobsOnTransactions,
  PrismaPromise,
  Transaction,
  EthUsdPrice,
} from "@prisma/client";
import { Prisma } from "@prisma/client";

import { curryPrismaExtensionFnSpan } from "../instrumentation";
import type { WithoutTimestampFields } from "../types";
import {
  blobCommitmentSchema,
  blobVersionedHashSchema,
  blockHashSchema,
  blockNumberSchema,
} from "../zod-utils";

const NOW_SQL = Prisma.sql`NOW()`;

type ZeroOpResult = { count: number }[];
export type RawBlob = {
  versionedHash: string;
  commitment: string;
  proof: string;
  txHash: string;
  index: number;
  data: string;
};

const startExtensionFnSpan = curryPrismaExtensionFnSpan("base");

const startBlockModelFnSpan = startExtensionFnSpan("block");

export const baseExtension = Prisma.defineExtension((prisma) =>
  prisma.$extends({
    name: "Base Extension",
    model: {
      $allModels: {
        zero() {
          return prisma.$queryRaw<ZeroOpResult>`SELECT 0 as count`;
        },
      },
      address: {
        upsertMany(addresses: WithoutTimestampFields<Address>[]) {
          if (!addresses.length) {
            return (
              Prisma.getExtensionContext(this) as any
            ).zero() as PrismaPromise<ZeroOpResult>;
          }

          const formattedValues = addresses
            .map(
              ({
                address,
                firstBlockNumberAsReceiver,
                firstBlockNumberAsSender,
                rollup,
              }) => [
                address,
                firstBlockNumberAsReceiver,
                firstBlockNumberAsSender,
                rollup
                  ? Prisma.sql`${rollup.toLowerCase()}::rollup`
                  : Prisma.sql`NULL`,
                NOW_SQL,
                NOW_SQL,
              ]
            )
            .map((rowColumns) => Prisma.sql`(${Prisma.join(rowColumns)})`);

          return prisma.$executeRaw`
            INSERT INTO address (
              address,
              first_block_number_as_receiver,
              first_block_number_as_sender,
              rollup,
              inserted_at,
              updated_at
            ) VALUES ${Prisma.join(formattedValues)}
            ON CONFLICT (address) DO UPDATE SET
              first_block_number_as_receiver = LEAST(address.first_block_number_as_receiver, EXCLUDED.first_block_number_as_receiver),
              first_block_number_as_sender = LEAST(address.first_block_number_as_sender, EXCLUDED.first_block_number_as_sender),
              rollup = EXCLUDED.rollup,
              updated_at = NOW()
          `;
        },
      },
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
        upsertMany(blobs: WithoutTimestampFields<Blob>[]) {
          if (!blobs.length) {
            return (
              Prisma.getExtensionContext(this) as any
            ).zero() as PrismaPromise<ZeroOpResult>;
          }

          const formattedValues = blobs
            .map(
              ({
                versionedHash,
                commitment,
                proof,
                size,
                usageSize,
                firstBlockNumber,
              }) => [
                versionedHash,
                commitment,
                proof,
                size,
                usageSize,
                firstBlockNumber,
              ]
            )
            .map(
              (rowColumns) =>
                Prisma.sql`(${Prisma.join(rowColumns)}, ${NOW_SQL}, ${NOW_SQL})`
            );

          return prisma.$executeRaw`
            INSERT INTO blob as b (
              versioned_hash,
              commitment,
              proof,
              size,
              usage_size,
              first_block_number,
              inserted_at,
              updated_at
            ) VALUES ${Prisma.join(formattedValues)}
            ON CONFLICT (versioned_hash) DO UPDATE SET
              commitment = EXCLUDED.commitment,
              proof = EXCLUDED.proof,
              size = EXCLUDED.size,
              usage_size = EXCLUDED.usage_size,
              first_block_number = CASE 
                WHEN b.first_block_number IS NULL THEN EXCLUDED.first_block_number
                ELSE LEAST(b.first_block_number, EXCLUDED.first_block_number)
              END,
              updated_at = NOW()
          `;
        },
      },
      blobsOnTransactions: {
        upsertMany(blobsOnTransactions: BlobsOnTransactions[]) {
          if (!blobsOnTransactions.length) {
            return (
              Prisma.getExtensionContext(this) as any
            ).zero() as PrismaPromise<ZeroOpResult>;
          }

          const sqlValues = blobsOnTransactions
            .map(
              ({
                blobHash,
                blockHash,
                blockNumber,
                blockTimestamp,
                index,
                txHash,
                txIndex,
              }) =>
                Prisma.join([
                  blobHash,
                  blockHash,
                  blockNumber,
                  Prisma.sql`${blockTimestamp}::timestamp`,
                  index,
                  txHash,
                  txIndex,
                ])
            )
            .map((rowColumnsSql) => Prisma.sql`(${rowColumnsSql})`);

          return prisma.$executeRaw`
            INSERT INTO blobs_on_transactions (
              blob_hash,
              block_hash,
              block_number,
              block_timestamp,
              index,
              tx_hash,
              tx_index
            ) VALUES ${Prisma.join(sqlValues)}
            ON CONFLICT (tx_hash, index) DO UPDATE SET
              block_hash = EXCLUDED.block_hash,
              block_number = EXCLUDED.block_number,
              block_timestamp = EXCLUDED.block_timestamp,
              tx_index = EXCLUDED.tx_index,
              index = EXCLUDED.index
          `;
        },
      },
      blobDataStorageReference: {
        upsertMany(refs: BlobDataStorageReference[]) {
          if (!refs.length) {
            return (
              Prisma.getExtensionContext(this) as any
            ).zero() as PrismaPromise<ZeroOpResult>;
          }

          const formattedValues = refs.map(
            ({ blobHash, blobStorage, dataReference }) =>
              Prisma.sql`(${Prisma.join([
                blobHash,
                Prisma.sql`${blobStorage.toLowerCase()}::blob_storage`,
                dataReference,
              ])})`
          );

          return prisma.$executeRaw`
            INSERT INTO blob_data_storage_reference (
              blob_hash,
              storage,
              data_reference
            )
            VALUES ${Prisma.join(formattedValues)}
            ON CONFLICT (blob_hash, storage) DO UPDATE SET
              data_reference = EXCLUDED.data_reference
          `;
        },
      },
      block: {
        findEthUsdPrice(blockId: string | number) {
          let whereClause: Prisma.Sql;
          const isBlockNumber =
            !blockId.toString().startsWith("0x") &&
            blockNumberSchema.safeParse(blockId).success;
          const isBlockHash = blockHashSchema.safeParse(blockId).success;

          if (!isBlockHash && !isBlockNumber) {
            throw new Error(
              `Couldn't retrieve ETH/USD price for block: id "${blockId}" is invalid`
            );
          }

          if (isBlockHash) {
            whereClause = Prisma.sql`b.hash = ${blockId}`;
          } else {
            whereClause = Prisma.sql`b.number = ${blockId}`;
          }

          return startBlockModelFnSpan("findEthUsdPrice", async () => {
            const ethUsdPrice = await prisma.$queryRaw<EthUsdPrice[]>`
              SELECT p.id, p.price, p.timestamp
              FROM block b join eth_usd_price p on DATE_TRUNC('minute', b.timestamp) = p.timestamp
              WHERE ${whereClause}
            `;

            return ethUsdPrice[0];
          });
        },

        findLatest() {
          return startBlockModelFnSpan("findLatest", () => {
            return prisma.block.findFirst({
              where: {
                transactionForks: {
                  none: {},
                },
              },
              orderBy: { number: "desc" },
            });
          });
        },
      },
      transaction: {
        async findEthUsdPrice(txHash: string) {
          const ethUsdPrice = await prisma.$queryRaw<EthUsdPrice[]>`
              SELECT p.id, p.price, p.timestamp
              FROM transaction tx join eth_usd_price p on DATE_TRUNC('minute', tx.block_timestamp) = p.timestamp
              WHERE tx.hash = ${txHash}
            `;

          return ethUsdPrice[0];
        },

        upsertMany(transactions: WithoutTimestampFields<Transaction>[]) {
          if (!transactions.length) {
            return (
              Prisma.getExtensionContext(this) as any
            ).zero() as PrismaPromise<ZeroOpResult>;
          }

          const formattedValues = transactions
            .map(
              ({
                hash,
                blockHash,
                blockNumber,
                blockTimestamp,
                index,
                fromId,
                toId,
                maxFeePerBlobGas,
                gasPrice,
                blobAsCalldataGasUsed,
                blobGasUsed,
              }) => [
                hash,
                blockHash,
                blockNumber,
                Prisma.sql`${blockTimestamp}::timestamp`,
                index,
                fromId,
                toId,
                maxFeePerBlobGas,
                gasPrice,
                blobAsCalldataGasUsed,
                blobGasUsed,
                NOW_SQL,
                NOW_SQL,
              ]
            )
            .map((rowColumns) => Prisma.sql`(${Prisma.join(rowColumns)})`);

          return prisma.$executeRaw`
            INSERT INTO "transaction" (
              "hash",
              block_hash,
              block_number,
              block_timestamp,
              index,
              from_id,
              to_id,
              max_fee_per_blob_gas,
              gas_price,
              blob_as_calldata_gas_used,
              blob_gas_used,
              inserted_at,
              updated_at
            ) VALUES ${Prisma.join(formattedValues)}
            ON CONFLICT ("hash") DO UPDATE SET
              block_hash = EXCLUDED.block_hash,
              block_number = EXCLUDED.block_number,
              block_timestamp = EXCLUDED.block_timestamp,
              index = EXCLUDED.index,
              from_id = EXCLUDED.from_id,
              to_id = EXCLUDED.to_id,
              max_fee_per_blob_gas = EXCLUDED.max_fee_per_blob_gas,
              gas_price = EXCLUDED.gas_price,
              blob_as_calldata_gas_used = EXCLUDED.blob_as_calldata_gas_used,
              blob_gas_used = EXCLUDED.blob_gas_used,
              updated_at = NOW()
          `;
        },
      },
      transactionFork: {
        upsertMany(txForks: { hash: string; blockHash: string }[]) {
          if (!txForks.length) {
            return (
              Prisma.getExtensionContext(this) as any
            ).zero() as PrismaPromise<ZeroOpResult>;
          }

          const formattedValues = txForks
            .map(({ hash, blockHash }) => [hash, blockHash])
            .map(
              (rowColumns) =>
                Prisma.sql`(${Prisma.join(rowColumns)}, ${NOW_SQL}, ${NOW_SQL})`
            );

          return prisma.$executeRaw`
            INSERT INTO transaction_fork (
              "hash",
              block_hash,
              inserted_at,
              updated_at
            ) VALUES ${Prisma.join(formattedValues)}
            ON CONFLICT ("hash", block_hash) DO UPDATE SET
              updated_at = NOW()
          `;
        },
      },
    },
  })
);

export type BaseExtendedPrismaClient = ReturnType<typeof baseExtension>;
