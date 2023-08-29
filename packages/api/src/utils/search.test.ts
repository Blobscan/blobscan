import { describe, expect, it } from "vitest";

import { isAddress, isBlockNumber, isCommitment, isHash } from "./search";

describe("isAddress", () => {
  it("should return true for a valid address", () => {
    const validAddress = "0x1234567890123456789012345678901234567890";
    expect(isAddress(validAddress)).toBe(true);
  });

  it("should return false for an invalid address", () => {
    const invalidAddress = "0x123456789012345678901234567890123456789";
    expect(isAddress(invalidAddress)).toBe(false);
  });
});

describe("isHash", () => {
  it("should return true for a valid hash", () => {
    const validHash =
      "0x1234567890123456789012345678901234567890123456789012345678901234";
    expect(isHash(validHash)).toBe(true);
  });

  it("should return false for an invalid hash", () => {
    const invalidHash =
      "0x123456789012345678901234567890123456789012345678901234567890123";
    expect(isHash(invalidHash)).toBe(false);
  });
});

describe("isCommitment", () => {
  it("should return true for a valid commitment", () => {
    const validCommitment =
      "0x940bd929a1b1f1003a28ad0e2bd24d3e536dc83f26acc0dd311ae39ececbd13cca4767cd7121c8343e3c68438ed20fa3";
    expect(isCommitment(validCommitment)).toBe(true);
  });

  it("should return false for an invalid commitment", () => {
    const invalidCommitment =
      "0x12345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901";
    expect(isCommitment(invalidCommitment)).toBe(false);
  });
});

describe("isBlockNumber", () => {
  it("should return true for a valid block number", () => {
    const validBlockNumber = "123";
    expect(isBlockNumber(validBlockNumber)).toBe(true);
  });

  it("should return false for an invalid block number", () => {
    const invalidBlockNumber = "abc";
    expect(isBlockNumber(invalidBlockNumber)).toBe(false);
  });
});
