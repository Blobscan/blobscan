import { Chain } from "./Chain";

export const mainnet = new Chain(
  1,
  "mainnet",
  { number: 19_426_589 },
  {
    dencun: {
      activationDate: new Date("2024-03-13T13:55:00Z"),
      activationSlot: 8_626_176,
    },
    pectra: {
      activationDate: new Date("2025-05-07T10:05:11Z"),
      activationSlot: 11_649_024,
    },
    bpo1: {
      activationDate: new Date("2025-12-17T13:29:59Z"),
      activationSlot: 13_262_848,
    },
    bpo2: {
      activationDate: new Date("2026-01-07T01:01:11Z"),
      activationSlot: 13_410_304,
    },
  }
);

export const holesky = new Chain(
  167004,
  "holesky",
  { number: 894_735 },
  {
    dencun: {
      activationDate: new Date("2024-02-07T11:34:24Z"),
      activationSlot: 950_272,
    },
    pectra: {
      activationDate: new Date("2025-02-24T21:55:12Z"),
      activationSlot: 3_710_976,
    },
    bpo1: {
      activationDate: new Date("2025-10-07T01:20:00Z"),
      activationSlot: 5_324_800,
    },
    bpo2: {
      activationDate: new Date("2025-10-13T21:10:24Z"),
      activationSlot: 5_373_952,
    },
  }
);

export const hoodi = new Chain(
  560048,
  "hoodi",
  { number: 0 },
  {
    dencun: {
      activationDate: new Date("2025-03-17T12:00:00Z"),
      activationSlot: 0,
    },
    pectra: {
      activationDate: new Date("2025-03-26T14:37:12Z"),
      activationSlot: 65_536,
    },
    bpo1: {
      activationDate: new Date("2025-11-05T18:02:00Z"),
      activationSlot: 1_679_360,
    },
    bpo2: {
      activationDate: new Date("2025-11-12T13:52:24Z"),
      activationSlot: 1_728_512,
    },
  }
);

export const sepolia = new Chain(
  11155111,
  "sepolia",
  { number: 5_187_052 },
  {
    dencun: {
      activationDate: new Date("2024-01-30T22:51:12Z"),
      activationSlot: 4_243_456,
    },
    pectra: {
      activationDate: new Date("2025-03-05T07:29:36Z"),
      activationSlot: 7_118_848,
    },
    bpo1: {
      activationDate: new Date("2025-10-21T03:26:24Z"),
      activationSlot: 8_773_632,
    },
    bpo2: {
      activationDate: new Date("2025-10-27T23:16:48Z"),
      activationSlot: 8_882_784,
    },
  }
);

export const gnosis = new Chain(
  100,
  "gnosis",
  { number: 32_880_709 },
  {
    dencun: {
      activationDate: new Date("2024-03-11T18:30:20Z"),
      activationSlot: 14_237_696,
    },
    pectra: {
      activationDate: new Date("2025-04-30T14:03:40Z"),
      activationSlot: 21_405_696,
    },
  }
);
