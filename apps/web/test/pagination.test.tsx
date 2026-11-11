import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Pagination } from "../src/components/Pagination";
import { useCursorPagination } from "../src/hooks/useCursorPagination";

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
    ps: "25",
    sort: "asc",
    from: "0x456",
  };
});

describe("cursor navigation", () => {
  it("passes tokens unchanged and preserves the address and filters", () => {
    controls().onChange("previous_token");
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/address/[address]",
      query: { ...router.query, cursor: "previous_token" },
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
    delete router.query.cursor;
    expect(controls().hasCursor).toBe(false);
    router.query.cursor = "shared_token";
    expect(controls().hasCursor).toBe(true);
    controls().onChange("next_token");
    expect(router.push).toHaveBeenLastCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ cursor: "next_token" }),
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
