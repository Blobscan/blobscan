import type {
  Address,
  Blob,
  BlobDataStorageReference,
  Transaction,
} from "@prisma/client";
import { Prisma } from "@prisma/client";

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
            INSERT INTO "Address" as addr (
              "address",
              "firstBlockNumberAsSender",
              "firstBlockNumberAsReceiver",
              "insertedAt",
              "updatedAt"
            ) VALUES ${Prisma.join(formattedValues)}
            ON CONFLICT ("address") DO UPDATE SET
              "firstBlockNumberAsSender" = LEAST(addr."firstBlockNumberAsSender", EXCLUDED."firstBlockNumberAsSender"),
              "firstBlockNumberAsReceiver" = LEAST(addr."firstBlockNumberAsReceiver", EXCLUDED."firstBlockNumberAsReceiver"),
              "updatedAt" = NOW()
          `;
        },
      },
      blob: {
        async filterNewBlobs(
          blobs: RawBlob[]
        ): Promise<Omit<RawBlob, "index">[]> {
          const dbBlobVersionedHashes = (
            await prisma.blob.findMany({
              select: { versionedHash: true },
              where: {
                versionedHash: { in: blobs.map((blob) => blob.versionedHash) },
              },
            })
          ).map((b) => b.versionedHash);
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
            INSERT INTO "Blob" as blob (
              "versionedHash",
              "commitment",
              "size",
              "firstBlockNumber",
              "insertedAt",
              "updatedAt"
            ) VALUES ${Prisma.join(formattedValues)}
            ON CONFLICT ("versionedHash") DO UPDATE SET
              "commitment" = EXCLUDED."commitment",
              "size" = EXCLUDED."size",
              "firstBlockNumber" = LEAST(blob."firstBlockNumber", EXCLUDED."firstBlockNumber"),
              "updatedAt" = NOW()
          `;
        },
      },
      blobDataStorageReference: {
        upsertMany(refs: BlobDataStorageReference[]) {
          const formattedValues = refs.map(
            ({ blobHash, blobStorage, dataReference }) =>
              Prisma.sql`(${Prisma.join([
                blobHash,
                Prisma.sql`${blobStorage.toLowerCase()}::"BlobStorage"`,
                dataReference,
              ])})`
          );

          return prisma.$executeRaw`
            INSERT INTO "BlobDataStorageReference" (
              "blobHash",
              "blobStorage",
              "dataReference"
            )
            VALUES ${Prisma.join(formattedValues)}
            ON CONFLICT ("blobHash", "blobStorage") DO UPDATE SET
              "dataReference" = EXCLUDED."dataReference"
          `;
        },
      },
      block: {
        findLatest() {
          return prisma.block.findFirst({
            orderBy: { number: "desc" },
          });
        },
      },
      transaction: {
        upsertMany(transactions: Omit<Transaction, OmittableFields>[]) {
          const formattedValues = transactions
            .map(({ hash, blockNumber, fromId, toId }) => [
              hash,
              blockNumber,
              fromId,
              toId,
            ])
            .map(
              (rowColumns) =>
                Prisma.sql`(${Prisma.join(rowColumns)}, ${NOW_SQL}, ${NOW_SQL})`
            );

          return prisma.$executeRaw`
            INSERT INTO "Transaction" (
              "hash",
              "blockNumber",
              "fromId",
              "toId",
              "insertedAt",
              "updatedAt"
            ) VALUES ${Prisma.join(formattedValues)}
            ON CONFLICT ("hash") DO UPDATE SET
              "blockNumber" = EXCLUDED."blockNumber",
              "fromId" = EXCLUDED."fromId",
              "toId" = EXCLUDED."toId",
              "updatedAt" = NOW()
          `;
        },
      },
    },
  })
);

export type BaseExtendedPrismaClient = ReturnType<typeof baseExtension>;
