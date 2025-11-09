import { Chain } from "../Chain";

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
