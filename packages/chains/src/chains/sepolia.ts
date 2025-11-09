import { Chain } from "../Chain";

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
