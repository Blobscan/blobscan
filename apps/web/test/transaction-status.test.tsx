import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { BlockStatusBadge } from "../src/components/Badges/BlockStatusBadge";
import { StatusBadge } from "../src/components/Badges/StatusBadge";

vi.mock("~/api-client", () => ({
  api: {
    state: {
      getAppState: {
        useQuery: () => ({
          data: { syncState: { lastFinalizedBlock: 100 } },
        }),
      },
    },
  },
}));

describe("Status badges", () => {
  it.each([
    [100, "Finalized"],
    [101, "Unfinalized"],
  ] as const)("shows finality for block %s", (blockNumber, finality) => {
    const markup = renderToStaticMarkup(
      <BlockStatusBadge blockNumber={blockNumber} />
    );
    expect(markup).toContain(finality);
  });

  it.each([
    ["success", "Success"],
    ["failed", "Failed"],
  ] as const)("shows execution status %s", (status, label) => {
    const markup = renderToStaticMarkup(<StatusBadge status={status} />);
    expect(markup).toContain(label);
  });
});
