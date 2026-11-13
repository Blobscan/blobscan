import { describe, expect, it, vi } from "vitest";

import { paginate } from "../src/pagination";

function encodeCursor(direction: "next" | "previous", position = 3) {
  return Buffer.from(
    JSON.stringify({
      version: 1,
      direction,
      position: [position],
      inclusive: false,
    })
  ).toString("base64url");
}

function decodeCursor(cursor: string | null) {
  return cursor
    ? JSON.parse(Buffer.from(cursor, "base64url").toString())
    : null;
}

describe("cursor page availability", () => {
  it.each(["asc", "desc"] as const)(
    "has no previous page without a cursor in %s order",
    async (sort) => {
      const fetchPage = vi
        .fn()
        .mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);
      const page = await paginate({
        sort,
        fields: [{ name: "id", type: "number" }],
        limit: 2,
        fetchPage,
      });
      expect(page.items).toEqual([{ id: 1 }, { id: 2 }]);
      expect(page.pagination.previousCursor).toBeNull();
      expect(decodeCursor(page.pagination.nextCursor)).toMatchObject({
        direction: "next",
        position: [2],
      });
      expect(fetchPage).toHaveBeenCalledExactlyOnceWith({
        where: {},
        orderBy: [{ id: sort }],
        take: 3,
      });
    }
  );

  it.each(["asc", "desc"] as const)(
    "infers the opposite page from the cursor in %s order",
    async (sort) => {
      for (const direction of ["next", "previous"] as const) {
        const fetchPage = vi.fn().mockResolvedValue([{ id: 2 }, { id: 1 }]);
        const page = await paginate({
          sort,
          fields: [{ name: "id", type: "number" }],
          limit: 2,
          cursor: encodeCursor(direction),
          fetchPage,
        });
        const opposite = direction === "next" ? "previous" : "next";
        expect(page.items).toEqual(
          direction === "next" ? [{ id: 2 }, { id: 1 }] : [{ id: 1 }, { id: 2 }]
        );
        expect(page.pagination[`${direction}Cursor`]).toBeNull();
        expect(
          decodeCursor(page.pagination[`${opposite}Cursor`])
        ).toMatchObject({
          direction: opposite,
          position: [2],
          inclusive: false,
        });
        expect(fetchPage).toHaveBeenCalledTimes(1);
      }
    }
  );

  it.each(["next", "previous"] as const)(
    "uses the extra row for another page in the %s direction",
    async (direction) => {
      const fetchPage = vi
        .fn()
        .mockResolvedValue([{ id: 2 }, { id: 1 }, { id: 0 }]);
      const page = await paginate({
        fields: [{ name: "id", type: "number" }],
        limit: 2,
        cursor: encodeCursor(direction),
        fetchPage,
      });
      expect(page.items).toHaveLength(2);
      expect(page.pagination.nextCursor).not.toBeNull();
      expect(page.pagination.previousCursor).not.toBeNull();
      expect(fetchPage).toHaveBeenCalledTimes(1);
    }
  );

  it.each(["next", "previous"] as const)(
    "keeps recovery available when a %s request returns no rows",
    async (direction) => {
      const fetchPage = vi.fn().mockResolvedValue([]);
      const page = await paginate({
        fields: [{ name: "id", type: "number" }],
        limit: 2,
        cursor: encodeCursor(direction),
        fetchPage,
      });
      const opposite = direction === "next" ? "previous" : "next";
      expect(page.items).toEqual([]);
      expect(page.pagination[`${direction}Cursor`]).toBeNull();
      expect(decodeCursor(page.pagination[`${opposite}Cursor`])).toEqual({
        version: 1,
        direction: opposite,
        position: [3],
        inclusive: true,
      });
      expect(fetchPage).toHaveBeenCalledTimes(1);
    }
  );

  it("returns no cursors for an empty first page", async () => {
    const fetchPage = vi.fn().mockResolvedValue([]);
    const page = await paginate({
      fields: [{ name: "id", type: "number" }],
      limit: 2,
      fetchPage,
    });
    expect(page.items).toEqual([]);
    expect(page.pagination).toEqual({ nextCursor: null, previousCursor: null });
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });
});
