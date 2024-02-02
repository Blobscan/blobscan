import type { Address as AddressEntity } from "@prisma/client";

import { omitDBTimestampFields } from "@blobscan/test";

import type { WithoutTimestampFields } from "../../prisma";
import { prisma } from "../../prisma";

export type UpsertAddrFromTxsInput = Parameters<
  typeof prisma.address.upsertAddressesFromTransactions
>[0];

export async function upsertAndretrieveAddressesFromTxs(
  input: UpsertAddrFromTxsInput
) {
  await prisma.address.upsertAddressesFromTransactions(input);

  const addresses = new Set(input.flatMap((tx) => [tx.from, tx.to]));

  const addressEntities = await prisma.address.findMany({
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

export async function upsertAndRetrieveManyAddresses(
  input: WithoutTimestampFields<AddressEntity>[]
) {
  await prisma.address.upsertMany(input);

  const addresses = new Set(input.map((addr) => addr.address));

  const addressEntities = await prisma.address.findMany({
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
