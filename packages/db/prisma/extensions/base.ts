/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  Address,
  AddressHistory,
  Blob,
  BlobDataStorageReference,
  BlobsOnTransactions,
  PrismaPromise,
  Transaction,
} from "@prisma/client";
import { Prisma } from "@prisma/client";

import { curryPrismaExtensionFnSpan } from "../instrumentation";
import type { WithoutTimestampFields } from "../types";

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
            .map(({ address }) => [address, NOW_SQL, NOW_SQL])
            .map((rowColumns) => Prisma.sql`(${Prisma.join(rowColumns)})`);

          return prisma.$executeRaw`
            INSERT INTO address (
              address,
              inserted_at,
              updated_at
            ) VALUES ${Prisma.join(formattedValues)}
            ON CONFLICT (address) DO UPDATE SET
              updated_at = NOW()
          `;
        },
      },
      addressHistory: {
        upsertMany(addressEntries: AddressHistory[]) {
          if (!addressEntries.length) {
            return (
              Prisma.getExtensionContext(this) as any
            ).zero() as PrismaPromise<ZeroOpResult>;
          }

          const formattedValues = addressEntries
            .map(
              ({
                address,
                category,
                firstBlockNumberAsReceiver,
                firstBlockNumberAsSender,
              }) => [
                address,
                Prisma.sql`${category.toLowerCase()}::category`,
                firstBlockNumberAsReceiver,
                firstBlockNumberAsSender,
              ]
            )
            .map((rowColumns) => Prisma.join(rowColumns, ",", "(", ")"));

          return prisma.$executeRaw`
            INSERT INTO address_history AS curr (
              address,
              category,
              first_block_number_as_receiver,
              first_block_number_as_sender
            ) VALUES ${Prisma.join(formattedValues)}
            ON CONFLICT (address, category) DO UPDATE SET
              first_block_number_as_receiver = LEAST(curr.first_block_number_as_receiver, EXCLUDED.first_block_number_as_receiver),
              first_block_number_as_sender = LEAST(curr.first_block_number_as_sender, EXCLUDED.first_block_number_as_sender)
          `;
        },
      },
      blob: {
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
                firstBlockNumber,
              }) => [versionedHash, commitment, proof, size, firstBlockNumber]
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
              first_block_number,
              inserted_at,
              updated_at
            ) VALUES ${Prisma.join(formattedValues)}
            ON CONFLICT (versioned_hash) DO UPDATE SET
              commitment = EXCLUDED.commitment,
              proof = EXCLUDED.proof,
              size = EXCLUDED.size,
              first_block_number = LEAST(b.first_block_number, EXCLUDED.first_block_number),
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
              }) =>
                Prisma.join([
                  blobHash,
                  blockHash,
                  blockNumber,
                  Prisma.sql`${blockTimestamp}::timestamp`,
                  index,
                  txHash,
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
              tx_hash
            ) VALUES ${Prisma.join(sqlValues)}
            ON CONFLICT (tx_hash, index) DO UPDATE SET
              block_hash = EXCLUDED.block_hash,
              block_number = EXCLUDED.block_number,
              block_timestamp = EXCLUDED.block_timestamp,
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
                category,
                rollup,
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
                Prisma.sql`${category.toLowerCase()}::category`,
                rollup
                  ? Prisma.sql`${rollup.toLowerCase()}::rollup`
                  : Prisma.sql`NULL`,
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
              category,
              rollup,
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
              category = EXCLUDED.category,
              rollup = EXCLUDED.rollup,
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
