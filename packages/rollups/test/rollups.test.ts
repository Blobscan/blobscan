import { describe, expect, it } from "vitest";

import { Rollup } from "@blobscan/db/prisma/enums";

import {
  getAddressByRollup,
  getChainRollups,
  getRollupByAddress,
} from "../src";

describe("Rollups", () => {
  it("should retrieve a rollup by its address correctly", () => {
    const chainId = 1;
    const address = "0x5050f69a9786f081509234f1a7f4684b5e5b76c9";
    const expectedRollup = Rollup.BASE;

    expect(getRollupByAddress(address, chainId)).toBe(expectedRollup);
  });

  it("should return null when retrieving a rollup that does not exists", () => {
    const chainId = 1;
    const address = "0x12321312321321321321";

    expect(getRollupByAddress(address, chainId)).toBe(null);
  });

  it("should retrieve an address by its rollup correctly", () => {
    const chainId = 11155111;
    const rollup = Rollup.MODE;
    const expectedAddress = "0x4e6bd53883107b063c502ddd49f9600dc51b3ddc";

    expect(getAddressByRollup(rollup, chainId)).toBe(expectedAddress);
  });

  it("should return null when retrieving an address by a rollup that does not exists", () => {
    const chainId = 11155111;
    const rollup = Rollup.BOBA;

    expect(getAddressByRollup(rollup, chainId)).toBe(null);
  });

  it("should get all chain's rollups correctly", () => {
    const chainId = 11155111;
    const expectedRollups = [
      ["0xb2248390842d3c4acf1d8a893954afc0eac586e5", Rollup.ARBITRUM],
      ["0x6cdebe940bc0f26850285caca097c11c33103e47", Rollup.BASE],
      ["0xf15dc770221b99c98d4aaed568f2ab04b9d16e42", Rollup.KROMA],
      ["0x47c63d1e391fcb3dcdc40c4d7fa58adb172f8c38", Rollup.LINEA],
      ["0x8f23bb38f531600e5d8fddaaec41f13fab46e98c", Rollup.OPTIMISM],
      ["0x2d567ece699eabe5afcd141edb7a4f2d0d6ce8a0", Rollup.SCROLL],
      ["0x5b98b836969a60fec50fa925905dd1d382a7db43", Rollup.STARKNET],
      ["0x4e6bd53883107b063c502ddd49f9600dc51b3ddc", Rollup.MODE],
      ["0x3cd868e221a3be64b161d596a7482257a99d857f", Rollup.ZORA],
    ];

    expect(getChainRollups(chainId)).toEqual(expectedRollups);
  });

  it("should return an empty array when when retrieving the rollups of a chain that does not exists", () => {
    const chainId = 12323;

    expect(getChainRollups(chainId)).toEqual([]);
  });
});
