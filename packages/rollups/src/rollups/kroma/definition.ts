import type { RollupDefinition } from "../../types";

export default {
  name: "Kroma",
  color: {
    light: "#8FB36F",
    dark: "#98CF61",
  },
  icon: "icon.svg",
  blobPosters: {
    "1": ["0x41b8cd6791de4d8f9e0eaf7861ac506822adce12"],
    "11155111": ["0xf15dc770221b99c98d4aaed568f2ab04b9d16e42"],
  },
} satisfies RollupDefinition;
