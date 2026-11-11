import { Prisma } from "@blobscan/db";
import { z } from "@blobscan/zod";

/**
 * The direction of an adjacent item (block, transaction or blob) from the
 * current item.
 */
export const adjacentDirectionSchema = z.enum(["prev", "next"]);

export type AdjacentDirection = z.infer<typeof adjacentDirectionSchema>;

/**
 * Returns the SQL comparison operator and the sort order that a keyset query
 * uses to get the adjacent row in the given direction:
 * - `prev`: `<` and `DESC`
 * - `next`: `>` and `ASC`
 */
export function adjacentSqlParts(direction: AdjacentDirection) {
  return {
    operator: Prisma.raw(direction === "prev" ? "<" : ">"),
    order: Prisma.raw(direction === "prev" ? "DESC" : "ASC"),
  };
}
