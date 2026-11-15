import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Textarea } from "../src/components/Inputs/Textarea";

describe("Textarea", () => {
  it("preserves raw input and supports a footer", () => {
    const markup = renderToStaticMarkup(
      <Textarea
        aria-label="Raw Input"
        readOnly
        value="0x001234"
        className="font-mono"
        footer={<span>3 bytes</span>}
      />
    );
    expect(markup).toContain('aria-label="Raw Input"');
    expect(markup).toContain('readonly=""');
    expect(markup).toContain("0x001234</textarea>");
    expect(markup).toContain("3 bytes");
    expect(markup).toContain("pb-10");
  });

  it("supports native editable fields without a footer", () => {
    const markup = renderToStaticMarkup(
      <Textarea name="notes" defaultValue="Draft" rows={6} disabled />
    );
    expect(markup).toContain('name="notes"');
    expect(markup).toContain('rows="6"');
    expect(markup).toContain('disabled=""');
    expect(markup).toContain("Draft</textarea>");
    expect(markup).not.toContain("pb-10");
    expect(markup).not.toContain("readonly");
  });

  it("preserves large values and empty input", () => {
    const input = "0x" + "ab".repeat(100000);
    const markup = renderToStaticMarkup(<Textarea value={input} readOnly />);
    expect(markup).toContain(input + "</textarea>");
    expect(markup).toContain("max-h-80");
    expect(renderToStaticMarkup(<Textarea value="0x" readOnly />)).toContain(
      "0x</textarea>"
    );
  });
});
