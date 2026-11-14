import { describe, expect, it } from "vitest";

import { resolveEthPriceRpcUrls } from "../src";

describe("resolveEthPriceRpcUrls", () => {
  describe("when only ETH_PRICE_SYNCER_RPC_URLS is set", () => {
    it("should return its RPC URLs", () => {
      expect(
        resolveEthPriceRpcUrls({
          rpcUrls: { 137: "https://polygon.example", 1: "https://eth.example" },
        })
      ).toEqual({
        rpcUrls: { 137: "https://polygon.example", 1: "https://eth.example" },
        warnings: [],
      });
    });

    it("should throw when a chain has no ETH/USD feed", () => {
      expect(() =>
        resolveEthPriceRpcUrls({
          rpcUrls: { 8453: "https://base.example" },
        })
      ).toThrow(/no ETH\/USD price feed for chain\(s\) 8453/);
    });
  });

  describe("when only the deprecated vars are set", () => {
    it("should use chain 137 when the chain ID is not set", () => {
      expect(
        resolveEthPriceRpcUrls({ legacyRpcUrl: "https://polygon.example" })
      ).toEqual({
        rpcUrls: { 137: "https://polygon.example" },
        warnings: [],
      });
    });

    it("should use the deprecated chain ID", () => {
      expect(
        resolveEthPriceRpcUrls({
          legacyChainId: 1,
          legacyRpcUrl: "https://eth.example",
        }).rpcUrls
      ).toEqual({ 1: "https://eth.example" });
    });

    it("should ignore a chain that has no ETH/USD feed and warn", () => {
      const result = resolveEthPriceRpcUrls({
        legacyChainId: 8453,
        legacyRpcUrl: "https://base.example",
      });

      expect(result.rpcUrls).toEqual({});
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain("chain 8453");
      expect(result.warnings[0]).not.toContain("base.example");
    });
  });

  describe("when both are set for the same chain", () => {
    it("should use ETH_PRICE_SYNCER_RPC_URLS", () => {
      expect(
        resolveEthPriceRpcUrls({
          rpcUrls: { 137: "https://new.example" },
          legacyChainId: 137,
          legacyRpcUrl: "https://old.example",
        }).rpcUrls
      ).toEqual({ 137: "https://new.example" });
    });
  });

  describe("when nothing is set", () => {
    it("should return no RPC URLs", () => {
      expect(resolveEthPriceRpcUrls({})).toEqual({ rpcUrls: {}, warnings: [] });
    });
  });
});
