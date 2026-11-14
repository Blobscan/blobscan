import type { RollupDefinition } from "../../types";

export default {
  name: "Zircuit",
  color: {
    light: "#8CB18C",
    dark: "#A2C996",
  },
  icon: "icon.svg",
  blobPosters: {
    "1": [
      "0xaf1e4f6a47af647f87c0ec814d8032c4a4bff145",
      "0xcf8225801df6ef90ad3bc86808f574403a309de8",
    ],
    "11155111": ["0xa07FA473B87D7ADee161f458aF300255B65F33f6"],
  },
} satisfies RollupDefinition;
