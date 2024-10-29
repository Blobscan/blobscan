import { prisma } from "@blobscan/db";

export async function getFullBlockHash(partialHash: string): Promise<string | null> {
  const block = await prisma.block.findFirst({
    where: {
      hash: {
        startsWith: hash,
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
