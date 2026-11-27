import type { ReactNode } from "react";
import { readFileSync } from "fs";
import path from "path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { getBlobCanonicalUrl } from "../src/canonical";
import { Link } from "../src/components/Link";
import { SeoMetaTags } from "../src/components/SeoMetaTags";
import { BLOB_POSITION_LINK_REL } from "../src/routes";

vi.mock("next/head", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

const ORIGIN = "https://blobscan.com";
const VERSIONED_HASH = `0x01${"cd".repeat(31)}`;
const COMMITMENT = `0x${"ab".repeat(48)}`;
const COMMITMENT_VERSIONED_HASH =
  "0x015194b12b01058a369ef70fdb8b9b3e1fbadf6d08b23c1d602d7b567163cffc";

describe("Blob canonical URL", () => {
  describe("when the id is a versioned hash", () => {
    it("should return the absolute blob URL without a position", () => {
      expect(getBlobCanonicalUrl(VERSIONED_HASH, ORIGIN)).toBe(
        `${ORIGIN}/blob/${VERSIONED_HASH}`
      );
    });
  });

  describe("when the id is a KZG commitment", () => {
    it("should return the blob URL of the versioned hash", () => {
      expect(getBlobCanonicalUrl(COMMITMENT, ORIGIN)).toBe(
        `${ORIGIN}/blob/${COMMITMENT_VERSIONED_HASH}`
      );
    });
  });

  describe("when the id is not valid", () => {
    it.each(["0", "0x02" + "cd".repeat(31), "not-a-hash", undefined])(
      "should return undefined for %s",
      (id) => {
        expect(getBlobCanonicalUrl(id, ORIGIN)).toBeUndefined();
      }
    );
  });

  describe("when there is no origin", () => {
    it("should return undefined", () => {
      expect(getBlobCanonicalUrl(VERSIONED_HASH, undefined)).toBeUndefined();
    });
  });
});

describe("SeoMetaTags", () => {
  describe("when a canonical URL is set", () => {
    it("should render the canonical link", () => {
      const markup = renderToStaticMarkup(
        <SeoMetaTags canonicalUrl={`${ORIGIN}/blob/${VERSIONED_HASH}`} />
      );

      expect(markup).toContain(
        `<link rel="canonical" href="${ORIGIN}/blob/${VERSIONED_HASH}"/>`
      );
    });
  });

  describe("when no canonical URL is set", () => {
    it("should not render a canonical link", () => {
      const markup = renderToStaticMarkup(<SeoMetaTags title="Blob" />);

      expect(markup).not.toContain('rel="canonical"');
    });
  });
});

describe("Link", () => {
  describe("when a rel is set", () => {
    it("should put the rel on the anchor", () => {
      const markup = renderToStaticMarkup(
        <Link href="/blob/0x01?tx=0x02&index=0" rel={BLOB_POSITION_LINK_REL}>
          blob
        </Link>
      );

      expect(markup).toContain('rel="nofollow"');
    });
  });

  describe("when no rel is set", () => {
    it("should not put a rel on the anchor", () => {
      const markup = renderToStaticMarkup(<Link href="/blob/0x01">blob</Link>);

      expect(markup).not.toContain("rel=");
    });
  });
});

describe("robots.txt", () => {
  describe("when a crawler reads it", () => {
    it("should block blob URLs that have a query", () => {
      const robots = readFileSync(
        path.resolve(__dirname, "../public/robots.txt"),
        "utf8"
      );

      expect(robots).toMatch(/^User-agent: \*$/m);
      expect(robots).toMatch(/^Disallow: \/blob\/\*\?$/m);
    });
  });
});
