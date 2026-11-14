import { describe, expect, it } from "vitest";

import { RollupRegistry } from "../src";

const MAINNET_BASE_POSTER = "0x5050f69a9786f081509234f1a7f4684b5e5b76c9";
const SEPOLIA_BASE_POSTER = "0xfc56e7272eebbba5bc6c544e159483c4a38f8ba3";

describe("RollupRegistry", () => {
  const rollupRegistry = RollupRegistry.create(11155111);

  describe("when creating a chain-specific rollup registry", () => {
    it("should create a rollup registry for mainnet", () => {
      const rollupRegistry = RollupRegistry.create(1);
      expect(rollupRegistry.getRollup(MAINNET_BASE_POSTER)).toBe("BASE");
    });

    it("should create a rollup registry for sepolia", () => {
      const rollupRegistry = RollupRegistry.create(11155111);
      expect(rollupRegistry.getRollup(SEPOLIA_BASE_POSTER)).toBe("BASE");
    });
  });

  it("matches poster addresses without case sensitivity", () => {
    expect(
      rollupRegistry.getRollup("0X564D33DE40B1AF31AAA2B726EAF9DAFBAF763577")
    ).toBe("ABSTRACT");
  });

  describe("when getting blob posters by rollup", () => {
    it("should return the correct blob posters for sepolia", () => {
      expect(rollupRegistry.getBlobPosters("BASE")).toContain(
        SEPOLIA_BASE_POSTER
      );
    });

    it("should return no blob posters for a rollup that does not exist", () => {
      expect(new RollupRegistry({}).getBlobPosters("RIVER")).toEqual([]);
    });
  });

  describe("when getting the rollup by blob poster", () => {
    it("should return the correct rollup for sepolia", () => {
      expect(
        rollupRegistry.getRollup("0x4e6bd53883107b063c502ddd49f9600dc51b3ddc")
      ).toEqual("MODE");
    });

    it("should return no rollup for a blob poster that does not exist", () => {
      expect(rollupRegistry.getRollup("0x12321312321321321321")).toEqual(null);
    });
  });

  describe("when getting the rollup of a rotated mainnet batcher", () => {
    const mainnetRegistry = RollupRegistry.create(1);

    it.each([
      ["0x5e70713222faf60c9e9fb69240d06ae6d688563a", "HASHKEY"],
      ["0x09d1ad25b369a0c48bdf4caab85afd08a3f07044", "PARADEX"],
      ["0x35376dd47c061bc3b8c8e8d61987019e7ed58f06", "TAIKO"],
      ["0x9ef649e8746cc47a17708a5e86b2d66c7f6c00d1", "UNICHAIN"],
      ["0xcf8225801df6ef90ad3bc86808f574403a309de8", "ZIRCUIT"],
    ])("should return the rollup of %s", (address, rollup) => {
      expect(mainnetRegistry.getRollup(address)).toEqual(rollup);
    });
  });
});
