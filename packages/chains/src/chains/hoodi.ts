import { Chain } from "../Chain";

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
