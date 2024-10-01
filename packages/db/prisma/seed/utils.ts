export const BATCH_SIZE = 30_000;
export const UPSERT_MANY_BATCH_SIZE = 5_000;
export const STORAGE_BATCH_SIZE = 100;

export function buildGoogleStorageUri(hash: string): string {
  return `${process.env.CHAIN_ID}/${hash.slice(2, 4)}/${hash.slice(
    4,
    6
  )}/${hash.slice(6, 8)}/${hash.slice(2)}.txt`;
}

export function performPrismaOpInBatches<T>(
  elements: T[],
  prismaOp: ({
    data,
    skipDuplicates,
  }: {
    data: T[];
    skipDuplicates: boolean;
  }) => Promise<{ count: number }>
) {
  const batches = Math.ceil(elements.length / BATCH_SIZE);
  const operations: Promise<{ count: number }>[] = [];

  Array.from({ length: batches }).forEach((_, index) => {
    const start = index * BATCH_SIZE;
    const end = start + BATCH_SIZE;

    operations.push(
      prismaOp({ data: elements.slice(start, end), skipDuplicates: true })
    );
  });

  return Promise.all(operations);
}

export function performPrismaUpsertManyInBatches<T>(
  elements: T[],
  prismaOp: (data: T[]) => Promise<unknown>
) {
  const batches = Math.ceil(elements.length / UPSERT_MANY_BATCH_SIZE);
  const operations: Promise<unknown>[] = [];

  Array.from({ length: batches }).forEach((_, index) => {
    const start = index * UPSERT_MANY_BATCH_SIZE;
    const end = start + UPSERT_MANY_BATCH_SIZE;

    const elementsSlice = elements.slice(start, end);

    if (elementsSlice.length) {
      operations.push(prismaOp(elementsSlice));
    }
  });

  return Promise.all(operations);
}
