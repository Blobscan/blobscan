import { type Prisma, type PrismaClient } from "@blobscan/db";

// TODO: get this type from zod somehow
type RequestBlob = {
  versionedHash: string;
  commitment: string;
  txHash: string;
  index: number;
  data: string;
};

export type UniqueAddresses = {
  new: Prisma.AddressCreateManyInput[];
  existing: Prisma.AddressUpdateManyMutationInput[];
};

export function getUniqueAddressesFromTxs(
  prisma: PrismaClient,
  txs: { from: string; to?: string }[],
): Promise<{
  uniqueFromAddresses: UniqueAddresses;
  uniqueToAddresses: UniqueAddresses;
}> {
  // Get the unique from/to addresses from the transactions
  const [uniqueTxsFromAddresses, uniqueTxsToAddresses] = txs
    .reduce<[Set<string>, Set<string>]>(
      ([fromAddresses, toAddresses], tx) => {
        fromAddresses.add(tx.from);

        if (tx.to) {
          toAddresses.add(tx.to);
        }

        return [fromAddresses, toAddresses];
      },
      [new Set(), new Set()],
    )
    .map<string[]>(Array.from) as [string[], string[]];

  const uniqueTxsAddresses = [
    ...uniqueTxsFromAddresses,
    ...uniqueTxsToAddresses,
  ];

  return (
    prisma.address
      .findMany({
        select: { address: true, isReceiver: true, isSender: true },
        where: {
          address: { in: uniqueTxsAddresses },
          AND: {
            OR: {
              isReceiver: false,
              isSender: false,
            },
          },
        },
      })
      // Filter out addreses that are already flag as sender/receiver
      .then((addressEntities) => {
        const uniqueFromAddresses: UniqueAddresses = { new: [], existing: [] };
        const uniqueToAddresses: UniqueAddresses = { new: [], existing: [] };

        uniqueTxsFromAddresses.forEach((address) => {
          const addressEntity = addressEntities.find(
            (e) => address === e.address,
          );

          if (addressEntity) {
            if (!addressEntity.isSender) {
              uniqueFromAddresses.existing.push({ address, isSender: true });
            }
          } else {
            uniqueFromAddresses.new.push({
              address,
              isSender: true,
              isReceiver: false,
            });
          }
        });

        uniqueTxsToAddresses.forEach((address) => {
          const addressEntity = addressEntities.find(
            (e) => address === e.address,
          );

          if (addressEntity) {
            if (!addressEntity.isReceiver) {
              uniqueToAddresses.existing.push({ address, isReceiver: true });
            }
          } else {
            uniqueToAddresses.new.push({
              address,
              isReceiver: true,
              isSender: false,
            });
          }
        });

        return {
          uniqueFromAddresses,
          uniqueToAddresses,
        };
      })
  );
}

export async function getNewBlobs(
  prisma: PrismaClient,
  blobs: RequestBlob[],
): Promise<RequestBlob[]> {
  const existingBlobHashes = await prisma.blob
    .findMany({
      select: { versionedHash: true },
      where: {
        id: { in: blobs.map((blob) => blob.versionedHash) },
      },
    })
    .then((blobs) => blobs.map((b) => b.versionedHash));

  return blobs.filter((b) => !existingBlobHashes.includes(b.versionedHash));
}
