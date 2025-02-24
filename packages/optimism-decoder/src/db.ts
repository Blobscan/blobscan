import { prisma } from "@blobscan/db";

import type { OptimismDecodedData } from "./decoder";

export function saveDecodedOptimismDataToDB({
  hash,
  data,
}: {
  hash: string;
  data: OptimismDecodedData;
}) {
  return prisma.transaction.update({
    where: {
      hash,
      //rollup: "OPTIMISM",
    },
    data: {
      decodedFields: data,
    },
  });
}
