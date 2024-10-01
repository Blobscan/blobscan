import type {
  Address as AddressEntity,
  AddressCategoryInfo,
} from "@prisma/client";

import { omitDBTimestampFields } from "@blobscan/test";

import { prisma } from "../prisma";
import type { WithoutTimestampFields } from "../prisma/types";

export async function upsertAndRetrieveManyAddresses(
  input: AddressCategoryInfo[]
) {
  await prisma.address.upsertMany(
    input.map((addr) => ({ address: addr.address }))
  );
  await prisma.addressCategoryInfo.upsertMany(input);

  const addresses = new Set(input.map((addr) => addr.address));

  const addressEntities = await prisma.addressCategoryInfo.findMany({
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
