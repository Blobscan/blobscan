// @vitest-environment happy-dom
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { expect, it, vi } from "vitest";

import { ContentReveal } from "../src/components/ContentReveal";
import { DetailsValueSkeleton } from "../src/components/DetailsValueSkeleton";
import { DetailsLayout } from "../src/components/Layouts/DetailsLayout";

vi.mock("~/hooks/useExternalExplorers", () => ({
  useExternalExplorers: () => ({ explorers: [], buildResourceUrl: () => "" }),
}));
vi.mock("~/hooks/useBreakpoint", () => ({ useBreakpoint: () => "md" }));

it("keeps helper icons and labels visible when values replace skeletons", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const shared = {
    header: "Transaction Details",
    fieldHelp: {
      "Execution Fee": "The execution fee paid by the transaction.",
    },
    loadingFields: [
      {
        name: "Execution Fee",
        value: (
          <DetailsValueSkeleton
            variant="subfields"
            labels={["Base", "Priority"]}
          />
        ),
      },
    ],
  };
  try {
    act(() => root.render(<DetailsLayout {...shared} fields={undefined} />));
    const helper = container.querySelector('[aria-label="More information"]');
    expect(helper).not.toBeNull();
    expect(container.querySelectorAll(".react-loading-skeleton")).toHaveLength(
      2
    );
    expect(container.querySelector(".content-reveal")).toBeNull();

    act(() =>
      root.render(
        <DetailsLayout
          {...shared}
          fields={[
            {
              name: "Execution Fee",
              revealValue: false,
              value: (
                <div>
                  {["Base", "Priority"].map((label) => (
                    <div key={label}>
                      <span data-label>{label}:</span>
                      <ContentReveal>
                        <span data-value>1 ETH</span>
                      </ContentReveal>
                    </div>
                  ))}
                </div>
              ),
            },
          ]}
        />
      )
    );
    expect(container.querySelector('[aria-label="More information"]')).toBe(
      helper
    );
    expect(helper?.closest(".content-reveal")).toBeNull();
    expect(container.querySelector(".react-loading-skeleton")).toBeNull();
    for (const label of container.querySelectorAll("[data-label]")) {
      expect(label.closest(".content-reveal")).toBeNull();
    }
    for (const value of container.querySelectorAll("[data-value]")) {
      expect(value.closest(".content-reveal")).not.toBeNull();
    }
  } finally {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  }
});
