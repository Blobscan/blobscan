import { prisma } from "@blobscan/db";

/* Autocomplete a block hash from a truncated version of it.
   @param partialHash - The first bytes of a block hash.
   @returns The block hash, if there is a single ocurrence, or null.
 */
export async function autocompleteBlockHash(partialHash: string) {
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
