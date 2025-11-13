import { describe, expect, it } from "vitest";

import { RollupRegistry } from "../src";
import { GNOSIS_REGISTRY } from "../src/blob-posters/gnosis";
import { HOLESKY_REGISTRY } from "../src/blob-posters/holesky";
import { HOODI_REGISTRY } from "../src/blob-posters/hoodi";
import { MAINNET_REGISTRY } from "../src/blob-posters/mainnet";
import { SEPOLIA_REGISTRY } from "../src/blob-posters/sepolia";

describe("RollupRegistry", () => {
  const rollupRegistry = RollupRegistry.create(11155111);

  describe("when creating a chain-specific rollup registry", () => {
    it("should create a rollup registry for mainnet", () => {
      const rollupRegistry = RollupRegistry.create(1);
      expect(rollupRegistry.registry).toEqual(MAINNET_REGISTRY);
    });

    it("should create a rollup registry for sepolia", () => {
      const rollupRegistry = RollupRegistry.create(11155111);
      expect(rollupRegistry.registry).toEqual(SEPOLIA_REGISTRY);
    });

    it("should create a rollup registry for holesky", () => {
      const rollupRegistry = RollupRegistry.create(167004);
      expect(rollupRegistry.registry).toEqual(HOLESKY_REGISTRY);
    });

    it("should create a rollup registry for hoodi", () => {
      const rollupRegistry = RollupRegistry.create(560048);
      expect(rollupRegistry.registry).toEqual(HOODI_REGISTRY);
    });

    it("should create a rollup registry for gnosis", () => {
      const rollupRegistry = RollupRegistry.create(100);
      expect(rollupRegistry.registry).toEqual(GNOSIS_REGISTRY);
    });
  });

  describe("when getting blob posters by rollup", () => {
    it("should return the correct blob posters for mainnet", () => {
      expect(rollupRegistry.getBlobPosters("BASE")).toEqual(
        SEPOLIA_REGISTRY["BASE"]
      );
    });

    it("should return no blob posters for a rollup that does not exist", () => {
      expect(rollupRegistry.getBlobPosters("RIVER")).toEqual([]);
    });
  });

  describe("when getting the rollup by blob poster", () => {
    it("should return the correct rollup for mainnet", () => {
      expect(
        rollupRegistry.getRollup("0x4e6bd53883107b063c502ddd49f9600dc51b3ddc")
      ).toEqual("MODE");
    });

    it("should return no rollup for a blob poster that does not exist", () => {
      expect(rollupRegistry.getRollup("0x12321312321321321321")).toEqual(null);
    });
  });
});
