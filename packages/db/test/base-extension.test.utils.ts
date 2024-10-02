import type {
  Address as AddressEntity,
  AddressCategoryInfo,
} from "@prisma/client";

import { prisma } from "../prisma";
import type { WithoutTimestampFields } from "../prisma/types";

export async function upsertAndRetrieveManyAddresses(
  input: Omit<AddressCategoryInfo, "id">[]
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
    (addressToEntity, { id: _, ...addressEntity }) => ({
      ...addressToEntity,
      [addressEntity.address]: addressEntity,
    }),
    {} as Record<string, AddressEntity>
  );
}
