import { Prisma } from "@blobscan/db";
import { dbEnumSchema } from "@blobscan/db/prisma/zod-utils";
import type {
  DBEnum,
  optimismDecodedFieldsSchema,
} from "@blobscan/db/prisma/zod-utils";
import type { z } from "@blobscan/zod";

import type { ExtendedBlobDataStorageReference } from "../routers/blob/helpers";
import type { PrismaTransaction } from "../zod-schemas";
import { hasProperties } from "./identifiers";

export type Normalized<T> = T extends DBEnum
  ? Lowercase<T>
  : T extends Date
  ? Date
  : T extends Prisma.Decimal
  ? bigint
  : T extends Array<infer U>
  ? Array<Normalized<U>>
  : T extends object
  ? { [K in keyof T]: Normalized<T[K]> }
  : T;

export function normalize<T>(v: T): Normalized<T> {
  if (v instanceof Prisma.Decimal) {
    return BigInt(v.toFixed()) as Normalized<T>;
  }

  if (v instanceof Date) {
    return v as Normalized<T>;
  }

  if (Array.isArray(v)) {
    return v.map((item) => normalize(item)) as Normalized<T>;
  }
  if (v && typeof v === "object") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = {};
    for (const [key, value] of Object.entries(v)) {
      result[key] = normalize(value);
    }
    return result;
  }
  const res = dbEnumSchema.safeParse(v);

  if (res.success) {
    return res.data.toLowerCase() as Normalized<T>;
  }

  return v as Normalized<T>;
}

export function normalizePrismaTransactionFields({
  from,
  fromId,
  toId,
  decodedFields,
}: Pick<PrismaTransaction, "from" | "fromId" | "toId" | "decodedFields">) {
  return {
    category: from.category,
    rollup: from.rollup,
    from: fromId,
    to: toId,
    decodedFields:
      decodedFields && hasProperties(decodedFields)
        ? (decodedFields as z.output<typeof optimismDecodedFieldsSchema>)
        : null,
  };
}

export function normalizePrismaBlobDataStorageReferencesFields(
  dataStorageReferences: ExtendedBlobDataStorageReference[]
) {
  return dataStorageReferences.map(({ blobStorage, url }) => ({
    storage: blobStorage,
    url,
  }));
}
