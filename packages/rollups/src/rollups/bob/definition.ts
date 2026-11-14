import type { RollupDefinition } from "../../types";

export default {
  name: "BoB",
  color: {
    light: "#D99E5A",
    dark: "#F5A13A",
  },
  icon: "icon.svg",
  blobPosters: {
    "1": [
      "0x08f9f14ff43e112b18c96f0986f28cb1878f1d11",
      "0x7cb1022d30b9860c36b243e7b181a1d46f618c69",
    ],
  },
} satisfies RollupDefinition;
