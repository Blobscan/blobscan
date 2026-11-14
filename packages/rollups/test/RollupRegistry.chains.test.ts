import { describe, expect, it, vi } from "vitest";

import { RollupRegistry } from "../src";

vi.mock("../src/generated/registry", () => ({
  ROLLUP_DEFINITIONS: {
    base: {
      id: "base",
      blobPosters: {
        1: ["0x1111111111111111111111111111111111111111"],
        560048: ["0x2222222222222222222222222222222222222222"],
        100: ["0x3333333333333333333333333333333333333333"],
      },
    },
  },
}));

describe("chain filtering with controlled definitions", () => {
  it.each([
    [1, "0x1111111111111111111111111111111111111111"],
    [560048, "0x2222222222222222222222222222222222222222"],
    [100, "0x3333333333333333333333333333333333333333"],
  ])("uses the posters for chain %s", (chainId, address) => {
    const registry = RollupRegistry.create(chainId);
    expect(registry.getBlobPosters("BASE")).toEqual([address]);
    expect(registry.getRollup(address)).toBe("BASE");
  });

  it("excludes posters from other chains", () => {
    expect(
      RollupRegistry.create(100).getRollup(
        "0x2222222222222222222222222222222222222222"
      )
    ).toBeNull();
  });

  it("returns an empty registry for an unconfigured chain", () => {
    expect(RollupRegistry.create(999).registry).toEqual({});
  });
});
