import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const posthog = vi.hoisted(() => ({
  init: vi.fn(),
  capture: vi.fn(),
  debug: vi.fn(),
}));

vi.mock("posthog-js", () => ({ default: posthog }));

const CONFIG = { id: "phc_test", host: "https://posthog.example" };

// `analytics` keeps its state in the module: import a fresh copy per test.
function importAnalytics() {
  return import("../src/analytics");
}

describe("analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.stubGlobal("window", { location: { hostname: "blobscan.com" } });
  });

  afterEach(() => {
    // Undo the failing mock of the "cannot load" test.
    vi.doMock("posthog-js", () => ({ default: posthog }));
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("does not load PostHog on the server", async () => {
    vi.unstubAllGlobals();
    vi.stubGlobal("window", undefined);
    const { initAnalytics, captureEvent } = await importAnalytics();

    expect(initAnalytics(CONFIG)).toBeUndefined();
    captureEvent("event");

    expect(posthog.init).not.toHaveBeenCalled();
    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it("drops events when PostHog is not initialized", async () => {
    const { captureEvent, initAnalytics } = await importAnalytics();

    captureEvent("before_init");
    await initAnalytics(CONFIG);

    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it("initializes PostHog once with the given id and host", async () => {
    const { initAnalytics } = await importAnalytics();

    await initAnalytics(CONFIG);
    await initAnalytics({ id: "other", host: "https://other.example" });

    expect(posthog.init).toHaveBeenCalledTimes(1);
    expect(posthog.init).toHaveBeenCalledWith(
      CONFIG.id,
      expect.objectContaining({
        api_host: CONFIG.host,
        capture_pageview: "history_change",
      })
    );
  });

  it("sends the events captured while PostHog loads once it has loaded", async () => {
    const { captureEvent, initAnalytics } = await importAnalytics();

    const loading = initAnalytics(CONFIG);
    captureEvent("first", { a: 1 });
    captureEvent("second");

    expect(posthog.capture).not.toHaveBeenCalled();

    await loading;

    expect(posthog.capture.mock.calls).toEqual([
      ["first", { a: 1 }],
      ["second", {}],
    ]);
  });

  it("keeps at most 50 events while PostHog loads", async () => {
    const { captureEvent, initAnalytics } = await importAnalytics();

    const loading = initAnalytics(CONFIG);

    for (let i = 0; i < 60; i++) {
      captureEvent("event", { i });
    }

    await loading;

    expect(posthog.capture).toHaveBeenCalledTimes(50);
    expect(posthog.capture).toHaveBeenLastCalledWith("event", { i: 49 });
  });

  it("sends events directly once PostHog has loaded", async () => {
    const { captureEvent, initAnalytics } = await importAnalytics();

    await initAnalytics(CONFIG);
    captureEvent("after_load", { b: 2 });

    expect(posthog.capture).toHaveBeenCalledWith("after_load", { b: 2 });
  });

  it("drops the events when PostHog cannot load", async () => {
    vi.doMock("posthog-js", () => {
      throw new Error("Blocked by the browser");
    });
    const { captureEvent, initAnalytics } = await importAnalytics();

    const loading = initAnalytics(CONFIG);
    captureEvent("queued");

    await expect(loading).resolves.toBeUndefined();

    captureEvent("after_failure");

    expect(posthog.init).not.toHaveBeenCalled();
    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it("sends nav_arrow_click with the outcome and the duration", async () => {
    vi.spyOn(performance, "now").mockReturnValue(1250.4);
    const { captureNavArrowClick, initAnalytics } = await importAnalytics();

    await initAnalytics(CONFIG);
    captureNavArrowClick({
      page: "blob",
      direction: "next",
      outcome: "cancelled",
      startedAt: 1000,
      properties: { same_transaction: true },
    });

    expect(posthog.capture).toHaveBeenCalledWith("nav_arrow_click", {
      page: "blob",
      direction: "next",
      outcome: "cancelled",
      duration_ms: 250,
      same_transaction: true,
    });
  });
});
