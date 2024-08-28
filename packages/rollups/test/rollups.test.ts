import { describe, expect, it } from "vitest";

import { Rollup } from "@blobscan/db/prisma/enums";

import {
  getAddressByRollup,
  getChainRollups,
  getRollupByAddress,
} from "../src";

describe("Rollups", () => {
  it("should get a rollup by its address correctly", () => {
    const chainId = 1;
    const address = "0x5050f69a9786f081509234f1a7f4684b5e5b76c9";
    const expectedRollup = Rollup.BASE;

    expect(getRollupByAddress(address, chainId)).toBe(expectedRollup);
  });

  it("should get an address by its rollup correctly", () => {
    const chainId = 11155111;
    const rollup = Rollup.MODE;
    const expectedAddress = "0x4e6bd53883107b063c502ddd49f9600dc51b3ddc";

    expect(getAddressByRollup(rollup, chainId)).toBe(expectedAddress);
  });

  it("should get all chain's rollups correctly", () => {
    const chainId = 11155111;
    const expectedRollup = [
      Rollup.ARBITRUM,
      Rollup.BASE,
      Rollup.KROMA,
      Rollup.LINEA,
      Rollup.OPTIMISM,
      Rollup.SCROLL,
      Rollup.STARKNET,
      Rollup.MODE,
      Rollup.ZORA,
    ];

    expect(getChainRollups(chainId)).toEqual(expectedRollup);
  });
});
