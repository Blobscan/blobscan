// @vitest-environment happy-dom

import { useMemo } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Stats from "../src/pages/stats";

const boundary = vi.hoisted(() => ({
  network: "mainnet",
  empty: false,
  query: {} as Record<string, string>,
  render: () => {},
}));

vi.mock("next/compat/router", () => {
  let router: unknown;
  let query: unknown;
  return {
    useRouter: () => {
      if (query === boundary.query) return router;
      query = boundary.query;
      router = {
        pathname: "/stats",
        isReady: true,
        query: boundary.query,
        push: ({ query }: { query: Record<string, string> }) => {
          boundary.query = query;
          boundary.render();
          return Promise.resolve(true);
        },
      };
      return router;
    },
  };
});
vi.mock("~/providers/Env", () => {
  const envs = {
    mainnet: { PUBLIC_NETWORK_NAME: "mainnet" },
    sepolia: { PUBLIC_NETWORK_NAME: "sepolia" },
  };
  return {
    useEnv: () => ({ env: envs[boundary.network as keyof typeof envs] }),
  };
});
vi.mock("~/api-client", () => ({
  api: {
    stats: {
      getOverall: { useQuery: () => ({ data: undefined }) },
      getTimeseries: {
        useQuery: (
          input: { metrics: string; rollups?: string },
          options: { select: (response: unknown) => unknown }
        ) => {
          const data = useMemo(
            () =>
              options.select({
                data: {
                  timestamps: [new Date("2026-11-01T00:00:00Z")],
                  granularity: "day",
                  series: [
                    {
                      dimension: input.rollups
                        ? { type: "rollup", name: "base" }
                        : { type: "global" },
                      startTimestampIdx: 0,
                      metrics: Object.fromEntries(
                        input.metrics.split(",").map((metric) => [metric, [1]])
                      ),
                    },
                  ],
                },
              }),
            [input.metrics, input.rollups, options]
          );
          return { data: boundary.empty ? undefined : data, isLoading: false };
        },
      },
    },
  },
}));
// The chart renderer needs a canvas. Keep the page and chart controls real.
vi.mock("echarts-for-react/lib/core", () => ({ default: () => null }));

let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  boundary.network = "mainnet";
  boundary.empty = false;
  boundary.query = {};
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  boundary.render = () => root.render(<Stats />);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

function renderPage() {
  act(() => boundary.render());
}

function tabs() {
  return Array.from(container.querySelectorAll('[role="tab"]'));
}

describe("stats tabs", () => {
  it("shows the seven tabs and selects Blobs by default", () => {
    renderPage();
    expect(tabs().map((tab) => tab.textContent)).toEqual([
      "Blobs",
      "Blocks",
      "Transactions",
      "Addresses",
      "Gas",
      "Fees",
      "ETH Price",
    ]);
    expect(tabs()[0]?.getAttribute("aria-selected")).toBe("true");
    expect(container.textContent).toContain("All-time");
    expect(container.textContent).not.toContain("Overall Metrics");
  });
});

function clickTab(label: string) {
  const tab = tabs().find(
    (tab) => tab.textContent === label
  ) as HTMLButtonElement;
  act(() => tab.click());
}

it.each([
  ["all", "Blobs"],
  ["blob", "Blobs"],
  ["block", "Blocks"],
  ["transaction", "Transactions"],
  ["gas", "Gas"],
  ["fee", "Fees"],
  ["price", "ETH Price"],
])("opens the old section link %s", (section, label) => {
  boundary.query = { section };
  renderPage();
  expect(
    tabs().find((tab) => tab.getAttribute("aria-selected") === "true")
      ?.textContent
  ).toBe(label);
});

it("restores the time range and rollup selection and keeps them across tabs", async () => {
  boundary.query = {
    section: "blob",
    timeFrame: "7d",
    rollups: "base",
    unit: "eth",
  };
  renderPage();
  expect(container.textContent).toContain("7D");
  expect(container.textContent).toContain("Base");
  clickTab("Fees");
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 180));
  });
  expect(boundary.query).toMatchObject({
    section: "fee",
    timeFrame: "7d",
    rollups: "base",
    unit: "eth",
  });
  expect(container.textContent).toContain("7D");
  expect(container.textContent).toContain("Base");
  expect(
    container.querySelector(
      'a[href="/stat/total-blob-base-fees?timeFrame=7d&rollups=base&unit=eth"]'
    )
  ).not.toBeNull();
});

it.each(["sepolia", "unknown"])("hides ETH Price on %s", (network) => {
  boundary.network = network;
  boundary.query = { section: "price" };
  renderPage();
  expect(tabs().map((tab) => tab.textContent)).not.toContain("ETH Price");
  expect(tabs()[0]?.getAttribute("aria-selected")).toBe("true");
});

it.each(["block", "address", "gas", "fee", "price"])(
  "marks network charts in %s",
  (section) => {
    boundary.query = { section, rollups: "base" };
    renderPage();
    expect(container.textContent).toContain(
      "Network-wide · Rollup filter does not apply"
    );
  }
);

it("puts gas prices in Fees and keeps gas consumption in Gas", async () => {
  boundary.query = { section: "gas" };
  renderPage();
  expect(container.textContent).toContain("Total Blob Gas Used (All-time)");
  expect(container.textContent).not.toContain("Max. Blob Gas Price (All-time)");
  clickTab("Fees");
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 180));
  });
  expect(container.textContent).toContain("Max. Blob Gas Price (All-time)");
  expect(
    container.querySelector('a[href^="/stat/blob-gas-price"]')
  ).not.toBeNull();
});

it("supports keyboard tab navigation", async () => {
  renderPage();
  const first = tabs()[0] as HTMLElement;
  act(() => {
    first.focus();
    first.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })
    );
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 180));
  });
  expect(tabs()[1]?.getAttribute("aria-selected")).toBe("true");
  expect(boundary.query.section).toBe("block");
});

it("saves time range and fee unit changes in the URL", async () => {
  boundary.query = { section: "fee", unit: "eth" };
  renderPage();
  const timeButton = Array.from(container.querySelectorAll("button")).find(
    (button) => button.textContent === "15D"
  )!;
  act(() => timeButton.click());
  const week = Array.from(document.querySelectorAll('[role="option"]')).find(
    (option) => option.textContent === "7D"
  ) as HTMLElement;
  act(() => week.click());
  expect(boundary.query.timeFrame).toBe("7d");
  const unitButton = container.querySelector(
    'button[aria-label="Show values in USD"]'
  ) as HTMLButtonElement;
  expect(unitButton).not.toBeNull();
  act(() => unitButton.click());
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 350));
  });
  expect(boundary.query.unit).toBe("usd");
});

it("uses defaults for invalid URL controls", () => {
  boundary.query = {
    section: "invalid",
    timeFrame: "bad",
    unit: "bad",
    rollups: "bad",
  };
  renderPage();
  expect(tabs()[0]?.getAttribute("aria-selected")).toBe("true");
  expect(container.textContent).toContain("15D");
});

it("keeps the network label when no chart data is available", () => {
  boundary.query = { section: "block", rollups: "base" };
  boundary.empty = true;
  renderPage();
  expect(container.textContent).toContain("No Chart Data");
  expect(container.textContent).toContain(
    "Network-wide · Rollup filter does not apply"
  );
});

it("keeps default Full View links compatible with chart pages", () => {
  renderPage();
  expect(container.querySelector('a[href="/stat/total-blobs"]')).not.toBeNull();
});
