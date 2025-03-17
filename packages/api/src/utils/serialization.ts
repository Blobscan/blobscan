import { Prisma } from "@blobscan/db";
import { dbEnumSchema } from "@blobscan/db/prisma/zod-utils";
import type { DBEnum } from "@blobscan/db/prisma/zod-utils";

export type Serialized<T> = T extends DBEnum
  ? Lowercase<T>
  : T extends Prisma.Decimal | Date | bigint
  ? string
  : T extends Array<infer U>
  ? Array<Serialized<U>>
  : T extends object
  ? { [K in keyof T]: Serialized<T[K]> }
  : T;

export function serialize<T>(v: T): Serialized<T> {
  if (typeof v === "bigint") {
    return v.toString() as Serialized<T>;
  }
  if (v instanceof Prisma.Decimal) {
    return v.toFixed() as Serialized<T>;
  }
  if (v instanceof Date) {
    return v.toISOString() as Serialized<T>;
  }
  if (Array.isArray(v)) {
    return v.map((item) => serialize(item)) as Serialized<T>;
  }
  if (v && typeof v === "object") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = {};
    for (const [key, value] of Object.entries(v)) {
      result[key] = serialize(value);
    }
    return result;
  }
  const res = dbEnumSchema.safeParse(v);

  if (res.success) {
    return res.data.toLowerCase() as Serialized<T>;
  }

  return v as Serialized<T>;
}
