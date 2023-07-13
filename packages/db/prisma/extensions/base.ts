import type { Address, Blob, Transaction } from "@prisma/client";
import { Prisma } from "@prisma/client";

export type OmittableFields = "insertedAt" | "updatedAt";

const NOW_SQL = Prisma.sql`NOW()`;

type RawBlob = {
  versionedHash: string;
  commitment: string;
  txHash: string;
  index: number;
  data: string;
};

function updateAddressData(
  addressesData: Record<string, Partial<Address>>,
  address: string,
  isSender: boolean
) {
  const addressData = addressesData[address];

  if (!addressData) {
    addressesData[address] = {
      address,
      isSender,
      isReceiver: !isSender,
    };
  } else {
    if (isSender) {
      addressData.isSender = true;
    } else {
      addressData.isReceiver = true;
    }
  }
}

export const baseExtension = Prisma.defineExtension((prisma) =>
  prisma.$extends({
    name: "Base Extension",
    model: {
      address: {
        upsertAddressesFromTransactions(txs: { from: string; to?: string }[]) {
          // Get the unique from/to addresses from the transactions
          const addressToEntity = txs.reduce<Record<string, Address>>(
            (addressesData, { from, to }) => {
              updateAddressData(addressesData, from, true);

              if (to) {
                updateAddressData(addressesData, to, false);
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
            .map(({ address, isSender, isReceiver }) => [
              address,
              isSender,
              isReceiver,
              NOW_SQL,
              NOW_SQL,
            ])
            .map((rowColumns) => Prisma.sql`(${Prisma.join(rowColumns)})`);

          return prisma.$executeRaw`
            INSERT INTO "Address" as addr (
              "address",
              "isSender",
              "isReceiver",
              "insertedAt",
              "updatedAt"
            ) VALUES ${Prisma.join(formattedValues)}
            ON CONFLICT ("address") DO UPDATE SET
              "isSender" = addr."isSender" OR EXCLUDED."isSender",
              "isReceiver" = addr."isReceiver" OR EXCLUDED."isReceiver",
              "updatedAt" = NOW()
          `;
        },
      },
      blob: {
        async filterNewBlobs(blobs: RawBlob[]) {
          const existingBlobVersionedHashes = (
            await prisma.blob.findMany({
              select: { versionedHash: true },
              where: {
                id: { in: blobs.map((blob) => blob.versionedHash) },
              },
            })
          ).map((b) => b.versionedHash);

          return blobs.filter(
            (b) => !existingBlobVersionedHashes.includes(b.versionedHash)
          );
        },
        upsertMany(blobs: Omit<Blob, OmittableFields>[]) {
          const formattedValues = blobs
            .map(
              ({ versionedHash, commitment, gsUri, id, size, swarmHash }) => [
                id,
                versionedHash,
                commitment,
                size,
                gsUri,
                swarmHash,
              ]
            )
            .map(
              (rowColumns) =>
                Prisma.sql`(${Prisma.join(rowColumns)}, ${NOW_SQL}, ${NOW_SQL})`
            );

          return prisma.$executeRaw`
            INSERT INTO "Blob" as blob (
              "id",
              "versionedHash",
              "commitment",
              "size",
              "gsUri",
              "swarmHash",
              "insertedAt",
              "updatedAt"
            ) VALUES ${Prisma.join(formattedValues)}
            ON CONFLICT ("versionedHash") DO UPDATE SET
              "commitment" = EXCLUDED."commitment",
              "size" = EXCLUDED."size",
              "gsUri" = EXCLUDED."gsUri",
              "swarmHash" = EXCLUDED."swarmHash",
              "updatedAt" = NOW()
          `;
        },
      },
      transaction: {
        upsertMany(transactions: Omit<Transaction, OmittableFields>[]) {
          const formattedValues = transactions
            .map(({ id, hash, blockNumber, fromId, toId }) => [
              id,
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
              "id",
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
