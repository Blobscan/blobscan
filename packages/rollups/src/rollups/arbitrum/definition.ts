import type { RollupDefinition } from "../../types";

export default {
  name: "Arbitrum",
  color: {
    light: "#5DA1EF",
    dark: "#10E1FF",
  },
  icon: "icon.svg",
  blobPosters: {
    "1": ["0xc1b634853cb333d3ad8663715b08f41a3aec47cc"],
    "11155111": [
      "0xb2248390842d3c4acf1d8a893954afc0eac586e5",
      "0x1fb1494f5135bb01a698fb3e863dd12f876bb085",
      "0x07f0e1ec1ce152b075fda4a827a9f17851086b25",
    ],
  },
} satisfies RollupDefinition;
