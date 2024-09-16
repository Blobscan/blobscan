import type { Address as AddressEntity, AddressHistory } from "@prisma/client";

import { omitDBTimestampFields } from "@blobscan/test";

import { prisma } from "../../prisma";
import type { WithoutTimestampFields } from "../../prisma/types";

export async function upsertAndRetrieveManyAddresses(input: AddressHistory[]) {
  await prisma.address.upsertMany(
    input.map((addr) => ({ address: addr.address }))
  );
  await prisma.addressHistory.upsertMany(input);

  const addresses = new Set(input.map((addr) => addr.address));

  const addressEntities = await prisma.addressHistory.findMany({
    where: {
      address: {
        in: Array.from(addresses),
      },
    },
    orderBy: {
      address: "asc",
    },
  });

  return addressEntities.reduce<
    Record<string, WithoutTimestampFields<AddressEntity>>
  >(
    (addressToEntity, addressEntity) => ({
      ...addressToEntity,
      [addressEntity.address]: omitDBTimestampFields(addressEntity),
    }),
    {} as Record<string, AddressEntity>
  );
}
