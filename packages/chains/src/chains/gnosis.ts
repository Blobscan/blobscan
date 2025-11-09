import { Chain } from "../Chain";

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
