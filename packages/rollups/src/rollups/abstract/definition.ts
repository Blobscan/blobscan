import type { RollupDefinition } from "../../types";

export default {
  name: "Abstract",
  color: {
    light: "#5CB48B",
    dark: "#34D98B",
  },
  icon: "icon.svg",
  blobPosters: {
    "1": [
      "0x11805594be0229ef08429d775af0c55f7c4535de",
      "0x4b2d036d2c27192549ad5a2f2d9875e1843833de",
      "0x6be789605b13edb78749824633b9933d44b582ba",
    ],
    "11155111": ["0x564D33DE40b1af31aAa2B726Eaf9Dafbaf763577"],
  },
} satisfies RollupDefinition;
