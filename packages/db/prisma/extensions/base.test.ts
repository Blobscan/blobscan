import { describe, expect, it } from "vitest";

import { updateAddressData } from "./base";

describe("updateAddressData", () => {
  it("should add a new address as sender", () => {
    const addresses = {};
    updateAddressData(addresses, "0x123456789abc", 5, true);

    expect(addresses).toEqual({
      "0x123456789abc": {
        address: "0x123456789abc",
        firstBlockNumberAsSender: 5,
        firstBlockNumberAsReceiver: null,
      },
    });
  });

  it("should add a new address as receiver", () => {
    const addresses = {};
    updateAddressData(addresses, "0x123456789abc", 5, false);

    expect(addresses).toEqual({
      "0x123456789abc": {
        address: "0x123456789abc",
        firstBlockNumberAsSender: null,
        firstBlockNumberAsReceiver: 5,
      },
    });
  });

  it("should update an existing address as sender", () => {
    const addresses = {
      "0x123456789abc": {
        address: "0x123456789abc",
        firstBlockNumberAsSender: null,
        firstBlockNumberAsReceiver: 4,
      },
    };
    updateAddressData(addresses, "0x123456789abc", 5, true);

    expect(addresses).toEqual({
      "0x123456789abc": {
        address: "0x123456789abc",
        firstBlockNumberAsSender: 5,
        firstBlockNumberAsReceiver: 4,
      },
    });
  });

  it("should update an existing address as receiver", () => {
    const addresses = {
      "0x123456789abc": {
        address: "0x123456789abc",
        firstBlockNumberAsSender: 4,
        firstBlockNumberAsReceiver: null,
      },
    };
    updateAddressData(addresses, "0x123456789abc", 5, false);

    expect(addresses).toEqual({
      "0x123456789abc": {
        address: "0x123456789abc",
        firstBlockNumberAsSender: 4,
        firstBlockNumberAsReceiver: 5,
      },
    });
  });
});
