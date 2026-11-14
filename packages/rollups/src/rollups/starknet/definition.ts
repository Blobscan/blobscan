import type { RollupDefinition } from "../../types";

export default {
  name: "Starknet",
  color: {
    light: "#DA9992",
    dark: "#EC9589",
  },
  icon: "icon.svg",
  blobPosters: {
    "1": ["0x2c169dfe5fbba12957bdd0ba47d9cedbfe260ca7"],
    "11155111": ["0x5b98b836969a60fec50fa925905dd1d382a7db43"],
  },
} satisfies RollupDefinition;
