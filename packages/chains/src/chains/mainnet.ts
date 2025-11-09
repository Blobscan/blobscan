import { Chain } from "../Chain";

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
