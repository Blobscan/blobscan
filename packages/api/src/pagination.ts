import { TRPCError } from "@trpc/server";

import { z } from "@blobscan/zod";

export const paginationResponseSchema = z.object({
  nextCursor: z.string().nullable(),
  previousCursor: z.string().nullable(),
});

type Direction = "next" | "previous";
type Sort = "asc" | "desc";
type Position = (string | number | null)[];

const MAX_CURSOR_INTEGER = 2147483647;

const cursorSchema = z
  .object({
    version: z.literal(1),
    direction: z.enum(["next", "previous"]),
    inclusive: z.boolean().default(false),
    position: z.array(
      z.union([
        z.string().max(128),
        z.number().int().nonnegative().max(MAX_CURSOR_INTEGER),
        z.null(),
      ])
    ),
  })
  .strict();

type CursorField<T> = {
  name: keyof T & string;
  type: "string" | "number" | "date";
  nullable?: boolean;
};

export type PageQuery = {
  where: Record<string, unknown>;
  orderBy: Record<string, Sort>[];
  take: number;
};

/** Compare all sort fields so a removed record does not invalidate its position. */
export async function paginate<T extends object>({
  sort = "desc",
  fields,
  cursor,
  limit,
  fetchPage,
  hasPage,
}: {
  sort?: Sort;
  fields: readonly CursorField<T>[];
  cursor?: string;
  limit: number;
  fetchPage: (query: PageQuery) => Promise<T[]>;
  hasPage: (where: Record<string, unknown>) => Promise<boolean>;
}): Promise<{
  items: T[];
  pagination: z.infer<typeof paginationResponseSchema>;
}> {
  let anchor: Position | undefined;
  let direction: Direction = "next";
  let inclusive = false;

  if (cursor !== undefined) {
    try {
      if (!/^[A-Za-z0-9_-]+$/.test(cursor) || cursor.length > 4096)
        throw new Error();
      const decoded = cursorSchema.parse(
        JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"))
      );
      if (decoded.position.length !== fields.length) throw new Error();
      fields.forEach((field, i) => {
        const value = decoded.position[i];
        if (value === null && field.nullable) return;
        if (field.type === "date") {
          if (
            typeof value !== "string" ||
            !Number.isFinite(Date.parse(value)) ||
            new Date(value).toISOString() !== value
          )
            throw new Error();
        } else if (
          typeof value !== field.type ||
          (field.type === "string" && value === "")
        ) {
          throw new Error();
        }
      });
      anchor = decoded.position;
      direction = decoded.direction;
      inclusive = decoded.inclusive;
    } catch {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid cursor.",
      });
    }
  }

  function order(pageDirection: Direction): Sort {
    return pageDirection === "next" ? sort : sort === "asc" ? "desc" : "asc";
  }

  function seek(
    position: Position,
    pageDirection: Direction,
    includeAnchor = false
  ): Record<string, unknown> {
    const ascending = order(pageDirection) === "asc";
    const prefix: Record<string, unknown>[] = [];
    const branches: Record<string, unknown>[] = [];

    fields.forEach((field, i) => {
      const rawValue = position[i];
      const value =
        field.type === "date" && typeof rawValue === "string"
          ? new Date(rawValue)
          : rawValue;
      let comparison: Record<string, unknown> | undefined;

      // PostgreSQL puts nulls last for ASC and first for DESC.
      if (value === null) {
        if (!ascending) comparison = { [field.name]: { not: null } };
      } else {
        comparison = { [field.name]: { [ascending ? "gt" : "lt"]: value } };
        if (ascending && field.nullable) {
          comparison = { OR: [comparison, { [field.name]: null }] };
        }
      }

      if (comparison) branches.push({ AND: [...prefix, comparison] });
      prefix.push({ [field.name]: value });
    });
    if (includeAnchor) branches.push({ AND: prefix });
    const leading = fields[0];
    if (leading && !leading.nullable) {
      const rawValue = position[0];
      const value =
        leading.type === "date" && typeof rawValue === "string"
          ? new Date(rawValue)
          : rawValue;
      // This bound lets the database start at the cursor in the leading index.
      return {
        AND: [
          { [leading.name]: { [ascending ? "gte" : "lte"]: value } },
          { OR: branches },
        ],
      };
    }
    return { OR: branches };
  }

  function positionOf(row: T): Position {
    return fields.map(({ name }) => {
      const value = row[name];
      return value instanceof Date
        ? value.toISOString()
        : (value as string | number | null);
    });
  }

  function encode(
    position: Position,
    pageDirection: Direction,
    includeAnchor = false
  ): string {
    return Buffer.from(
      JSON.stringify({
        version: 1,
        direction: pageDirection,
        position,
        inclusive: includeAnchor,
      })
    ).toString("base64url");
  }

  const rows = await fetchPage({
    where: anchor ? seek(anchor, direction, inclusive) : {},
    orderBy: fields.map(({ name }) => ({ [name]: order(direction) })),
    take: limit + 1,
  });
  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit);
  if (direction === "previous") items.reverse();

  const first = items[0];
  const last = items[items.length - 1];
  const firstPosition = first ? positionOf(first) : anchor;
  const lastPosition = last ? positionOf(last) : anchor;
  const oppositeDirection = direction === "next" ? "previous" : "next";
  const oppositePosition = direction === "next" ? firstPosition : lastPosition;
  const hasOpposite =
    anchor && oppositePosition
      ? await hasPage(
          seek(oppositePosition, oppositeDirection, items.length === 0)
        )
      : false;

  const hasNext = direction === "next" ? hasMore : hasOpposite;
  const hasPrevious = direction === "previous" ? hasMore : hasOpposite;
  return {
    items,
    pagination: {
      nextCursor:
        hasNext && lastPosition
          ? encode(lastPosition, "next", items.length === 0)
          : null,
      previousCursor:
        hasPrevious && firstPosition
          ? encode(firstPosition, "previous", items.length === 0)
          : null,
    },
  };
}
