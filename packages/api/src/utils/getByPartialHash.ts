import { prisma } from "@blobscan/db";

export async function getFullBlockHash(partialHash: string) {
  const block = await prisma.block.findFirst({
    where: {
      hash: {
        startsWith: partialHash,
      },
    },
    select: {
      hash: true,
    },
  });

  if (!block) {
    return null;
  }

  return block.hash;
}
