import type { AddressCategoryInfo } from "@prisma/client";

import { prisma } from "../prisma";

export async function upsertAndRetrieveManyAddresses(
  input: Omit<AddressCategoryInfo, "id">[]
) {
  await prisma.address.upsertMany(
    input.map((addr) => ({ address: addr.address, rollup: null }))
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

  return addressEntities.map(({ id: _, ...addressEntity }) => addressEntity);
}
