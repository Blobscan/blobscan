// @vitest-environment happy-dom
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { expect, it, vi } from "vitest";

import { DistributionBar } from "../src/components/DistributionBar";

it("uses exact proportions and updates to zero with reduced motion", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const originalMatchMedia = window.matchMedia.bind(window);
  vi.spyOn(window, "matchMedia").mockImplementation((query) => {
    const media = originalMatchMedia(query);
    Object.defineProperty(media, "matches", { value: true });
    return media;
  });
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const render = async (used: bigint) => {
    await act(async () =>
      root.render(
        <DistributionBar
          label="Usage"
          segments={[
            { id: "used", label: "Used", value: used, color: "bg-violet-500" },
            {
              id: "unused",
              label: "Unused",
              value: 10n ** 30n - used,
              color: "bg-gray-200",
            },
          ]}
        />
      )
    );
  };
  try {
    await render(5n * 10n ** 29n);
    expect(
      container.querySelector<HTMLElement>('[aria-label="Used"]')?.style.width
    ).toBe("50%");
    await render(0n);
    expect(
      container.querySelector<HTMLElement>('[aria-label="Used"]')?.style.width
    ).toBe("0%");
    expect(
      container.querySelector<HTMLElement>('[aria-label="Unused"]')?.style.width
    ).toBe("100%");
  } finally {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  }
});
