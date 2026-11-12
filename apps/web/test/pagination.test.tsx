import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Pagination } from "../src/components/Pagination";
import { useCursorPagination } from "../src/hooks/useCursorPagination";
import {
  normalizePaginationParams,
  paginationParamsSchema,
} from "../src/schemas/pagination";

const { router } = vi.hoisted(() => ({
  router: {
    pathname: "/address/[address]",
    query: {} as Record<string, string>,
    push: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock("next/compat/router", () => ({ useRouter: () => router }));

function controls() {
  let result: ReturnType<typeof useCursorPagination>;
  function Harness() {
    result = useCursorPagination(25);
    return null;
  }
  renderToStaticMarkup(<Harness />);
  return result!;
}

beforeEach(() => {
  router.push.mockClear();
  router.query = {
    address: "0x123",
    cursor: "current",
    page: "3",
    ps: "25",
    sort: "asc",
    from: "0x456",
  };
});

describe("cursor navigation", () => {
  it("passes tokens unchanged and preserves the address and filters", () => {
    controls().onChange("previous_token", 2);
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/address/[address]",
      query: { ...router.query, cursor: "previous_token", page: "2" },
    });
  });

  it("removes the cursor and page number when First is selected", () => {
    router.query.p = "10";
    controls().onChange(null);
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/address/[address]",
      query: { address: "0x123", ps: "25", sort: "asc", from: "0x456" },
    });
  });

  it("clears the cursor when the page size changes", () => {
    controls().onPageSizeChange({ value: 100 });
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/address/[address]",
      query: { address: "0x123", ps: "100", sort: "asc", from: "0x456" },
    });
  });

  it("uses the current URL after browser navigation", () => {
    expect(controls().hasCursor).toBe(true);
    expect(controls().currentPage).toBe(3);
    delete router.query.cursor;
    expect(controls().hasCursor).toBe(false);
    expect(controls().currentPage).toBe(1);
    router.query.cursor = "shared_token";
    expect(controls().hasCursor).toBe(true);
    controls().onChange("next_token", 4);
    expect(router.push).toHaveBeenLastCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ cursor: "next_token", page: "4" }),
      })
    );
  });

  it("keeps First available on an empty cursor page", () => {
    const html = renderToStaticMarkup(
      <Pagination
        hasCursor
        pagination={{ nextCursor: null, previousCursor: null }}
        onChange={() => {}}
      />
    );
    const buttons = html.match(/<button\b[^>]*>[\s\S]*?<\/button>/g)!;
    expect(buttons).toHaveLength(3);
    expect(buttons[0]).toContain("First");
    expect(buttons[0]).not.toContain('disabled=""');
    expect(buttons[1]).toContain('disabled=""');
    expect(buttons[2]).toContain('disabled=""');
  });
});

describe("page size route values", () => {
  it.each(["10", "25", "50", "100"])(
    "keeps the preset size %s and cursor",
    (ps) => {
      expect(
        normalizePaginationParams(
          paginationParamsSchema.parse({ ps, cursor: "token", page: "3" })
        )
      ).toEqual({ ps: Number(ps), cursor: "token", page: 3 });
    }
  );

  it.each(["76", "0", "-1", "101", "25.5", "invalid", ""])(
    "uses 50 and clears the cursor for size %j",
    (ps) => {
      expect(
        normalizePaginationParams(
          paginationParamsSchema.parse({ ps, cursor: "token", page: "3" })
        )
      ).toEqual({ ps: 50, cursor: undefined, page: 1 });
      router.query.ps = ps;
      expect(controls().hasCursor).toBe(false);
      expect(controls().currentPage).toBe(1);
    }
  );

  it("uses 50 when the route has no page size", () => {
    expect(normalizePaginationParams(paginationParamsSchema.parse({}))).toEqual(
      { ps: 50, cursor: undefined, page: 1 }
    );
  });
});

describe("page counts", () => {
  it.each([
    [3, 45, 10, "Page 3 of 5"],
    [1, 0, 50, "Page 1 of 1"],
    [1, undefined, 50, "Page 1 of …"],
    [15, 1440, 100, "Page 15 of 15"],
  ] as const)(
    "shows page %s for %s items",
    (currentPage, totalItems, pageSize, expected) => {
      const html = renderToStaticMarkup(
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          hasCursor
          onChange={() => {}}
        />
      );
      expect(html.replace(/<[^>]+>/g, "")).toContain(expected);
    }
  );
});
