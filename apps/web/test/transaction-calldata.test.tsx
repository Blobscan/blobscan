import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { TransactionCalldata } from "../src/components/TransactionCalldata";

vi.mock("../src/components/CopyToClipboard", () => ({
  CopyToClipboard: ({ value, label }: { value: string; label?: string }) => (
    <button data-copy={value}>{label}</button>
  ),
}));

describe("Transaction calldata", () => {
  it("shows unavailable data separately from empty calldata", () => {
    const missing = renderToStaticMarkup(<TransactionCalldata input={null} />);
    const empty = renderToStaticMarkup(<TransactionCalldata input="0x" />);
    expect(missing).toContain("Unavailable");
    expect(missing).not.toContain("Copy raw input");
    expect(empty).toContain('data-copy="0x"');
    expect(empty).toContain("Copy raw input");
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
