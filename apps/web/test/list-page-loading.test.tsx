import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Blobs from "../src/pages/blobs";
import Blocks from "../src/pages/blocks";
import Txs from "../src/pages/txs";

const state = vi.hoisted(() => ({ ready: false, resolved: false }));

vi.mock("~/hooks/useListPageParams", () => ({
  useListPageParams: () => ({
    pagination: { ps: 50 },
    filterParams: {},
    sort: "desc",
    isReady: state.ready,
  }),
}));
vi.mock("~/hooks/useChain", () => ({ useChain: () => ({}) }));
vi.mock("~/hooks/useCursorPagination", () => ({
  useCursorPagination: () => ({ currentPage: 1, hasCursor: false }),
}));
vi.mock("~/api-client", () => {
  function useListQuery(_input: unknown, options: { enabled: boolean }) {
    return useQuery({
      queryKey: ["list"],
      queryFn: () => new Promise(() => {}),
      enabled: options.enabled,
      initialData: state.resolved
        ? { blobs: [], blocks: [], transactions: [] }
        : undefined,
    });
  }
  const endpoint = {
    getAllByCursor: { useQuery: useListQuery },
    getCount: { useQuery: () => ({}) },
  };
  return { api: { blob: endpoint, block: endpoint, tx: endpoint } };
});
vi.mock("~/pages/_error", () => ({ default: () => null }));
vi.mock("~/components/EmptyState", () => ({
  EmptyState: () => <div>Empty result</div>,
}));
vi.mock("~/components/Cards/Card", () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("~/components/Table", () => ({
  Table: ({ rows }: { rows?: { cells: { item: React.ReactNode }[] }[] }) => (
    <div>
      {rows?.map((row, i) => (
        <div key={i}>
          {row.cells.map((cell, j) => (
            <span key={j}>{cell.item}</span>
          ))}
        </div>
      ))}
    </div>
  ),
}));
vi.mock("~/components/Pagination", () => ({ Pagination: () => null }));
vi.mock("~/components/Selectors/PageSizeSelector", () => ({
  PageSizeSelector: () => null,
}));
vi.mock("~/components/Badges/CountBadge", () => ({ CountBadge: () => null }));
vi.mock("~/components/Badges/RollupBadge", () => ({ RollupBadge: () => null }));
vi.mock("~/components/Badges/StorageBadge", () => ({
  StorageBadge: () => null,
}));
vi.mock("~/components/ControlBars/ListControlBar", () => ({
  ListControlBar: () => null,
}));
vi.mock("~/components/Copyable", () => ({ Copyable: () => null }));
vi.mock("~/components/Displays/BlobUsageDisplay", () => ({
  BlobUsageDisplay: () => null,
}));
vi.mock("~/components/Header", () => ({ Header: () => null }));
vi.mock("~/components/Link", () => ({ Link: () => null }));
vi.mock("~/components/SeoMetaTags", () => ({ SeoMetaTags: () => null }));
vi.mock("~/components/Toggles", () => ({ TimestampToggle: () => null }));
vi.mock("~/components/TransactionBlobsTable", () => ({
  TransactionBlobsTable: () => null,
}));
vi.mock("~/components/Displays/BlobGasUsageDisplay", () => ({
  BlobGasUsageDisplay: () => null,
}));

beforeEach(() => {
  state.ready = false;
  state.resolved = false;
});

describe.each([
  { name: "blobs", Page: Blobs },
  { name: "transactions", Page: Txs },
  { name: "blocks", Page: Blocks },
])("$name page loading", ({ Page }) => {
  function render() {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const html = renderToStaticMarkup(
      <QueryClientProvider client={client}>
        <Page />
      </QueryClientProvider>
    );
    client.clear();
    return html;
  }

  it("shows skeletons before the URL parameters are ready", () => {
    const html = render();
    expect(html).not.toContain("Empty result");
    expect(html).toContain("react-loading-skeleton");
  });

  it("shows skeletons during the first request", () => {
    state.ready = true;
    const html = render();
    expect(html).not.toContain("Empty result");
    expect(html).toContain("react-loading-skeleton");
  });

  it("shows the empty state after an empty result", () => {
    state.ready = true;
    state.resolved = true;
    const html = render();
    expect(html).toContain("Empty result");
    expect(html).not.toContain("react-loading-skeleton");
  });
});
