import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { EtherDisplay } from "../src/components/Displays/EtherDisplay";

describe("EtherDisplay USD amounts", () => {
  it("converts using the supplied historical ETH price", () => {
    expect(
      renderToStaticMarkup(
        <EtherDisplay weiAmount={1000000000000000000n} ethUsdPrice={3200} />
      )
    ).toContain("($3,200.00)");
  });
  it("preserves explicit USD amounts", () => {
    expect(
      renderToStaticMarkup(
        <EtherDisplay
          weiAmount={1000000000000000000n}
          ethUsdPrice={3200}
          usdAmount="7"
        />
      )
    ).toContain("($7.00)");
  });
  it("omits missing prices and retains zero values", () => {
    expect(renderToStaticMarkup(<EtherDisplay weiAmount={0n} />)).not.toContain(
      "$"
    );
    expect(
      renderToStaticMarkup(<EtherDisplay weiAmount={0n} ethUsdPrice={3200} />)
    ).toContain("($0.00)");
  });
});
