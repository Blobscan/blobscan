import type { RollupDefinition } from "../../types";

export default {
  name: "Mode",
  color: {
    light: "#BAA85C",
    dark: "#E4C34F",
  },
  icon: "icon.svg",
  blobPosters: {
    "1": ["0x99199a22125034c808ff20f377d91187e8050f2e"],
    "11155111": ["0x4e6bd53883107b063c502ddd49f9600dc51b3ddc"],
  },
} satisfies RollupDefinition;
