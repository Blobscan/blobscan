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
    expect(empty).toContain("0 bytes");
    expect(empty).toContain('data-copy="0x"');
  });

  it("shows the byte count and preserves leading zero bytes", () => {
    const markup = renderToStaticMarkup(
      <TransactionCalldata input="0x001234" />
    );
    expect(markup).toContain("3 bytes");
    expect(markup).toContain('data-copy="0x001234"');
    expect(markup).toContain("0x001234</pre>");
  });

  it("keeps large calldata complete and in a bounded display", () => {
    const input = `0x${"ab".repeat(100000)}`;
    const markup = renderToStaticMarkup(<TransactionCalldata input={input} />);
    expect(markup).toContain("100000 bytes");
    expect(markup).toContain('data-copy="' + input + '"');
    expect(markup).toContain("max-h-80 overflow-auto");
  });
});
