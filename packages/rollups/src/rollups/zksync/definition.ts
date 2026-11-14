import type { RollupDefinition } from "../../types";

export default {
  name: "zkSync",
  color: {
    light: "#818CAB",
    dark: "#99A8D2",
  },
  icon: "icon.svg",
  blobPosters: {
    "1": [
      "0x0d3250c3d5facb74ac15834096397a3ef790ec99",
      "0xe1d8d4c8656949764c2c9fa9fab2c15d3f42e6c2",
    ],
  },
} satisfies RollupDefinition;
