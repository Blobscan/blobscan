// @vitest-environment happy-dom
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TableAmount } from "../src/components/Table/Amount";

const container = document.createElement("div");
document.body.appendChild(container);
let root: ReturnType<typeof createRoot>;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
});

afterEach(() => {
  act(() => root.unmount());
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function renderAmount(weiAmount: bigint) {
  root = createRoot(container);
  act(() => root.render(<TableAmount weiAmount={weiAmount} />));
}

describe("TableAmount", () => {
  it.each([
    [BigInt(0), "0"],
    [BigInt(1), "<0.0001"],
    [BigInt(99_999), "<0.0001"],
    [BigInt(100_000), "0.0001"],
    [BigInt(1_234_567), "0.0012"],
    [BigInt(12_345_678_901), "12.3457"],
    [BigInt(1_200_000_000), "1.2"],
    [BigInt(999_999_999), "1"],
    [
      BigInt("123456789012345678901234567890"),
      "123,456,789,012,345,678,901.2346",
    ],
  ])("formats %s wei as %s", (weiAmount, expected) => {
    renderAmount(weiAmount);
    expect(container.textContent).toBe(expected);
  });

  it.each([BigInt(0), BigInt(1_200_000_000), BigInt(12_345_678_901)])(
    "does not show a tooltip for an amount that fits: %s",
    (amount) => {
      renderAmount(amount);
      expect(container.querySelector("button")).toBeNull();
      expect(document.querySelector('[role="tooltip"]')).toBeNull();
    }
  );

  it("shows a tooltip for overflow and removes it when the amount fits", async () => {
    const resizeCallbacks: (() => void)[] = [];
    let width = 40;
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: () => void) {
          resizeCallbacks.push(callback);
        }
        observe() {}
        disconnect() {}
      }
    );
    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(80);
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(
      () => width
    );
    renderAmount(BigInt(12_345_678_901));
    await act(async () => container.querySelector("button")!.focus());
    expect(document.querySelector('[role="tooltip"]')?.textContent).toBe(
      "12.345678901"
    );

    width = 100;
    act(() => resizeCallbacks[0]?.());
    expect(container.querySelector("button")).toBeNull();
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
  });

  it("shows the exact value without its unit on keyboard focus", async () => {
    renderAmount(BigInt(1));
    const trigger = container.querySelector("button")!;
    expect(trigger.tabIndex).toBe(0);

    await act(async () => trigger.focus());
    expect(document.querySelector('[role="tooltip"]')?.textContent).toBe(
      "0.000000001"
    );
  });
});
