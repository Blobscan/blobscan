// @vitest-environment happy-dom
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { expect, it, vi } from "vitest";

import { TransactionFeeDistribution } from "../src/components/TransactionFeeDistribution";

it("highlights the matching legend on hover and keyboard focus", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  try {
    act(() =>
      root.render(
        <TransactionFeeDistribution
          executionBaseFee={8n}
          priorityFee={1n}
          blobFee={1n}
        />
      )
    );
    const trigger = container.querySelectorAll("button")[1]!;
    const legend = Array.from(container.querySelectorAll("span")).find(
      (element) => element.textContent === "Priority 10.00%"
    )!;
    await act(async () =>
      trigger.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }))
    );
    expect(legend.className).toContain("text-positive-light");
    await act(async () =>
      trigger.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }))
    );
    expect(legend.className).not.toContain("text-positive-light");
    await act(async () => trigger.focus());
    expect(legend.className).toContain("text-positive-light");
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
    await act(async () => trigger.blur());
    expect(legend.className).not.toContain("text-positive-light");
  } finally {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  }
});
