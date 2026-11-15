import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { DetailsValueSkeleton } from "../src/components/DetailsValueSkeleton";
import { DetailsLayout } from "../src/components/Layouts/DetailsLayout";

vi.mock("~/hooks/useExternalExplorers", () => ({
  useExternalExplorers: () => ({ explorers: [], buildResourceUrl: () => "" }),
}));
vi.mock("~/hooks/useBreakpoint", () => ({ useBreakpoint: () => "md" }));

describe("DetailsLayout loading values", () => {
  it("keeps field labels visible and renders one skeleton per value", () => {
    const markup = renderToStaticMarkup(
      <DetailsLayout
        header="Block Details"
        fields={undefined}
        loadingFields={["Hash", "Blob Usage", "Blob Transaction Fees"]}
      />
    );
    expect(markup).toContain(">Hash<");
    expect(markup).toContain(">Blob Usage<");
    expect(markup).toContain(">Blob Transaction Fees<");
    expect(markup.match(/class="react-loading-skeleton"/g)).toHaveLength(3);
    expect(markup).not.toContain("content-reveal");
    expect(markup).not.toContain("animation-delay");
  });

  it("uses badge and bar shapes for configured values", () => {
    const markup = renderToStaticMarkup(
      <DetailsLayout
        header="Transaction Details"
        fields={undefined}
        loadingFields={[
          {
            name: "Status",
            value: <DetailsValueSkeleton variant="badge" count={2} />,
          },
          { name: "Blob Usage", value: <DetailsValueSkeleton variant="bar" /> },
          {
            name: "Total Fee",
            value: <DetailsValueSkeleton variant="distribution" />,
          },
        ]}
      />
    );
    expect(markup.match(/border-radius:999px/g)).toHaveLength(2);
    expect(markup.match(/height:4px/g)).toHaveLength(2);
    expect(markup).toContain(">Total Fee<");
  });

  it("keeps subfield labels visible while their values load", () => {
    const markup = renderToStaticMarkup(
      <DetailsValueSkeleton variant="subfields" labels={["Base", "Priority"]} />
    );
    expect(markup).toContain("Base:");
    expect(markup).toContain("Priority:");
    expect(markup.match(/class="react-loading-skeleton"/g)).toHaveLength(2);
  });

  it("replaces loading values with data, including zero", () => {
    const markup = renderToStaticMarkup(
      <DetailsLayout
        header="Block Details"
        fields={[{ name: "Blob Usage", value: 0 }]}
        loadingFields={["Hash", "Blob Usage"]}
      />
    );
    expect(markup).toContain(">Blob Usage<");
    expect(markup).toContain(">0<");
    expect(markup).not.toContain("react-loading-skeleton");
    expect(markup).not.toContain(">Hash<");
    expect(markup).toContain("content-reveal");
  });
});
