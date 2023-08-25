import type {
  Address,
  Blob,
  BlobDataStorageReference,
  Transaction,
} from "@prisma/client";
import { Prisma } from "@prisma/client";

import { curryPrismaExtensionFnSpan } from "../instrumentation";
import type { OmittableFields } from "../types";

const NOW_SQL = Prisma.sql`NOW()`;

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
      address: {
        upsertAddressesFromTransactions(
          txs: { from: string; to?: string; blockNumber: number }[]
        ) {
          const addressToEntity = txs.reduce<Record<string, Address>>(
            (addressesData, { from, to, blockNumber }) => {
              updateAddressData(addressesData, from, blockNumber, true);

              if (to) {
                updateAddressData(addressesData, to, blockNumber, false);
              }

              return addressesData;
            },
            {}
          );

          const addressEntities = Object.values(addressToEntity);

          return Prisma.getExtensionContext(this).upsertMany(addressEntities);
        },
        upsertMany(addresses: Omit<Address, OmittableFields>[]) {
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
          const dbBlobVersionedHashes = (
            await prisma.blob.findMany({
              select: { versionedHash: true },
              where: {
                versionedHash: {
                  in: blobs.map((blob) => blob.versionedHash),
                },
              },
            })
          ).map((b) => b.versionedHash);
          // Remove duplicates and blobs that already exist in the DB
          const newBlobVersionedHashes = Array.from(
            new Set(blobs.map((b) => b.versionedHash))
          ).filter((hash) => !dbBlobVersionedHashes.includes(hash));

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
        upsertMany(blobs: Omit<Blob, OmittableFields>[]) {
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
        upsertMany(transactions: Omit<Transaction, OmittableFields>[]) {
          const formattedValues = transactions
            .map(
              ({
                hash,
                blockNumber,
                fromId,
                toId,
                maxFeePerBlobGas,
                blobGasPrice,
                gasPrice,
                blobAsCalldataGasUsed,
              }) => [
                hash,
                blockNumber,
                fromId,
                toId,
                maxFeePerBlobGas,
                blobGasPrice,
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
            block_number,
            from_id,
            to_id,
            max_fee_per_blob_gas,
            blob_gas_price,
            gas_price,
            blob_as_calldata_gas_used,
            inserted_at,
            updated_at
          ) VALUES ${Prisma.join(formattedValues)}
          ON CONFLICT ("hash") DO UPDATE SET
            block_number = EXCLUDED.block_number,
            from_id = EXCLUDED.from_id,
            to_id = EXCLUDED.to_id,
            max_fee_per_blob_gas = EXCLUDED.max_fee_per_blob_gas,
            blob_gas_price = EXCLUDED.blob_gas_price,
            gas_price = EXCLUDED.gas_price,
            blob_as_calldata_gas_used = EXCLUDED.blob_as_calldata_gas_used,
            updated_at = NOW()
        `;
        },
      },
    },
  })
);

export type BaseExtendedPrismaClient = ReturnType<typeof baseExtension>;
