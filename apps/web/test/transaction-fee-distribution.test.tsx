import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { TransactionFeeDistribution } from "../src/components/TransactionFeeDistribution";

describe("Transaction fee distribution", () => {
  it("splits total fees without counting the priority fee twice", () => {
    const markup = renderToStaticMarkup(
      <TransactionFeeDistribution
        executionBaseFee={3603503358000n}
        priorityFee={42000000000000n}
        blobFee={1327174254592n}
      />
    );
    expect(markup).toContain("0.000003603503358 ETH (7.68%)");
    expect(markup).toContain("0.000042 ETH (89.49%)");
    expect(markup).toContain("0.000001327174254592 ETH (2.83%)");
  });

  it("omits missing and zero total fees", () => {
    for (const executionBaseFee of [null, undefined, 0n]) {
      expect(
        renderToStaticMarkup(
          <TransactionFeeDistribution
            executionBaseFee={executionBaseFee}
            priorityFee={0n}
            blobFee={0n}
          />
        )
      ).toBe("");
    }
  });

  it("keeps large amounts exact and accepts zero segments", () => {
    const markup = renderToStaticMarkup(
      <TransactionFeeDistribution
        executionBaseFee={10n ** 30n}
        priorityFee={0n}
        blobFee={10n ** 30n}
      />
    );
    expect(markup).toContain("1000000000000 ETH (50.00%)");
    expect(markup).not.toContain("NaN");
    expect(markup).not.toContain("Infinity");
  });
});
