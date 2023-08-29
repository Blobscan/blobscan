import { describe, expect, it } from "vitest";

import {
  calculateBlobSize,
  calculateBlobGasPrice,
  getEIP2028CalldataGas,
} from "./ethereum";

describe("calculateBlobGasPrice ", () => {
  it.skip("should return the correct value using the ", () => {
    const excessDataGas = BigInt(1_000);

    const result = calculateBlobGasPrice(excessDataGas);

    expect(result).toEqual(BigInt(3_339_477));
  });
});

describe("getEIP2028CalldataGas", () => {
  it("returns correct gas cost for non-zero bytes", () => {
    const hexData = "0x1030007890abcde0";
    const expectedGasCost = BigInt(116);

    const actualGasCost = getEIP2028CalldataGas(hexData);

    expect(actualGasCost).toEqual(expectedGasCost);
  });

  it("returns correct gas cost for zero bytes", () => {
    const hexData = "0x00000000000000000";
    const expectedGasCost = BigInt(32);

    const actualGasCost = getEIP2028CalldataGas(hexData);

    expect(actualGasCost).toEqual(expectedGasCost);
  });
});

describe("calculateBlobSize", () => {
  it(" returns the correct size", () => {
    const blob = "0x1234567890abcdef";
    const expectedSize = 8;

    const actualSize = calculateBlobSize(blob);

    expect(actualSize).toBe(expectedSize);
  });
});
