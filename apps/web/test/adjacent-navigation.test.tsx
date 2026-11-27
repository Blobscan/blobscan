// @vitest-environment happy-dom
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { captureNavArrowClick } from "../src/analytics";
import { useAdjacentNavigation } from "../src/hooks/useAdjacentNavigation";
import type { GetAdjacent } from "../src/hooks/useAdjacentNavigation";

const push = vi.hoisted(() => vi.fn());

vi.mock("next/compat/router", () => ({ useRouter: () => ({ push }) }));
vi.mock("~/analytics", () => ({ captureNavArrowClick: vi.fn() }));

type Navigation = ReturnType<typeof useAdjacentNavigation>;

const ERROR_MESSAGE = "Could not get the adjacent transaction";

let container: HTMLDivElement;
let root: Root;

function renderNavigation(getAdjacent: GetAdjacent | undefined) {
  const result = {} as { current: Navigation };

  function Probe() {
    result.current = useAdjacentNavigation({
      page: "tx",
      getAdjacent,
      errorMessage: ERROR_MESSAGE,
    });

    return null;
  }

  act(() => root.render(<Probe />));

  return result;
}

async function navigate(result: { current: Navigation }) {
  await act(async () => {
    await result.current.navigate("next");
  });
}

function expectEvent(outcome: string, properties?: object) {
  expect(captureNavArrowClick).toHaveBeenCalledTimes(1);
  expect(captureNavArrowClick).toHaveBeenCalledWith({
    page: "tx",
    direction: "next",
    outcome,
    startedAt: expect.any(Number),
    ...(properties ? { properties } : {}),
  });
}

describe("useAdjacentNavigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    push.mockResolvedValue(true);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  it("does nothing while the current entity is not loaded", async () => {
    const result = renderNavigation(undefined);

    await navigate(result);

    expect(push).not.toHaveBeenCalled();
    expect(captureNavArrowClick).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });

  it("records `none` and stays on the page when there is no entity", async () => {
    const result = renderNavigation(() => Promise.resolve(null));

    await navigate(result);

    expect(push).not.toHaveBeenCalled();
    expectEvent("none");
    expect(result.current.error).toBeUndefined();
  });

  it("goes to the adjacent page and records `navigated`", async () => {
    const getAdjacent = vi.fn<GetAdjacent>(() =>
      Promise.resolve({
        route: "/tx/0x2",
        properties: { same_transaction: true },
      })
    );
    const result = renderNavigation(getAdjacent);

    await navigate(result);

    expect(getAdjacent).toHaveBeenCalledWith("next");
    expect(push).toHaveBeenCalledWith("/tx/0x2");
    expectEvent("navigated", { same_transaction: true });
  });

  it("records `cancelled` when another navigation cancels the page change", async () => {
    push.mockResolvedValue(false);
    const result = renderNavigation(() =>
      Promise.resolve({ route: "/tx/0x2" })
    );

    await navigate(result);

    expectEvent("cancelled");
  });

  it("records `error` and exposes the error when the request fails", async () => {
    const failure = new Error("Network error");
    const result = renderNavigation(() => Promise.reject(failure));

    await navigate(result);

    expect(push).not.toHaveBeenCalled();
    expectEvent("error");
    expect(result.current.error).toBe(failure);
    expect(result.current.loading).toBe(false);
  });

  it("uses the error message when the failure is not an Error", async () => {
    const result = renderNavigation(() => Promise.reject("offline"));

    await navigate(result);

    expect(result.current.error?.message).toBe(ERROR_MESSAGE);
  });

  it("is loading until the page change ends, and clears the last error", async () => {
    let resolveAdjacent: (value: null) => void = () => undefined;
    let calls = 0;
    const result = renderNavigation(() => {
      calls++;

      return calls === 1
        ? Promise.reject(new Error("First click fails"))
        : new Promise((resolve) => {
            resolveAdjacent = resolve;
          });
    });

    await navigate(result);
    expect(result.current.error).toBeDefined();

    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.navigate("next");
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeUndefined();

    await act(async () => {
      resolveAdjacent(null);
      await pending;
    });

    expect(result.current.loading).toBe(false);
  });
});
