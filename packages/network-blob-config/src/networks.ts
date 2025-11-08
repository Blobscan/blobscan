import { Network } from "./Network";

export const mainnet = new Network(
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
  }
);

export const holesky = new Network(
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
  }
);

export const hoodi = new Network(
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
  }
);

export const sepolia = new Network(
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
  }
);

export const gnosis = new Network(
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
