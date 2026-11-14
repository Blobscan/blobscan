import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { TransactionStatusBadges } from "../src/components/Badges/TransactionStatusBadges";

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

describe("Transaction status badges", () => {
  it.each([
    [100, "success", "Finalized", "Success"],
    [101, "failed", "Unfinalized", "Failed"],
    [100, "failed", "Finalized", "Failed"],
    [101, "success", "Unfinalized", "Success"],
  ] as const)(
    "shows finality and execution for block %s and %s",
    (blockNumber, executionStatus, finality, execution) => {
      const markup = renderToStaticMarkup(
        <TransactionStatusBadges
          blockNumber={blockNumber}
          executionStatus={executionStatus}
        />
      );
      expect(markup).toContain(finality);
      expect(markup).toContain(execution);
    }
  );

  it("omits the execution badge when status is missing", () => {
    const markup = renderToStaticMarkup(
      <TransactionStatusBadges blockNumber={100} executionStatus={null} />
    );
    expect(markup).toContain("Finalized");
    expect(markup).not.toMatch(/Unknown|Success|Failed/);
  });
});
