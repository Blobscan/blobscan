export const BATCH_SIZE = 10_000;
export const STORAGE_BATCH_SIZE = 100;

export function buildGoogleStorageUri(hash: string): string {
  return `${process.env.CHAIN_ID}/${hash.slice(2, 4)}/${hash.slice(
    4,
    6
  )}/${hash.slice(6, 8)}/${hash.slice(2)}.txt`;
}

// export async function performBlobStorageOpInBatches(blobs: SeedBlob[]) {
//   const batches = Math.ceil(blobs.length / STORAGE_BATCH_SIZE);

//   for (let i = 0; i < batches; i++) {
//     const start = i * STORAGE_BATCH_SIZE;
//     const end = start + STORAGE_BATCH_SIZE;
//     const batchBlobs = blobs.slice(start, end);

//     await Promise.all(batchBlobs.map((b) => blobStorageManager.storeBlob(b)));
//   }
// }

export function performPrismaOpInBatches<T>(
  elements: T[],
  prismaOp: ({ data }: { data: T[] }) => Promise<{ count: number }>
) {
  const batches = Math.ceil(elements.length / BATCH_SIZE);
  const operations: Promise<{ count: number }>[] = [];

  Array.from({ length: batches }).forEach((_, index) => {
    const start = index * BATCH_SIZE;
    const end = start + BATCH_SIZE;

    operations.push(prismaOp({ data: elements.slice(start, end) }));
  });

  return Promise.all(operations);
}
