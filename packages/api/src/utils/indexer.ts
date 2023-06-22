import { Prisma, type PrismaClient } from "@blobscan/db";

// TODO: get this type from zod somehow
type RequestBlob = {
  versionedHash: string;
  commitment: string;
  txHash: string;
  index: number;
  data: string;
};

export type AddressData = {
  address: string;
  isSender: boolean;
  isReceiver: boolean;
  isUniqueSender: boolean;
  isUniqueReceiver: boolean;
};

function updateAddressData(
  addressesData: Record<string, AddressData>,
  address: string,
  isSender: boolean,
) {
  const addressData = addressesData[address];

  // Treat addresses as unique at fist until demonstrated otherwise
  if (!addressData) {
    addressesData[address] = {
      address,
      isSender: isSender,
      isUniqueSender: isSender,
      isReceiver: !isSender,
      isUniqueReceiver: !isSender,
    };
  } else {
    if (isSender) {
      addressData.isSender = true;

      if (addressData.isUniqueSender) {
        addressData.isUniqueSender = false;
      }
    } else {
      addressData.isReceiver = true;

      if (addressData.isUniqueReceiver) {
        addressData.isUniqueReceiver = false;
      }
    }
  }
}

export async function getDataFromTxsAddresses(
  prisma: PrismaClient,
  txs: { from: string; to?: string }[],
): Promise<AddressData[]> {
  // Get the unique from/to addresses from the transactions
  const addressesData = txs.reduce<Record<string, AddressData>>(
    (addressesData, { from, to }) => {
      updateAddressData(addressesData, from, true);

      if (to) {
        updateAddressData(addressesData, to, false);
      }

      return addressesData;
    },
    {},
  );

  const addressDBEntities = await prisma.address.findMany({
    select: { address: true, isReceiver: true, isSender: true },
    where: {
      address: { in: Object.keys(addressesData) },
      AND: {
        OR: {
          isReceiver: false,
          isSender: false,
        },
      },
    },
  });

  // Update the unique from/to addresses given the existing stored addresses
  addressDBEntities.forEach((addressEntity) => {
    const addressData = addressesData[addressEntity.address];

    if (!addressData) {
      return;
    }

    addressData.address = addressEntity.address;
    addressData.isUniqueReceiver = !addressEntity.isReceiver;
    addressData.isUniqueSender = !addressEntity.isSender;
  });

  return Object.values(addressesData);
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

export function upsertAddresses(
  prisma: PrismaClient,
  addressEntities: AddressData[],
) {
  const formattedValues = addressEntities
    .map(({ address, isSender, isReceiver }) => [address, isSender, isReceiver])
    .map((rowColumns) => Prisma.sql`(${Prisma.join(rowColumns)})`);

  return prisma.$executeRaw`
    INSERT INTO "Address" as addr (
      "address",
      "isSender",
      "isReceiver"
    ) VALUES ${Prisma.join(formattedValues)}
    ON CONFLICT ("address") DO UPDATE SET
      "isSender" = addr."isSender" OR EXCLUDED."isSender",
      "isReceiver" = addr."isReceiver" OR EXCLUDED."isReceiver"
  `;
}
