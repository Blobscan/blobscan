/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  Address,
  Blob,
  BlobDataStorageReference,
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
  txHash: string;
  index: number;
  data: string;
};

function updateAddressData(
  addressesData: Record<string, Partial<Address>>,
  address: string,
  blockNumber: number,
  isSender: boolean
) {
  const addressData = addressesData[address];
  const firstBlockNumberAsSender = isSender ? blockNumber : null;
  const firstBlockNumberAsReceiver = isSender ? null : blockNumber;

  if (!addressData) {
    addressesData[address] = {
      address,
      firstBlockNumberAsSender,
      firstBlockNumberAsReceiver,
    };
  } else {
    if (isSender) {
      addressData.firstBlockNumberAsSender = firstBlockNumberAsSender;
    } else {
      addressData.firstBlockNumberAsReceiver = firstBlockNumberAsReceiver;
    }
  }
}

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
        upsertAddressesFromTransactions(
          txs: { from: string; to: string; blockNumber: number }[]
        ) {
          const addressToEntity = txs.reduce<Record<string, Address>>(
            (addressesData, { from, to, blockNumber }) => {
              updateAddressData(addressesData, from, blockNumber, true);
              updateAddressData(addressesData, to, blockNumber, false);

              return addressesData;
            },
            {}
          );

          const addressEntities = Object.values(addressToEntity);

          return Prisma.getExtensionContext(this).upsertMany(addressEntities);
        },
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
              }) => [
                address,
                firstBlockNumberAsSender,
                firstBlockNumberAsReceiver,
                NOW_SQL,
                NOW_SQL,
              ]
            )
            .map((rowColumns) => Prisma.sql`(${Prisma.join(rowColumns)})`);

          return prisma.$executeRaw`
            INSERT INTO "address" as addr (
              "address",
              first_block_number_as_sender,
              first_block_number_as_receiver,
              inserted_at,
              updated_at
            ) VALUES ${Prisma.join(formattedValues)}
            ON CONFLICT ("address") DO UPDATE SET
              first_block_number_as_sender = LEAST(addr.first_block_number_as_sender, EXCLUDED.first_block_number_as_sender),
              first_block_number_as_receiver = LEAST(addr.first_block_number_as_receiver, EXCLUDED.first_block_number_as_receiver),
              updated_at = NOW()
          `;
        },
      },
      blob: {
        async filterNewBlobs(blobs: RawBlob[]) {
          const uniqueBlobVersionedHashes = Array.from(
            new Set(blobs.map((b) => b.versionedHash))
          );
          const dbBlobVersionedHashes = (
            await prisma.blob.findMany({
              select: { versionedHash: true },
              where: {
                versionedHash: {
                  in: uniqueBlobVersionedHashes,
                },
              },
            })
          ).map((b) => b.versionedHash);
          // Remove duplicates and blobs that already exist in the DB
          const newBlobVersionedHashes = uniqueBlobVersionedHashes.filter(
            (hash) => !dbBlobVersionedHashes.includes(hash)
          );

          return newBlobVersionedHashes.map((versionedHash) => {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const b = blobs.find((b) => b.versionedHash === versionedHash)!;

            return {
              commitment: b.commitment,
              data: b.data,
              txHash: b.txHash,
              versionedHash: b.versionedHash,
            };
          });
        },
        upsertMany(blobs: WithoutTimestampFields<Blob>[]) {
          if (!blobs.length) {
            return (
              Prisma.getExtensionContext(this) as any
            ).zero() as PrismaPromise<ZeroOpResult>;
          }

          const formattedValues = blobs
            .map(({ versionedHash, commitment, size, firstBlockNumber }) => [
              versionedHash,
              commitment,
              size,
              firstBlockNumber,
            ])
            .map(
              (rowColumns) =>
                Prisma.sql`(${Prisma.join(rowColumns)}, ${NOW_SQL}, ${NOW_SQL})`
            );

          return prisma.$executeRaw`
            INSERT INTO blob as b (
              versioned_hash,
              commitment,
              size,
              first_block_number,
              inserted_at,
              updated_at
            ) VALUES ${Prisma.join(formattedValues)}
            ON CONFLICT (versioned_hash) DO UPDATE SET
              commitment = EXCLUDED.commitment,
              size = EXCLUDED.size,
              first_block_number = LEAST(b.first_block_number, EXCLUDED.first_block_number),
              updated_at = NOW()
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
                fromId,
                toId,
                maxFeePerBlobGas,
                gasPrice,
                blobAsCalldataGasUsed,
              }) => [
                hash,
                blockHash,
                fromId,
                toId,
                maxFeePerBlobGas,
                gasPrice,
                blobAsCalldataGasUsed,
              ]
            )
            .map(
              (rowColumns) =>
                Prisma.sql`(${Prisma.join(rowColumns)}, ${NOW_SQL}, ${NOW_SQL})`
            );

          return prisma.$executeRaw`
            INSERT INTO "transaction" (
              "hash",
              block_hash,
              from_id,
              to_id,
              max_fee_per_blob_gas,
              gas_price,
              blob_as_calldata_gas_used,
              inserted_at,
              updated_at
            ) VALUES ${Prisma.join(formattedValues)}
            ON CONFLICT ("hash") DO UPDATE SET
              block_hash = EXCLUDED.block_hash,
              from_id = EXCLUDED.from_id,
              to_id = EXCLUDED.to_id,
              max_fee_per_blob_gas = EXCLUDED.max_fee_per_blob_gas,
              gas_price = EXCLUDED.gas_price,
              blob_as_calldata_gas_used = EXCLUDED.blob_as_calldata_gas_used,
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
