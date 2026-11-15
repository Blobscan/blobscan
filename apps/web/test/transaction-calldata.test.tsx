import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { TransactionCalldata } from "../src/components/TransactionCalldata";

vi.mock("../src/components/CopyToClipboard", () => ({
  CopyToClipboard: ({ value }: { value: string }) => (
    <button data-copy={value}>Copy calldata</button>
  ),
}));

describe("Transaction calldata", () => {
  it("shows unavailable data separately from empty calldata", () => {
    const missing = renderToStaticMarkup(<TransactionCalldata input={null} />);
    const empty = renderToStaticMarkup(<TransactionCalldata input="0x" />);
    expect(missing).toContain("Unavailable");
    expect(missing).not.toContain("Copy calldata");
    expect(empty).toContain('data-copy="0x"');
  });

  it("preserves leading zero bytes in the read-only text area", () => {
    const markup = renderToStaticMarkup(
      <TransactionCalldata input="0x001234" />
    );
    expect(markup).toContain('aria-label="Raw Input"');
    expect(markup).toContain('readonly=""');
    expect(markup).toContain('data-copy="0x001234"');
    expect(markup).toContain("0x001234</textarea>");
  });

  it("keeps large calldata complete and in a bounded display", () => {
    const input = `0x${"ab".repeat(100000)}`;
    const markup = renderToStaticMarkup(<TransactionCalldata input={input} />);
    expect(markup).toContain('data-copy="' + input + '"');
    expect(markup).toContain("max-h-80");
  });
});
